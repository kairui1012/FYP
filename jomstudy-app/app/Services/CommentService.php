<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class CommentService
{
    public function __construct(private readonly PointsService $pointsService) {}

    public function create(Post $post, User $user, string $content, ?int $parentId): Comment
    {
        if ($parentId && ! Comment::query()->whereKey($parentId)->where('post_id', $post->id)->exists()) {
            throw ValidationException::withMessages(['parent_id' => 'The selected reply target is invalid.']);
        }

        $comment = $post->comments()->create([
            'user_id' => $user->id, 'parent_id' => $parentId, 'content' => $content,
        ]);
        $this->pointsService->award($user, 'answer_posted', $comment);

        return $comment->load($this->relations());
    }

    public function update(Comment $comment, string $content): ?Post
    {
        $comment->update(['content' => $content]);

        return $comment->post;
    }

    public function delete(Comment $comment): ?Post
    {
        $post = $comment->post;
        if (! $post) {
            return null;
        }

        DB::transaction(function () use ($comment): void {
            $commentIds = $this->branchIds($comment->id);
            $this->revokeBranchPoints($commentIds);
            DB::table('comment_likes')->whereIn('comment_id', $commentIds)->delete();
            Comment::query()->whereIn('id', $commentIds)->delete();
        });

        return $post;
    }

    /** @return array{comments_count: int, comments: array<int, mixed>} */
    public function treePayload(Post $post, ?int $userId): array
    {
        $supportsVotes = $this->supportsVotes();

        try {
            $comments = $this->commentsQuery($post, $userId, $supportsVotes)->get();
        } catch (QueryException $exception) {
            if (! $supportsVotes || ! $this->isVoteColumnMissing($exception)) {
                throw $exception;
            }
            $comments = $this->commentsQuery($post, $userId, false)->get();
        }

        return ['comments_count' => $post->comments()->count(), 'comments' => $this->tree($comments, $userId)];
    }

    public function serialize(Comment $comment, ?int $userId): array
    {
        $upvotes = (int) ($comment->upvotes_count ?? $comment->likes_count ?? 0);
        $downvotes = (int) ($comment->downvotes_count ?? 0);
        $wrongVotes = (int) ($comment->wrong_votes_count ?? 0);
        $userVote = $this->resolveUserVote($comment);

        return [
            'id' => $comment->id, 'parent_id' => $comment->parent_id,
            'depth' => (int) ($comment->depth ?? 1), 'content' => $comment->content,
            'attachments' => $comment->attachments, 'mentions' => $comment->mentions,
            'created_at' => optional($comment->created_at)->toISOString(),
            'likes_count' => $upvotes, 'upvotes_count' => $upvotes,
            'downvotes_count' => $downvotes, 'wrong_votes_count' => $wrongVotes,
            'score' => $upvotes - $downvotes - (2 * $wrongVotes), 'user_vote' => $userVote,
            'is_liked' => $userVote === 1, 'is_upvoted' => $userVote === 1,
            'is_downvoted' => $userVote === -1, 'is_wrong' => $userVote === -2,
            'reply_to_user' => $comment->parent?->user ? [
                'id' => $comment->parent->user->id, 'name' => $comment->parent->user->name,
                'avatar' => $this->avatar($comment->parent->user),
            ] : null,
            'replies' => [],
            'user' => $comment->user ? [
                'id' => $comment->user->id, 'name' => $comment->user->name,
                'avatar' => $this->avatar($comment->user),
            ] : null,
        ];
    }

    private function commentsQuery(Post $post, ?int $userId, bool $supportsVotes)
    {
        $query = $post->comments()->with($this->relations());
        if (! $supportsVotes) {
            return $query->withCount('likes')->withExists([
                'likes as is_liked' => fn ($likeQuery) => $likeQuery->where('user_id', $userId),
            ]);
        }

        return $query->withCount([
            'votes as upvotes_count' => fn ($voteQuery) => $voteQuery->where('vote', 1),
            'votes as downvotes_count' => fn ($voteQuery) => $voteQuery->where('vote', -1),
            'votes as wrong_votes_count' => fn ($voteQuery) => $voteQuery->where('vote', -2),
        ])->withExists([
            'votes as is_upvoted' => fn ($voteQuery) => $voteQuery->where('user_id', $userId)->where('vote', 1),
            'votes as is_downvoted' => fn ($voteQuery) => $voteQuery->where('user_id', $userId)->where('vote', -1),
            'votes as is_wrong' => fn ($voteQuery) => $voteQuery->where('user_id', $userId)->where('vote', -2),
        ]);
    }

    private function resolveUserVote(Comment $comment): int
    {
        if ((bool) ($comment->is_upvoted ?? false)) {
            return 1;
        }

        if ((bool) ($comment->is_downvoted ?? false)) {
            return -1;
        }

        if ((bool) ($comment->is_wrong ?? false)) {
            return -2;
        }

        return (int) ($comment->is_liked ?? 0);
    }

    private function relations(): array
    {
        return [
            'user:id,name', 'user.socialAccounts:id,user_id,avatar', 'parent:id,user_id',
            'parent.user:id,name', 'parent.user.socialAccounts:id,user_id,avatar',
        ];
    }

    /** @param int[] $commentIds */
    private function revokeBranchPoints(array $commentIds): void
    {
        Comment::query()->with('user:id')->whereIn('id', $commentIds)->get()->each(function ($comment) {
            if ($comment->user) {
                $this->pointsService->revoke($comment->user, 'answer_posted', $comment);
            }
        });
        CommentLike::query()->with('comment.user:id')->whereIn('comment_id', $commentIds)->get()->each(function ($like) {
            if ($owner = $like->comment?->user) {
                $this->pointsService->revoke($owner, ((int) ($like->vote ?? 1)) === 1 ? 'answer_upvoted' : 'content_downvoted', $like);
            }
        });
    }

    /** @return int[] */
    private function branchIds(int $rootId): array
    {
        $all = [$rootId];
        $frontier = [$rootId];
        while ($frontier !== []) {
            $frontier = Comment::query()->whereIn('parent_id', $frontier)->pluck('id')->map(fn ($id) => (int) $id)->all();
            $all = [...$all, ...$frontier];
        }

        return array_values(array_unique($all));
    }

    private function tree(Collection $comments, ?int $userId, ?int $parentId = null, int $depth = 1): array
    {
        return $comments->filter(fn (Comment $comment) => $comment->parent_id === $parentId)
            ->sort(fn (Comment $left, Comment $right) => $this->compare($left, $right))->values()
            ->map(function (Comment $comment) use ($comments, $userId, $depth) {
                $comment->setAttribute('depth', $depth);

                return [...$this->serialize($comment, $userId), 'replies' => $this->tree($comments, $userId, $comment->id, $depth + 1)];
            })->all();
    }

    private function compare(Comment $left, Comment $right): int
    {
        $score = fn (Comment $comment) => (int) ($comment->upvotes_count ?? 0)
            - (int) ($comment->downvotes_count ?? 0) - (2 * (int) ($comment->wrong_votes_count ?? 0));
        if ($score($left) !== $score($right)) {
            return $score($right) <=> $score($left);
        }

        return ((int) ($right->upvotes_count ?? 0) <=> (int) ($left->upvotes_count ?? 0))
            ?: (($left->created_at?->getTimestamp() ?? 0) <=> ($right->created_at?->getTimestamp() ?? 0));
    }

    private function avatar(User $user): ?string
    {
        $accounts = $user->relationLoaded('socialAccounts')
            ? $user->socialAccounts : $user->socialAccounts()->select(['id', 'user_id', 'avatar'])->get();

        return $accounts->first(fn ($account) => ! empty($account->avatar))?->avatar;
    }

    private function supportsVotes(): bool
    {
        try {
            return Schema::hasColumn('comment_likes', 'vote');
        } catch (\Throwable) {
            return false;
        }
    }

    private function isVoteColumnMissing(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, "unknown column 'vote'") || str_contains($message, 'unknown column `vote`');
    }
}

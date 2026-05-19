<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\Post;
use App\Models\User;
use App\Services\PointsService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class CommentController extends Controller
{
    public function __construct(private readonly PointsService $pointsService) {}

    public function store(Request $request, Post $post)
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'max:1000'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
        ]);

        $parentId = isset($validated['parent_id'])
            ? (int) $validated['parent_id']
            : null;

        if ($parentId !== null) {
            $parentComment = Comment::query()
                ->where('id', $parentId)
                ->where('post_id', $post->id)
                ->first();

            if (! $parentComment) {
                throw ValidationException::withMessages([
                    'parent_id' => 'The selected reply target is invalid.',
                ]);
            }
        }

        $content = trim((string) ($validated['content'] ?? ''));

        if ($content === '') {
            throw ValidationException::withMessages([
                'content' => 'Please write a comment before posting.',
            ]);
        }

        $comment = $post->comments()->create([
            'user_id' => Auth::id(),
            'parent_id' => $parentId,
            'content' => $content,
        ]);

        if ($request->user()) {
            $this->pointsService->award($request->user(), 'answer_posted', $comment);
        }

        $comment->load([
            'user:id,name',
            'user.socialAccounts:id,user_id,avatar',
            'parent:id,user_id',
            'parent.user:id,name',
            'parent.user.socialAccounts:id,user_id,avatar',
        ]);

        if ($request->expectsJson()) {
            $supportsCommentVotes = $this->supportsCommentVotes();

            try {
                $refreshedComments = $this->buildRefreshedCommentsQuery($post, $supportsCommentVotes)->get();
            } catch (QueryException $exception) {
                if (! $supportsCommentVotes || ! $this->isVoteColumnMissingException($exception)) {
                    throw $exception;
                }

                $supportsCommentVotes = false;
                $refreshedComments = $this->buildRefreshedCommentsQuery($post, false)->get();
            }

            return response()->json([
                'comment' => $this->serializeComment($comment),
                'comments_count' => $post->comments()->count(),
                'comments' => $this->buildCommentTree($refreshedComments),
            ], 201);
        }

        return back();
    }

    public function update(Request $request, Comment $comment): JsonResponse
    {
        if ((int) $comment->user_id !== (int) Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:1000'],
        ]);

        $content = trim((string) ($validated['content'] ?? ''));

        if ($content === '') {
            throw ValidationException::withMessages([
                'content' => 'Please write a comment before updating.',
            ]);
        }

        $comment->update([
            'content' => $content,
        ]);

        $post = $comment->post;
        if (! $post) {
            return response()->json([
                'comments' => [],
                'comments_count' => 0,
            ]);
        }

        $supportsCommentVotes = $this->supportsCommentVotes();

        try {
            $refreshedComments = $this->buildRefreshedCommentsQuery($post, $supportsCommentVotes)->get();
        } catch (QueryException $exception) {
            if (! $supportsCommentVotes || ! $this->isVoteColumnMissingException($exception)) {
                throw $exception;
            }

            $supportsCommentVotes = false;
            $refreshedComments = $this->buildRefreshedCommentsQuery($post, false)->get();
        }

        return response()->json([
            'comments_count' => $post->comments()->count(),
            'comments' => $this->buildCommentTree($refreshedComments),
        ]);
    }

    public function destroy(Comment $comment): JsonResponse
    {
        if ((int) $comment->user_id !== (int) Auth::id()) {
            abort(403);
        }

        $post = $comment->post;
        if (! $post) {
            return response()->json([
                'comments' => [],
                'comments_count' => 0,
            ]);
        }

        DB::transaction(function () use ($comment): void {
            $commentIds = $this->collectCommentBranchIds($comment->id);
            $this->revokeCommentBranchPoints($commentIds);

            DB::table('comment_likes')
                ->whereIn('comment_id', $commentIds)
                ->delete();

            Comment::query()
                ->whereIn('id', $commentIds)
                ->delete();
        });

        $supportsCommentVotes = $this->supportsCommentVotes();

        try {
            $refreshedComments = $this->buildRefreshedCommentsQuery($post, $supportsCommentVotes)->get();
        } catch (QueryException $exception) {
            if (! $supportsCommentVotes || ! $this->isVoteColumnMissingException($exception)) {
                throw $exception;
            }

            $supportsCommentVotes = false;
            $refreshedComments = $this->buildRefreshedCommentsQuery($post, false)->get();
        }

        return response()->json([
            'comments_count' => $post->comments()->count(),
            'comments' => $this->buildCommentTree($refreshedComments),
        ]);
    }

    /**
     * @param  int[]  $commentIds
     */
    private function revokeCommentBranchPoints(array $commentIds): void
    {
        $comments = Comment::query()
            ->with('user:id')
            ->whereIn('id', $commentIds)
            ->get();

        foreach ($comments as $branchComment) {
            if ($branchComment->user) {
                $this->pointsService->revoke($branchComment->user, 'answer_posted', $branchComment);
            }
        }

        $commentLikes = CommentLike::query()
            ->with('comment.user:id')
            ->whereIn('comment_id', $commentIds)
            ->get();

        foreach ($commentLikes as $commentLike) {
            $owner = $commentLike->comment?->user;

            if (! $owner) {
                continue;
            }

            $action = ((int) ($commentLike->vote ?? 1)) === 1
                ? 'answer_upvoted'
                : 'content_downvoted';

            $this->pointsService->revoke($owner, $action, $commentLike);
        }
    }

    private function collectCommentBranchIds(int $rootCommentId): array
    {
        $allIds = [$rootCommentId];
        $frontier = [$rootCommentId];

        while (count($frontier) > 0) {
            $children = Comment::query()
                ->whereIn('parent_id', $frontier)
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->all();

            if (count($children) === 0) {
                break;
            }

            $allIds = [...$allIds, ...$children];
            $frontier = $children;
        }

        return array_values(array_unique($allIds));
    }

    private function buildRefreshedCommentsQuery(Post $post, bool $supportsCommentVotes)
    {
        $refreshedComments = $post->comments()
            ->with([
                'user:id,name',
                'user.socialAccounts:id,user_id,avatar',
                'parent:id,user_id',
                'parent.user:id,name',
                'parent.user.socialAccounts:id,user_id,avatar',
            ]);

        if ($supportsCommentVotes) {
            return $refreshedComments
                ->with([
                    'votes:id,user_id,comment_id,vote',
                ])
                ->withCount([
                    'votes as upvotes_count' => fn ($voteQuery) => $voteQuery->where('vote', 1),
                    'votes as downvotes_count' => fn ($voteQuery) => $voteQuery->where('vote', -1),
                    'votes as wrong_votes_count' => fn ($voteQuery) => $voteQuery->where('vote', -2),
                ])
                ->withExists([
                    'votes as is_upvoted' => fn ($voteQuery) => $voteQuery->where('user_id', Auth::id())->where('vote', 1),
                    'votes as is_downvoted' => fn ($voteQuery) => $voteQuery->where('user_id', Auth::id())->where('vote', -1),
                    'votes as is_wrong' => fn ($voteQuery) => $voteQuery->where('user_id', Auth::id())->where('vote', -2),
                ]);
        }

        return $refreshedComments
            ->withCount('likes')
            ->withExists([
                'likes as is_liked' => fn ($likeQuery) => $likeQuery->where('user_id', Auth::id()),
            ]);
    }

    private function supportsCommentVotes(): bool
    {
        try {
            return Schema::hasColumn('comment_likes', 'vote');
        } catch (\Throwable) {
            return false;
        }
    }

    private function isVoteColumnMissingException(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, "unknown column 'vote'")
            || str_contains($message, 'unknown column `vote`');
    }

    private function serializeComment(Comment $comment): array
    {
        $upvotesCount = (int) ($comment->upvotes_count ?? $comment->likes_count ?? 0);
        $downvotesCount = (int) ($comment->downvotes_count ?? 0);
        $wrongVotesCount = (int) ($comment->wrong_votes_count ?? 0);
        $score = $upvotesCount - $downvotesCount - (2 * $wrongVotesCount);
        $currentUserId = Auth::id();
        $userVote = 0;

        if ($comment->relationLoaded('votes') && $currentUserId) {
            $userVote = (int) ($comment->votes
                ->firstWhere('user_id', $currentUserId)
                ?->vote ?? 0);
        } else {
            $userVote = (int) ($comment->is_liked ?? 0);
        }

        return [
            'id' => $comment->id,
            'parent_id' => $comment->parent_id,
            'depth' => (int) ($comment->depth ?? 1),
            'content' => $comment->content,
            'attachments' => $comment->attachments,
            'mentions' => $comment->mentions,
            'created_at' => optional($comment->created_at)->toISOString(),
            'likes_count' => $upvotesCount,
            'upvotes_count' => $upvotesCount,
            'downvotes_count' => $downvotesCount,
            'wrong_votes_count' => $wrongVotesCount,
            'score' => $score,
            'user_vote' => $userVote,
            'is_liked' => $userVote === 1,
            'is_upvoted' => $userVote === 1,
            'is_downvoted' => $userVote === -1,
            'is_wrong' => $userVote === -2,
            'reply_to_user' => $comment->parent?->user ? [
                'id' => $comment->parent->user->id,
                'name' => $comment->parent->user->name,
                'avatar' => $this->resolveAvatar($comment->parent->user),
            ] : null,
            'replies' => [],
            'user' => $comment->user ? [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'avatar' => $this->resolveAvatar($comment->user),
            ] : null,
        ];
    }

        private function buildCommentTree(Collection $comments, ?int $parentId = null, int $depth = 1): array
    {
        return $comments
            ->filter(fn (Comment $comment) => $comment->parent_id === $parentId)
            ->sort(function (Comment $left, Comment $right) {
                return $this->compareComments($left, $right);
            })
            ->values()
            ->map(function (Comment $comment) use ($comments, $depth) {
                $comment->setAttribute('depth', $depth);

                return [
                    ...$this->serializeComment($comment),
                    'replies' => $this->buildCommentTree($comments, $comment->id, $depth + 1),
                ];
            })
            ->all();
    }

    private function compareComments(Comment $left, Comment $right): int
    {
        $leftScore = (int) ($left->upvotes_count ?? 0)
            - (int) ($left->downvotes_count ?? 0)
            - (2 * (int) ($left->wrong_votes_count ?? 0));
        $rightScore = (int) ($right->upvotes_count ?? 0)
            - (int) ($right->downvotes_count ?? 0)
            - (2 * (int) ($right->wrong_votes_count ?? 0));

        if ($leftScore !== $rightScore) {
            return $rightScore <=> $leftScore;
        }

        $leftUpvotes = (int) ($left->upvotes_count ?? 0);
        $rightUpvotes = (int) ($right->upvotes_count ?? 0);

        if ($leftUpvotes !== $rightUpvotes) {
            return $rightUpvotes <=> $leftUpvotes;
        }

        return ($left->created_at?->getTimestamp() ?? 0) <=> ($right->created_at?->getTimestamp() ?? 0);
    }

    private function resolveAvatar(User $user): ?string
    {
        $socialAccounts = $user->relationLoaded('socialAccounts')
            ? $user->socialAccounts
            : $user->socialAccounts()->select(['id', 'user_id', 'avatar'])->get();

        return $socialAccounts
            ->first(fn ($account) => ! empty($account->avatar))
            ?->avatar;
    }
}

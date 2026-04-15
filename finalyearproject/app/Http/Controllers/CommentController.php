<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\CommentLike;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CommentController extends Controller
{
    public function mentionables(Request $request, Post $post): JsonResponse
    {
        $query = trim((string) $request->query('query', ''));

        if ($query !== '') {
            $users = User::query()
                ->with(['socialAccounts:id,user_id,avatar'])
                ->where('name', 'like', '%' . $query . '%')
                ->orderBy('name')
                ->limit(8)
                ->get();
        } else {
            $priorityIds = collect([
                $request->user()?->id,
                $post->user_id,
            ])
                ->filter()
                ->merge(
                    $post->comments()
                        ->latest()
                        ->limit(20)
                        ->pluck('user_id'),
                )
                ->unique()
                ->values();

            $priorityUsers = User::query()
                ->with(['socialAccounts:id,user_id,avatar'])
                ->whereIn('id', $priorityIds)
                ->get()
                ->sortBy(fn (User $user) => $priorityIds->search($user->id))
                ->values();

            $fallbackUsers = collect();

            if ($priorityUsers->count() < 8) {
                $fallbackUsers = User::query()
                    ->with(['socialAccounts:id,user_id,avatar'])
                    ->whereNotIn('id', $priorityUsers->pluck('id'))
                    ->orderBy('name')
                    ->limit(8 - $priorityUsers->count())
                    ->get();
            }

            $users = $priorityUsers
                ->concat($fallbackUsers)
                ->take(8)
                ->values();
        }

        return response()->json([
            'data' => $users
                ->map(fn (User $user) => $this->serializeMentionable($user))
                ->values()
                ->all(),
        ]);
    }

    public function store(Request $request, Post $post)
    {
        $validated = $request->validate([
            'content' => ['nullable', 'string', 'max:1000'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
            'attachments' => ['nullable', 'array', 'max:4'],
            'attachments.*' => ['file', 'image', 'mimetypes:image/jpeg,image/png,image/webp,image/gif', 'max:5120'],
            'mentions' => ['nullable', 'string'],
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
        $uploadedAttachments = $request->file('attachments', []);

        if ($content === '' && count($uploadedAttachments) === 0) {
            throw ValidationException::withMessages([
                'content' => 'Please write a comment or add at least one image.',
            ]);
        }

        $storedAttachments = [];

        foreach ($uploadedAttachments as $file) {
            $storedAttachments[] = $file->store('comments', 'public');
        }

        $mentions = $this->normalizeMentions(
            $request->input('mentions'),
            $content,
        );

        $comment = $post->comments()->create([
            'user_id' => Auth::id(),
            'parent_id' => $parentId,
            'content' => $content,
            'attachments' => count($storedAttachments) > 0 ? $storedAttachments : null,
            'mentions' => count($mentions) > 0 ? $mentions : null,
        ]);

        $comment->load([
            'user:id,name',
            'user.socialAccounts:id,user_id,avatar',
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

    private function buildRefreshedCommentsQuery(Post $post, bool $supportsCommentVotes)
    {
        $refreshedComments = $post->comments()
            ->with([
                'user:id,name',
                'user.socialAccounts:id,user_id,avatar',
            ]);

        if ($supportsCommentVotes) {
            return $refreshedComments
                ->with([
                    'votes:id,user_id,comment_id,vote',
                ])
                ->withCount([
                    'votes as upvotes_count' => fn ($voteQuery) => $voteQuery->where('vote', 1),
                    'votes as downvotes_count' => fn ($voteQuery) => $voteQuery->where('vote', -1),
                ])
                ->withExists([
                    'votes as is_upvoted' => fn ($voteQuery) => $voteQuery->where('user_id', Auth::id())->where('vote', 1),
                    'votes as is_downvoted' => fn ($voteQuery) => $voteQuery->where('user_id', Auth::id())->where('vote', -1),
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

    private function normalizeMentions(mixed $encodedMentions, string $content): array
    {
        if (! is_string($encodedMentions) || trim($encodedMentions) === '') {
            return [];
        }

        $decodedMentions = json_decode($encodedMentions, true);

        if (! is_array($decodedMentions)) {
            return [];
        }

        $mentionedUserIds = collect($decodedMentions)
            ->map(
                fn ($mention) => is_array($mention)
                    ? (int) ($mention['id'] ?? 0)
                    : 0,
            )
            ->filter()
            ->unique()
            ->values();

        if ($mentionedUserIds->isEmpty()) {
            return [];
        }

        $users = User::query()
            ->with(['socialAccounts:id,user_id,avatar'])
            ->whereIn('id', $mentionedUserIds)
            ->get()
            ->keyBy('id');

        return $mentionedUserIds
            ->map(function (int $userId) use ($users, $content) {
                /** @var User|null $user */
                $user = $users->get($userId);

                if (! $user) {
                    return null;
                }

                $handle = $this->buildHandle($user);

                if (! Str::contains($content, '@' . $handle)) {
                    return null;
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'handle' => $handle,
                    'avatar' => $this->resolveAvatar($user),
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function serializeMentionable(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'handle' => $this->buildHandle($user),
            'avatar' => $this->resolveAvatar($user),
        ];
    }

    private function serializeComment(Comment $comment): array
    {
        $upvotesCount = (int) ($comment->upvotes_count ?? $comment->likes_count ?? 0);
        $downvotesCount = (int) ($comment->downvotes_count ?? 0);
        $score = $upvotesCount - $downvotesCount;
        $userVote = $comment->relationLoaded('votes') ? (int) ($comment->votes->first()?->vote ?? 0) : (int) ($comment->is_liked ?? 0);

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
            'score' => $score,
            'user_vote' => $userVote,
            'is_liked' => $userVote === 1,
            'is_upvoted' => $userVote === 1,
            'is_downvoted' => $userVote === -1,
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
        $leftScore = (int) ($left->upvotes_count ?? 0) - (int) ($left->downvotes_count ?? 0);
        $rightScore = (int) ($right->upvotes_count ?? 0) - (int) ($right->downvotes_count ?? 0);

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

    private function buildHandle(User $user): string
    {
        $base = Str::of($user->name)
            ->lower()
            ->ascii()
            ->replaceMatches('/[^a-z0-9]+/', '-')
            ->trim('-')
            ->value();

        if ($base === '') {
            $base = 'user';
        }

        return $base . '-' . $user->id;
    }
}

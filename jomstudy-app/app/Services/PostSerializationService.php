<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class PostSerializationService
{
    /**
     * Service that converts `Post` models into the unified array structure
     * expected by the front-end API. Handles normalization of fields,
     * relation serialization, comment tree construction, and small
     * compatibility fixes (e.g. image normalization).
     *
     * Injected into controllers that return post data to clients.
     */
    public function __construct(private readonly LeaderboardTitleService $leaderboardTitleService) {}

    /**
     * Serialize a single Post model into an array suitable for JSON responses.
     *
     * @param  Post  $post  The post to serialize (may have relations preloaded)
     * @param  array  $followingIds  List of user ids that the current user follows
     * @return array Normalized post data for the API
     */
    public function serialize(Post $post, array $followingIds = []): array
    {
        $currentUserId = Auth::id();
        $images = $post->image;
        // Normalize `image` field to always be an array of strings.
        if (is_string($images)) {
            $images = trim($images) === '' ? [] : [$images];
        } elseif (! is_array($images)) {
            $images = [];
        }

        return [
            'id' => $post->id,
            'title' => $post->title,
            'content' => $post->content,
            'content_blocks' => $post->content_blocks,
            'post_type' => $post->post_type,
            'quiz_data' => $post->quiz_data,
            'image' => $images,
            'parent_material_id' => $post->parent_material_id,
            'material_improved_from_feedback' => (bool) ($post->material_improved_from_feedback ?? false),
            'created_at' => optional($post->created_at)->toISOString(),
            'updated_at' => optional($post->updated_at)->toISOString(),
            'saved_at' => optional($post->saved_at)->toISOString(),
            'is_anonymous' => (bool) ($post->is_anonymous ?? false),
            // Ownership flag for the currently authenticated user.
            'is_owner' => $currentUserId !== null && (int) $post->user_id === (int) $currentUserId,
            // Serialized user info (null for anonymous posts).
            'user' => $this->serializeUser($post, $followingIds),
            'language' => $this->serializeLanguage($post),
            'subject' => $this->serializeSubject($post),
            'lesson' => $this->serializeLesson($post),
            'is_lesson_completed' => (bool) ($post->is_lesson_completed ?? false),
            'is_quiz_completed' => (bool) ($post->is_quiz_completed ?? false),
            'quiz_attempts' => is_array($post->quiz_attempts ?? null) ? $post->quiz_attempts : [],
            'material_learning_state' => is_string($post->material_learning_state ?? null) ? $post->material_learning_state : null,
            'material_learning_path' => is_array($post->material_learning_path ?? null) ? $post->material_learning_path : [],
            'material_feedback_summary' => is_array($post->material_feedback_summary ?? null) ? $post->material_feedback_summary : null,
            'material_user_feedback' => is_array($post->material_user_feedback ?? null) ? $post->material_user_feedback : null,
            'learning_analytics' => is_array($post->learning_analytics ?? null) ? $post->learning_analytics : null,
            'linked_quizzes' => is_array($post->linked_quizzes ?? null) ? $post->linked_quizzes : [],
            'likes_count' => $post->likes_count,
            'comments_count' => $post->comments_count,
            'saves_count' => $post->saves_count,
            'is_liked' => (bool) ($post->is_liked ?? false),
            'is_saved' => (bool) ($post->is_saved ?? false),
            // If comments are preloaded, build a nested tree; otherwise
            // return null so the caller can choose to lazy-load comments.
            'comments' => $post->relationLoaded('comments')
                ? $this->buildCommentTree($post->comments)
                : null,
        ];
    }

    /**
     * Serialize user information. Returns null for anonymous posts to avoid
     * leaking the author's identity.
     */
    private function serializeUser(Post $post, array $followingIds): ?array
    {
        if ($post->is_anonymous) {
            return null;
        }

        if (! $post->user) {
            return null;
        }

        return [
            'id' => $post->user->id,
            'name' => $post->user->name,
            'role' => $post->user->role ?? 'student',
            'is_verified' => (bool) ($post->user->is_verified ?? false),
            'avatar' => $post->user->socialAccounts
                ->first(fn ($account) => ! empty($account->avatar))
                ?->avatar,
            'leaderboard_title' => $this->leaderboardTitleService->titleForUserId($post->user->id),
            'is_following' => in_array($post->user->id, $followingIds, true),
        ];
    }

    /**
     * Serialize language relation to a compact array or return null if
     * no language is associated with the post.
     */
    private function serializeLanguage(Post $post): ?array
    {
        if (! $post->language) {
            return null;
        }

        return [
            'code' => $post->language->code,
            'name' => $post->language->name,
        ];
    }

    /**
     * Serialize subject relation to a compact array or return null if
     * no subject is associated with the post.
     */
    private function serializeSubject(Post $post): ?array
    {
        if (! $post->subject) {
            return null;
        }

        return [
            'id' => $post->subject->id,
            'name' => $post->subject->name,
        ];
    }

    /**
     * Serialize lesson relation to a compact array or return null if no
     * lesson is associated with the post.
     */
    private function serializeLesson(Post $post): ?array
    {
        if (! $post->lesson) {
            return null;
        }

        return [
            'id' => $post->lesson->id,
            'title' => $post->lesson->title,
            'sequence' => (int) $post->lesson->sequence,
        ];
    }

    /**
     * Convert a flat collection of Comment models into a nested tree.
     *
     * @param  Collection  $comments  Flat collection of Comment models
     * @param  int|null  $parentId  Parent id to filter children for (used
     *                              recursively)
     * @param  int  $depth  Current depth in the comment tree (used for
     *                      presentation/limitations)
     * @return array Nested comments array
     */
    private function buildCommentTree(Collection $comments, ?int $parentId = null, int $depth = 1): array
    {
        return $comments
            ->filter(fn (Comment $comment) => $comment->parent_id === $parentId)
            ->sort(fn (Comment $left, Comment $right) => $this->compareComments($left, $right))
            ->values()
            ->map(function (Comment $comment) use ($comments, $depth) {
                $comment->setAttribute('score', $this->calculateCommentScore($comment));

                return [
                    ...$this->serializeComment($comment, $depth),
                    'replies' => $this->buildCommentTree($comments, $comment->id, $depth + 1),
                ];
            })
            ->all();
    }

    /**
     * Serialize a single Comment model into an array used by the API.
     * Adds vote counts, computed score, and nested reply info when available.
     */
    private function serializeComment(Comment $comment, int $depth): array
    {
        $upvotesCount = (int) ($comment->upvotes_count ?? $comment->likes_count ?? 0);
        $downvotesCount = (int) ($comment->downvotes_count ?? 0);
        $wrongVotesCount = (int) ($comment->wrong_votes_count ?? 0);
        $score = (int) ($comment->score ?? ($upvotesCount - $downvotesCount - (2 * $wrongVotesCount)));
        $userVote = $this->resolveUserVote($comment);

        return [
            'id' => $comment->id,
            'parent_id' => $comment->parent_id,
            'depth' => $depth,
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
                'avatar' => $comment->parent->user->socialAccounts
                    ->first(fn ($account) => ! empty($account->avatar))
                    ?->avatar,
                'leaderboard_title' => $this->leaderboardTitleService->titleForUserId($comment->parent->user->id),
            ] : null,
            'user' => $comment->user ? [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'role' => $comment->user->role ?? 'student',
                'is_verified' => (bool) ($comment->user->is_verified ?? false),
                'avatar' => $comment->user->socialAccounts
                    ->first(fn ($account) => ! empty($account->avatar))
                    ?->avatar,
                'leaderboard_title' => $this->leaderboardTitleService->titleForUserId($comment->user->id),
            ] : null,
        ];
    }

    /**
     * Comparison function used to order comments. Sorts primarily by
     * computed score, then by upvote count, then by creation time.
     */
    private function compareComments(Comment $left, Comment $right): int
    {
        $leftScore = $this->calculateCommentScore($left);
        $rightScore = $this->calculateCommentScore($right);

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

    /**
     * Calculate a numeric score for a comment using upvotes, downvotes and
     * wrong-vote penalties. This value is used for ordering comments.
     */
    private function calculateCommentScore(Comment $comment): int
    {
        return (int) ($comment->upvotes_count ?? 0)
            - (int) ($comment->downvotes_count ?? 0)
            - (2 * (int) ($comment->wrong_votes_count ?? 0));
    }

    /**
     * Resolve the current authenticated user's vote for the comment.
     * Falls back to the `is_liked` flag if detailed vote relations are not
     * loaded.
     *
     * @return int 1 = upvote, -1 = downvote, -2 = wrong, 0 = none
     */
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
}

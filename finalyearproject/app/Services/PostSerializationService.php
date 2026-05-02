<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class PostSerializationService
{
    public function __construct(private readonly LeaderboardTitleService $leaderboardTitleService) {}

    /**
     * Serialize a single post for API response
     */
    public function serialize(Post $post, array $followingIds = []): array
    {
        $currentUserId = Auth::id();

        return [
            'id' => $post->id,
            'title' => $post->title,
            'content' => $post->content,
            'content_blocks' => $post->content_blocks,
            'post_type' => $post->post_type,
            'quiz_data' => $post->quiz_data,
            'image' => $post->image,
            'video_url' => $post->video_url,
            'parent_material_id' => $post->parent_material_id,
            'material_improved_from_feedback' => (bool) ($post->material_improved_from_feedback ?? false),
            'created_at' => optional($post->created_at)->toISOString(),
            'updated_at' => optional($post->updated_at)->toISOString(),
            'saved_at' => optional($post->saved_at)->toISOString(),
            'bookmark_folder_id' => $post->bookmark_folder_id ?? $post->pivot?->bookmark_folder_id,
            'is_anonymous' => (bool) ($post->is_anonymous ?? false),
            'is_owner' => $currentUserId !== null && (int) $post->user_id === (int) $currentUserId,
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
            'comments' => $post->relationLoaded('comments')
                ? $this->buildCommentTree($post->comments)
                : null,
        ];
    }

    /**
     * Serialize user information — returns null for anonymous posts to prevent identity leaks.
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
     * Serialize language information
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
     * Serialize subject information
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
     * Serialize lesson information
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
     * Build comment tree from flat collection
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
     * Serialize a single comment
     */
    private function serializeComment(Comment $comment, int $depth): array
    {
        $upvotesCount = (int) ($comment->upvotes_count ?? $comment->likes_count ?? 0);
        $downvotesCount = (int) ($comment->downvotes_count ?? 0);
        $score = (int) ($comment->score ?? ($upvotesCount - $downvotesCount));
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
            'score' => $score,
            'user_vote' => $userVote,
            'is_liked' => $userVote === 1,
            'is_upvoted' => $userVote === 1,
            'is_downvoted' => $userVote === -1,
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
     * Compare comments for sorting
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
     * Calculate comment score
     */
    private function calculateCommentScore(Comment $comment): int
    {
        return (int) ($comment->upvotes_count ?? 0) - (int) ($comment->downvotes_count ?? 0);
    }

    /**
     * Resolve user vote on comment
     */
    private function resolveUserVote(Comment $comment): int
    {
        $currentUserId = Auth::id();
        $vote = null;

        if ($comment->relationLoaded('votes') && $currentUserId) {
            $vote = $comment->votes
                ->firstWhere('user_id', $currentUserId)
                ?->vote;
        }

        if ($vote !== null) {
            return (int) $vote;
        }

        return (int) ($comment->is_liked ?? 0);
    }
}

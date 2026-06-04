<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\Comment;
use App\Models\BookmarkItem;
use App\Models\Like;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\UserProgress;

class AchievementService
{
    public const POINTS_PER_POST = 10;
    public const POINTS_PER_LIKE_RECEIVED = 2;

    /**
     * Calculate and update user points, sync earned badges, and return achievement stats.
     *
     * Points are calculated from posts and likes received. Newly earned badges are automatically
     * awarded when user points reach the required threshold.
     *
     * @param User $user The user to sync
     * @return array Contains points, posts_count, likes_received_count, earned_badges, and next_badge
     */
    public function syncUser(User $user): array
    {
        $postsCount = $user->posts()->count();
        $likesReceivedCount = Like::query()
            ->whereHas('post', fn ($query) => $query->where('user_id', $user->id))
            ->count();

        $points = ($postsCount * self::POINTS_PER_POST)
            + ($likesReceivedCount * self::POINTS_PER_LIKE_RECEIVED);

        if ((int) $user->points !== $points) {
            $user->updateQuietly(['points' => $points]);
            $user->refresh();
        }

        $questionPostsCount = $user->posts()->where('post_type', 'question')->count();

        UserProgress::where('user_id', $user->id)
            ->update([
                'total_post_posted'      => $postsCount,
                'total_questions_posted' => $questionPostsCount,
            ]);

        $eligibleBadgeIds = Badge::query()
            ->where('points_required', '<=', $points)
            ->pluck('id');

        $earnedBadgeIds = $user->badges()->pluck('badges.id');
        $missingBadgeIds = $eligibleBadgeIds->diff($earnedBadgeIds);

        if ($missingBadgeIds->isNotEmpty()) {
            $attachPayload = $missingBadgeIds
                ->mapWithKeys(fn ($badgeId) => [$badgeId => ['awarded_at' => now()]])
                ->all();

            $user->badges()->attach($attachPayload);
        }

        $earnedBadges = $user->badges()
            ->orderBy('points_required')
            ->get();

        $nextBadge = Badge::query()
            ->where('points_required', '>', $points)
            ->orderBy('points_required')
            ->first();

        return [
            'points'               => $points,
            'posts_count'          => $postsCount,
            'likes_received_count' => $likesReceivedCount,
            'earned_badges'        => $earnedBadges,
            'next_badge'           => $nextBadge,
        ];
    }

    /**
     * Evaluate all progress-based achievement conditions for a user.
     * Safe to call multiple times — already-earned achievements are never re-awarded.
     *
     * @return string[]  Keys of achievements unlocked in this call.
     */
    public function evaluateAchievements(User $user): array
    {
        $progress = $user->progress;

        if (! $progress) {
            return [];
        }

        $totalAnswered    = $progress->total_questions_answered;
        $accuracyRate     = $totalAnswered > 0
            ? ($progress->correct_answers_count / $totalAnswered) * 100
            : 0.0;
        // Live metrics computed from DB (no extra stored column needed)
        $commentsCount   = Comment::where('user_id', $user->id)->count();
        $savedPostsCount = BookmarkItem::where('user_id', $user->id)->count();
        $mistakesReviewed = QuizAttempt::where('user_id', $user->id)->count();

        $conditions = [
            // ── Existing (preserved) ────────────────────────────────────────
            'active_learner'      => $totalAnswered >= 10,
            'curious_mind'        => $progress->total_questions_posted >= 5,
            'quiz_master'         => $progress->correct_answers_count >= 20,
            'high_accuracy'       => $totalAnswered >= 5 && $accuracyRate >= 80.0,
            'helpful_contributor' => $progress->total_likes_received >= 10,
            'top_contributor'     => $progress->total_likes_received >= 50,

            // ── Posting ──────────────────────────────────────────────────────
            'first_post'          => $progress->total_post_posted >= 1,
            'active_author'       => $progress->total_post_posted >= 20,
            'prolific_poster'     => $progress->total_post_posted >= 50,

            // ── Commenting ───────────────────────────────────────────────────
            'first_comment'       => $commentsCount >= 1,
            'discussion_starter'  => $commentsCount >= 10,
            'community_voice'     => $commentsCount >= 50,

            // ── Saving ───────────────────────────────────────────────────────
            'collector'           => $savedPostsCount >= 5,
            'bookworm'            => $savedPostsCount >= 20,

            // ── Mistakes ─────────────────────────────────────────────────────
            'mistake_hunter'      => $mistakesReviewed >= 5,
            'deep_learner'        => $mistakesReviewed >= 25,

            // ── Extended Question ────────────────────────────────────────────
            'quiz_veteran'        => $totalAnswered >= 50,
            'quiz_legend'         => $totalAnswered >= 100,

            // ── Extended Performance ─────────────────────────────────────────
            'perfect_scorer'      => $totalAnswered >= 5 && $accuracyRate >= 90.0,

            // ── Extended Community ───────────────────────────────────────────
            'community_star'      => $progress->total_likes_received >= 200,
        ];

        $alreadyEarned = UserAchievement::query()
            ->where('user_id', $user->id)
            ->pluck('achievement_key')
            ->all();

        $newlyEarned = [];

        foreach ($conditions as $key => $met) {
            if ($met && ! in_array($key, $alreadyEarned, true)) {
                UserAchievement::create([
                    'user_id'         => $user->id,
                    'achievement_key' => $key,
                    'achieved_at'     => now(),
                ]);
                $newlyEarned[] = $key;
            }
        }

        return $newlyEarned;
    }
}

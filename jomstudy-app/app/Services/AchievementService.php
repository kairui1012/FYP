<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\Badge;
use App\Models\BookmarkItem;
use App\Models\Comment;
use App\Models\Like;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\UserProgress;

class AchievementService
{
    public const POINTS_PER_POST = 10;

    public const POINTS_PER_LIKE_RECEIVED = 2;

    /** @return array<string, mixed> */
    public function pageData(User $user): array
    {
        $user->loadMissing('socialAccounts:id,user_id,avatar');
        $result = $this->syncUser($user);
        $progress = UserProgress::query()->where('user_id', $user->id)->first();
        $liveMetrics = [
            'comments_count' => Comment::query()->where('user_id', $user->id)->count(),
            'saved_posts_count' => BookmarkItem::query()->where('user_id', $user->id)->count(),
            'mistakes_reviewed' => QuizAttempt::query()->where('user_id', $user->id)->count(),
        ];

        $this->evaluateAchievements($user, $progress, $liveMetrics);

        $currentPoints = $result['points'];
        $allBadges = Badge::query()->orderBy('points_required')->get();

        return [
            'summary' => [
                'points' => $currentPoints,
                'posts_count' => $result['posts_count'],
                'likes_received_count' => $result['likes_received_count'],
                ...$liveMetrics,
            ],
            'badges' => $allBadges->map(fn (Badge $badge) => [
                'id' => $badge->id,
                'key' => $badge->key,
                'name' => $badge->name,
                'description' => $badge->description,
                'icon' => $badge->icon,
                'points_required' => $badge->points_required,
                'awarded_at' => $badge->pivot?->awarded_at ? (string) $badge->pivot->awarded_at : null,
                'earned' => $currentPoints >= $badge->points_required,
            ])->values(),
            'next_badge' => $result['next_badge'] ? [
                'id' => $result['next_badge']->id,
                'key' => $result['next_badge']->key,
                'name' => $result['next_badge']->name,
                'description' => $result['next_badge']->description,
                'icon' => $result['next_badge']->icon,
                'points_required' => $result['next_badge']->points_required,
            ] : null,
            'achievements' => $this->buildAchievementsData($progress, $liveMetrics, $user->id),
            'user_progress' => $progress ? [
                'total_questions_answered' => $progress->total_questions_answered,
                'total_questions_posted' => $progress->total_questions_posted,
                'total_post_posted' => $progress->total_post_posted,
                'quizzes_completed' => $progress->quizzes_completed,
                'correct_answers_count' => $progress->correct_answers_count,
                'total_likes_received' => $progress->total_likes_received,
                'improvement_score' => $progress->improvement_score,
                'accuracy_pct' => $progress->total_questions_answered > 0
                    ? (int) round(($progress->correct_answers_count / $progress->total_questions_answered) * 100)
                    : 0,
            ] : null,
        ];
    }

    /**
     * Calculate and update user points, sync earned badges, and return achievement stats.
     *
     * Points are calculated from posts and likes received. Newly earned badges are automatically
     * awarded when user points reach the required threshold.
     *
     * @param  User  $user  The user to sync
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
                'total_post_posted' => $postsCount,
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
            'points' => $points,
            'posts_count' => $postsCount,
            'likes_received_count' => $likesReceivedCount,
            'earned_badges' => $earnedBadges,
            'next_badge' => $nextBadge,
        ];
    }

    /**
     * Evaluate all progress-based achievement conditions for a user.
     * Safe to call multiple times — already-earned achievements are never re-awarded.
     *
     * @return string[] Keys of achievements unlocked in this call.
     */
    public function evaluateAchievements(User $user, ?UserProgress $progress = null, ?array $liveMetrics = null): array
    {
        $progress ??= $user->progress;

        if (! $progress) {
            return [];
        }

        $totalAnswered = $progress->total_questions_answered;
        $accuracyRate = $totalAnswered > 0
            ? ($progress->correct_answers_count / $totalAnswered) * 100
            : 0.0;
        // Live metrics computed from DB (no extra stored column needed)
        $commentsCount = $liveMetrics['comments_count'] ?? Comment::query()->where('user_id', $user->id)->count();
        $savedPostsCount = $liveMetrics['saved_posts_count'] ?? BookmarkItem::query()->where('user_id', $user->id)->count();
        $mistakesReviewed = $liveMetrics['mistakes_reviewed'] ?? QuizAttempt::query()->where('user_id', $user->id)->count();

        $conditions = [
            // ── Existing (preserved) ────────────────────────────────────────
            'active_learner' => $totalAnswered >= 10,
            'curious_mind' => $progress->total_questions_posted >= 5,
            'quiz_master' => $progress->correct_answers_count >= 20,
            'high_accuracy' => $totalAnswered >= 5 && $accuracyRate >= 80.0,
            'helpful_contributor' => $progress->total_likes_received >= 10,
            'top_contributor' => $progress->total_likes_received >= 50,

            // ── Posting ──────────────────────────────────────────────────────
            'first_post' => $progress->total_post_posted >= 1,
            'active_author' => $progress->total_post_posted >= 20,
            'prolific_poster' => $progress->total_post_posted >= 50,

            // ── Commenting ───────────────────────────────────────────────────
            'first_comment' => $commentsCount >= 1,
            'discussion_starter' => $commentsCount >= 10,
            'community_voice' => $commentsCount >= 50,

            // ── Saving ───────────────────────────────────────────────────────
            'collector' => $savedPostsCount >= 5,
            'bookworm' => $savedPostsCount >= 20,

            // ── Mistakes ─────────────────────────────────────────────────────
            'mistake_hunter' => $mistakesReviewed >= 5,
            'deep_learner' => $mistakesReviewed >= 25,

            // ── Extended Question ────────────────────────────────────────────
            'quiz_veteran' => $totalAnswered >= 50,
            'quiz_legend' => $totalAnswered >= 100,

            // ── Extended Performance ─────────────────────────────────────────
            'perfect_scorer' => $totalAnswered >= 5 && $accuracyRate >= 90.0,

            // ── Extended Community ───────────────────────────────────────────
            'community_star' => $progress->total_likes_received >= 200,
        ];

        $alreadyEarned = UserAchievement::query()
            ->where('user_id', $user->id)
            ->pluck('achievement_key')
            ->all();

        $newlyEarned = [];

        foreach ($conditions as $key => $met) {
            if ($met && ! in_array($key, $alreadyEarned, true)) {
                UserAchievement::create([
                    'user_id' => $user->id,
                    'achievement_key' => $key,
                    'achieved_at' => now(),
                ]);
                $newlyEarned[] = $key;
            }
        }

        return $newlyEarned;
    }

    /** @return array<int, array<string, mixed>> */
    private function buildAchievementsData(?UserProgress $progress, array $liveMetrics, int $userId): array
    {
        $earned = UserAchievement::query()
            ->where('user_id', $userId)
            ->get(['achievement_key', 'achieved_at'])
            ->keyBy('achievement_key');
        $accuracyPct = ($progress && $progress->total_questions_answered > 0)
            ? (int) round(($progress->correct_answers_count / $progress->total_questions_answered) * 100)
            : 0;

        return Achievement::query()
            ->orderBy('category')
            ->orderBy('threshold')
            ->get()
            ->map(function (Achievement $achievement) use ($progress, $earned, $accuracyPct, $liveMetrics) {
                $current = $this->resolveMetricValue($achievement->metric, $progress, $accuracyPct, $liveMetrics);
                $userAchievement = $earned->get($achievement->key);

                return [
                    'key' => $achievement->key,
                    'category' => $achievement->category,
                    'icon' => $achievement->icon,
                    'threshold' => $achievement->threshold,
                    'current' => $current,
                    'progress_pct' => $achievement->threshold > 0
                        ? min(100, (int) round(($current / $achievement->threshold) * 100))
                        : 0,
                    'achieved' => $userAchievement !== null,
                    'achieved_at' => $userAchievement ? (string) $userAchievement->achieved_at : null,
                ];
            })
            ->values()
            ->all();
    }

    private function resolveMetricValue(
        string $metric,
        ?UserProgress $progress,
        int $accuracyPct,
        array $liveMetrics,
    ): int {
        if (isset($liveMetrics[$metric])) {
            return (int) $liveMetrics[$metric];
        }

        if (! $progress) {
            return 0;
        }

        return match ($metric) {
            'total_questions_answered' => $progress->total_questions_answered,
            'total_questions_posted' => $progress->total_questions_posted,
            'total_post_posted' => $progress->total_post_posted,
            'correct_answers_count' => $progress->correct_answers_count,
            'quizzes_completed' => $progress->quizzes_completed,
            'accuracy_pct' => $accuracyPct,
            'improvement_score' => max(0, $progress->improvement_score),
            'total_likes_received' => $progress->total_likes_received,
            default => 0,
        };
    }
}

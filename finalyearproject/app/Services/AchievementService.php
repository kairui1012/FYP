<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\Like;
use App\Models\User;
use App\Models\UserAchievement;

class AchievementService
{
    public const POINTS_PER_POST = 10;
    public const POINTS_PER_LIKE_RECEIVED = 2;

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
     * @return string[]  Keys of achievements unlocked in this call.
     */
    public function evaluateAchievements(User $user): array
    {
        $progress = $user->progress;

        if (! $progress) {
            return [];
        }

        $totalAnswered  = $progress->total_questions_answered;
        $accuracyRate   = $totalAnswered > 0
            ? ($progress->correct_answers_count / $totalAnswered) * 100
            : 0.0;
        $improvementScore = $progress->improvement_score;

        $conditions = [
            'active_learner'      => $totalAnswered >= 10,
            'curious_mind'        => $progress->total_questions_posted >= 5,
            'quiz_master'         => $progress->correct_answers_count >= 20,
            'high_accuracy'       => $totalAnswered >= 5 && $accuracyRate >= 80.0,
            'fast_improver'       => $improvementScore >= 20,
            'consistent_growth'   => $totalAnswered >= 10 && $improvementScore >= 10,
            'helpful_contributor' => $progress->total_likes_received >= 10,
            'top_contributor'     => $progress->total_likes_received >= 50,
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

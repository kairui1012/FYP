<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\Like;
use App\Models\User;

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

        $points = ($postsCount * self::POINTS_PER_POST) + ($likesReceivedCount * self::POINTS_PER_LIKE_RECEIVED);

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
}

<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserFeaturedBadge;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FeaturedBadgeService
{
    /** @param array<int, int> $badgeIds */
    public function replaceForUser(User $user, array $badgeIds, int $limit): Collection
    {
        $selectedIds = collect($badgeIds)
            ->intersect($user->badges()->pluck('badges.id'))
            ->unique()->take($limit)->values();

        DB::transaction(function () use ($user, $selectedIds): void {
            UserFeaturedBadge::query()->where('user_id', $user->id)->delete();

            $selectedIds->each(fn ($badgeId) => UserFeaturedBadge::query()->create([
                'user_id' => $user->id,
                'badge_id' => $badgeId,
            ]));
        });

        return $selectedIds;
    }
}

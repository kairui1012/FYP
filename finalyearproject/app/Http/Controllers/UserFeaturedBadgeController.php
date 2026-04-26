<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserFeaturedBadge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserFeaturedBadgeController extends Controller
{
    private const MAX_FEATURED = 5;

    public function update(Request $request, User $user): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        if ($viewer->id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'badge_ids'   => ['required', 'array', 'max:' . self::MAX_FEATURED],
            'badge_ids.*' => ['integer'],
        ]);

        $badgeIds = collect($validated['badge_ids']);

        // Ensure user actually owns all submitted badges
        $earnedIds = $user->badges()->pluck('badges.id');
        $badgeIds = $badgeIds->intersect($earnedIds)->unique()->take(self::MAX_FEATURED)->values();

        // Replace current featured badges atomically
        UserFeaturedBadge::where('user_id', $user->id)->delete();

        foreach ($badgeIds as $badgeId) {
            UserFeaturedBadge::create([
                'user_id'  => $user->id,
                'badge_id' => $badgeId,
            ]);
        }

        return response()->json(['badge_ids' => $badgeIds->all()]);
    }
}

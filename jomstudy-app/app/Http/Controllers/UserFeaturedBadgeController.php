<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\FeaturedBadgeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserFeaturedBadgeController extends Controller
{
    private const MAX_FEATURED = 3;

    public function __construct(private readonly FeaturedBadgeService $featuredBadgeService) {}

    /**
     * Update user's featured badge selection (max 3 badges).
     * Only user can update their own featured badges. Validates user owns all selected badges.
     * Replaces featured badges atomically.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        if ($viewer->id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'badge_ids' => ['required', 'array', 'max:'.self::MAX_FEATURED],
            'badge_ids.*' => ['integer'],
        ]);

        $badgeIds = $this->featuredBadgeService->replaceForUser(
            $user,
            $validated['badge_ids'],
            self::MAX_FEATURED,
        );

        return response()->json(['badge_ids' => $badgeIds->all()]);
    }
}

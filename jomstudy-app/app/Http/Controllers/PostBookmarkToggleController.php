<?php

namespace App\Http\Controllers;

use App\Models\BookmarkFolder;
use App\Models\BookmarkItem;
use App\Models\Post;
use App\Models\UserProgress;
use App\Services\AchievementService;
use App\Services\PointsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostBookmarkToggleController extends Controller
{
    public function __construct(
        private readonly PointsService $pointsService,
        private readonly AchievementService $achievementService,
    ) {}

    /**
     * Toggle bookmark (save) status for a post. Saves to user's default folder.
     * Awards/revokes points to post owner. Re-evaluates achievements.
     */
    public function toggle(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();
        $defaultFolder = BookmarkFolder::defaultFor($user);

        $existingBookmark = BookmarkItem::query()
            ->where('user_id', $user->id)
            ->where('post_id', $post->id)
            ->first();

        $isSaved = false;

        if ($existingBookmark) {
            if ($post->user) {
                $this->pointsService->revoke($post->user, 'resource_bookmarked', $existingBookmark);
            }

            $existingBookmark->delete();
        } else {
            $bookmarkItem = BookmarkItem::query()->create([
                'user_id' => $user->id,
                'bookmark_folder_id' => $defaultFolder->id,
                'post_id' => $post->id,
            ]);
            $isSaved = true;

            if ($post->user) {
                $this->pointsService->award($post->user, 'resource_bookmarked', $bookmarkItem, $user);
            }
        }

        // Ensure progress row exists, then re-evaluate save-based achievements
        UserProgress::query()->firstOrCreate(['user_id' => $user->id]);
        $this->achievementService->evaluateAchievements($user->fresh());

        return response()->json([
            'saved' => $isSaved,
            'saves_count' => $post->bookmarkItems()->count(),
        ]);
    }
}

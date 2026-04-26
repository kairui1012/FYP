<?php

namespace App\Http\Controllers;

use App\Models\BookmarkFolder;
use App\Models\BookmarkItem;
use App\Models\Post;
use App\Services\PointsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostSaveController extends Controller
{
    public function __construct(private readonly PointsService $pointsService) {}

    public function toggle(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();
        $defaultFolder = BookmarkFolder::defaultFor($user);

        $existingSave = BookmarkItem::query()
            ->where('user_id', $user->id)
            ->where('post_id', $post->id)
            ->first();

        $isSaved = false;

        if ($existingSave) {
            if ($post->user) {
                $this->pointsService->revoke($post->user, 'resource_bookmarked', $existingSave);
            }

            $existingSave->delete();
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

        return response()->json([
            'saved' => $isSaved,
            'saves_count' => $post->bookmarkItems()->count(),
        ]);
    }
}

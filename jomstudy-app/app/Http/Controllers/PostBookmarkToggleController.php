<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Services\BookmarkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostBookmarkToggleController extends Controller
{
    public function __construct(private readonly BookmarkService $bookmarkService) {}

    /**
     * Toggle bookmark (save) status for a post.
     * Awards/revokes points to post owner. Re-evaluates achievements.
     */
    public function toggle(Request $request, Post $post): JsonResponse
    {
        return response()->json($this->bookmarkService->toggle($request->user(), $post));
    }
}

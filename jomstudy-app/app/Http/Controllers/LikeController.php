<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Services\PostLikeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function __construct(private readonly PostLikeService $postLikeService) {}

    /**
     * Toggle like status for a post. Awards/revokes points and updates achievement/progress.
     * Only awards points for question/quiz/material posts.
     * Returns JSON or redirect response depending on request type.
     */
    public function toggle(Request $request, Post $posts): RedirectResponse|JsonResponse
    {
        $result = $this->postLikeService->toggle($request->user(), $posts);

        if ($request->expectsJson()) {
            return response()->json([
                'liked' => $result['liked'],
                'likes_count' => $result['likes_count'],
            ]);
        }

        return redirect()->back()->with('success', $result['liked']
            ? 'Post liked.'
            : 'Like removed.');
    }
}

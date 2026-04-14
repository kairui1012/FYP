<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\CommentLike;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentLikeController extends Controller
{
    public function toggle(Request $request, Comment $comment): JsonResponse
    {
        $existingLike = CommentLike::query()
            ->where('user_id', $request->user()->id)
            ->where('comment_id', $comment->id)
            ->first();

        $isLiked = false;

        if ($existingLike) {
            $existingLike->delete();
        } else {
            CommentLike::query()->create([
                'user_id' => $request->user()->id,
                'comment_id' => $comment->id,
            ]);
            $isLiked = true;
        }

        return response()->json([
            'liked' => $isLiked,
            'likes_count' => $comment->likes()->count(),
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostSave;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostSaveController extends Controller
{
    public function toggle(Request $request, Post $post): JsonResponse
    {
        $existingSave = PostSave::query()
            ->where('user_id', $request->user()->id)
            ->where('post_id', $post->id)
            ->first();

        $isSaved = false;

        if ($existingSave) {
            $existingSave->delete();
        } else {
            PostSave::query()->create([
                'user_id' => $request->user()->id,
                'post_id' => $post->id,
            ]);
            $isSaved = true;
        }

        return response()->json([
            'saved' => $isSaved,
            'saves_count' => $post->saves()->count(),
        ]);
    }
}

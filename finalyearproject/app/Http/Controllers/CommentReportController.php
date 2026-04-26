<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\CommentReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class CommentReportController extends Controller
{
    public function store(Request $request, Comment $comment): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        if (! Schema::hasTable('comment_reports')) {
            return response()->json(['message' => 'Report feature not available.'], 503);
        }

        $alreadyReported = CommentReport::query()
            ->where('user_id', $request->user()->id)
            ->where('comment_id', $comment->id)
            ->exists();

        if ($alreadyReported) {
            return response()->json(['message' => 'Already reported.'], 422);
        }

        CommentReport::query()->create([
            'user_id'    => $request->user()->id,
            'comment_id' => $comment->id,
            'reason'     => $validated['reason'] ?? 'inappropriate',
        ]);

        return response()->json(['message' => 'Report submitted.']);
    }
}

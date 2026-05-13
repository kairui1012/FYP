<?php

namespace App\Http\Controllers;

use App\Jobs\QueueCommentReportForModeration;
use App\Models\Comment;
use App\Models\CommentReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Throwable;

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

        $reportAttributes = [
            'user_id'    => $request->user()->id,
            'comment_id' => $comment->id,
            'reason'     => $validated['reason'] ?? 'inappropriate',
        ];

        if (Schema::hasColumn('comment_reports', 'status')) {
            $reportAttributes['status'] = 'pending';
        }

        if (Schema::hasColumn('comment_reports', 'moderation_queued_at')) {
            $reportAttributes['moderation_queued_at'] = now();
        }

        $report = CommentReport::query()->create($reportAttributes);

        try {
            QueueCommentReportForModeration::dispatch($report->id);
        } catch (Throwable $e) {
            report($e);
            QueueCommentReportForModeration::dispatchSync($report->id);
        }

        return response()->json(['message' => 'Report submitted.']);
    }
}

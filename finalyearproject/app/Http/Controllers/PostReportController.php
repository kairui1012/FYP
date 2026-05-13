<?php

namespace App\Http\Controllers;

use App\Jobs\QueuePostReportForModeration;
use App\Models\Post;
use App\Models\PostReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Throwable;

class PostReportController extends Controller
{
    public function store(Request $request, Post $post): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        if (! Schema::hasTable('post_reports')) {
            return response()->json(['message' => 'Report feature not available.'], 503);
        }

        $alreadyReported = PostReport::query()
            ->where('user_id', $request->user()->id)
            ->where('post_id', $post->id)
            ->exists();

        if ($alreadyReported) {
            return response()->json(['message' => 'Already reported.'], 422);
        }

        $reportAttributes = [
            'user_id' => $request->user()->id,
            'post_id' => $post->id,
            'reason' => $validated['reason'] ?? 'inappropriate',
        ];

        if (Schema::hasColumn('post_reports', 'status')) {
            $reportAttributes['status'] = 'pending';
        }

        if (Schema::hasColumn('post_reports', 'moderation_queued_at')) {
            $reportAttributes['moderation_queued_at'] = now();
        }

        $report = PostReport::query()->create($reportAttributes);

        try {
            QueuePostReportForModeration::dispatch($report->id);
        } catch (Throwable $e) {
            report($e);
            QueuePostReportForModeration::dispatchSync($report->id);
        }

        return response()->json(['message' => 'Report submitted.']);
    }
}

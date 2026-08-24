<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Services\ContentReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentReportController extends Controller
{
    public function __construct(private readonly ContentReportService $reportService) {}

    /**
     * Submit a report on a comment. Prevents duplicate reports by same user.
     * Queues report for moderation processing. Handles missing table gracefully.
     */
    public function store(Request $request, Comment $comment): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $status = $this->reportService->reportComment(
            $request->user(),
            $comment,
            $validated['reason'] ?? null,
        );

        if ($status === ContentReportService::UNAVAILABLE) {
            return response()->json(['message' => 'Report feature not available.'], 503);
        }

        if ($status === ContentReportService::DUPLICATE) {
            return response()->json(['message' => 'Already reported.'], 422);
        }

        return response()->json(['message' => 'Report submitted.']);
    }
}

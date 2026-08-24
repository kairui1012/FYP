<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Services\ContentReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostReportController extends Controller
{
    public function __construct(private readonly ContentReportService $reportService) {}

    /**
     * Submit a report on a post. Prevents duplicate reports by same user.
     * Queues report for moderation processing. Handles missing table gracefully.
     */
    public function store(Request $request, Post $post): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $status = $this->reportService->reportPost(
            $request->user(),
            $post,
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

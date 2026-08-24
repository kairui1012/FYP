<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Services\StudyMaterialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StudyMaterialFeedbackController extends Controller
{
    public function __construct(private readonly StudyMaterialService $studyMaterialService) {}

    /**
     * Submit or update feedback (vote and/or rating) on a study material.
     * Syncs the latest version's rating and returns updated feedback summary.
     */
    public function store(Request $request, Post $post): JsonResponse
    {
        if (! $request->expectsJson()) {
            abort(404);
        }

        if ($post->post_type !== 'material') {
            return response()->json([
                'status' => 'invalid',
                'message' => 'Feedback can only be submitted for Study Materials.',
            ], 422);
        }

        $validated = $request->validate([
            'vote' => ['nullable', 'integer', Rule::in([-1, 1])],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        if (! isset($validated['vote']) && ! isset($validated['rating'])) {
            return response()->json([
                'status' => 'invalid',
                'message' => 'Add a vote or rating before submitting.',
            ], 422);
        }

        $this->studyMaterialService->saveFeedback($request->user(), $post, $validated);

        return response()->json([
            'status' => 'saved',
            'summary' => $this->studyMaterialService->feedbackSummary($post),
            'user_feedback' => $this->studyMaterialService->userFeedback($post, $request->user()->id),
            'analytics' => $this->studyMaterialService->analytics($post),
        ]);
    }
}

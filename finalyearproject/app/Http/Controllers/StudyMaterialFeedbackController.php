<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesStudyMaterials;
use App\Models\Post;
use App\Models\StudyMaterialFeedback;
use App\Services\MaterialVersionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class StudyMaterialFeedbackController extends Controller
{
    use HandlesStudyMaterials;

    public function __construct(private readonly MaterialVersionService $materialVersionService) {}

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

        StudyMaterialFeedback::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'post_id' => $post->id,
            ],
            [
                'vote' => $validated['vote'] ?? null,
                'rating' => $validated['rating'] ?? null,
            ],
        );

        $this->syncLatestVersionRating($post->id);

        return response()->json([
            'status' => 'saved',
            'summary' => $this->buildMaterialFeedbackSummary($post, $request->user()->id),
            'user_feedback' => $this->buildMaterialUserFeedback($post, $request->user()->id),
            'analytics' => $this->buildLearningAnalytics($post),
        ]);
    }

    public function destroy(Request $request, Post $post): JsonResponse
    {
        if (! $request->expectsJson()) {
            abort(404);
        }

        if ($post->post_type !== 'material') {
            return response()->json([
                'status' => 'invalid',
                'message' => 'Feedback can only be removed for Study Materials.',
            ], 422);
        }

        if (Schema::hasTable('study_material_feedback')) {
            StudyMaterialFeedback::query()
                ->where('post_id', $post->id)
                ->where('user_id', $request->user()->id)
                ->delete();
        }

        $this->syncLatestVersionRating($post->id);

        return response()->json([
            'status' => 'deleted',
            'summary' => $this->buildMaterialFeedbackSummary($post, $request->user()->id),
            'user_feedback' => $this->buildMaterialUserFeedback($post, $request->user()->id),
            'analytics' => $this->buildLearningAnalytics($post),
        ]);
    }
}

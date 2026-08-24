<?php

namespace App\Http\Controllers;

use App\Services\TeacherMaterialInsightsService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TeacherMaterialInsightsController extends Controller
{
    public function __construct(private readonly TeacherMaterialInsightsService $insightsService) {}

    /**
     * Display teacher material insights dashboard with low-rated materials and frequently wrong quiz questions.
     * Filters by material, subject, quiz, and time range. Only accessible to teachers.
     */
    public function index(Request $request): Response
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->canPublishStudyMaterials()) {
            abort(403);
        }

        $validated = $request->validate([
            'material_id' => ['nullable', 'integer', Rule::exists('posts', 'id')->where(fn ($query) => $query->where('post_type', 'material'))],
            'subject_id' => ['nullable', 'integer', Rule::exists('subjects', 'id')],
            'quiz_id' => ['nullable', 'integer', Rule::exists('posts', 'id')->where(fn ($query) => $query->where('post_type', 'quiz'))],
            'time_range' => ['nullable', 'string', Rule::in(['7d', '30d', '90d', 'all'])],
            'sort' => ['nullable', 'string', Rule::in(['low_rating', 'high_rating'])],
        ]);

        $materialId = isset($validated['material_id']) ? (int) $validated['material_id'] : null;
        $subjectId = isset($validated['subject_id']) ? (int) $validated['subject_id'] : null;
        $quizId = isset($validated['quiz_id']) ? (int) $validated['quiz_id'] : null;
        $timeRange = $validated['time_range'] ?? '30d';
        $sort = in_array($validated['sort'] ?? '', ['low_rating', 'high_rating']) ? $validated['sort'] : 'low_rating';
        $since = match ($timeRange) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            '90d' => now()->subDays(90),
            default => null,
        };

        return Inertia::render('teacherMaterialInsightsPage', [
            'filters' => [
                'material_id' => $materialId,
                'subject_id' => $subjectId,
                'quiz_id' => $quizId,
                'time_range' => $timeRange,
                'sort' => $sort,
            ],
            'materials' => $this->insightsService->materialOptions(),
            'subjects' => $this->insightsService->subjectOptions(),
            'quizzes' => $this->insightsService->quizOptions(),
            'insights' => [
                'low_rated_materials' => $this->insightsService->lowRatedMaterials($materialId, $subjectId, $quizId, $since, $sort, $user->id),
                'frequently_wrong_questions' => $this->insightsService->frequentlyWrongQuestions($materialId, $subjectId, $quizId, $since),
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }
}

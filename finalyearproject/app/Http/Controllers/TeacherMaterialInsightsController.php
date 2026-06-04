<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\StudyMaterialFeedback;
use App\Models\Subject;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TeacherMaterialInsightsController extends Controller
{
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

        return Inertia::render('TeacherMaterialInsightsPage', [
            'filters' => [
                'material_id' => $materialId,
                'subject_id' => $subjectId,
                'quiz_id' => $quizId,
                'time_range' => $timeRange,
                'sort' => $sort,
            ],
            'materials' => $this->materialOptions(),
            'subjects' => Subject::query()->orderBy('name')->get(['id', 'name'])->values()->all(),
            'quizzes' => $this->quizOptions(),
            'insights' => [
                'low_rated_materials' => $this->buildLowRatedMaterialsInsights($materialId, $subjectId, $quizId, $since, $sort, $user->id),
                'frequently_wrong_questions' => $this->buildFrequentlyWrongQuestionsInsights($materialId, $subjectId, $quizId, $since, $sort),
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }

    /**
     * Get list of all study materials for filter dropdown.
     * Includes material title and subject association.
     */
    private function materialOptions(): array
    {
        return Post::query()
            ->where('post_type', 'material')
            ->with('subject:id,name')
            ->orderBy('title')
            ->get(['id', 'title', 'subject_id'])
            ->map(fn (Post $material) => [
                'id' => $material->id,
                'title' => $material->title,
                'subject_id' => $material->subject_id,
                'subject_name' => $material->subject?->name,
            ])
            ->values()
            ->all();
    }

    /**
     * Get list of all quizzes with their parent material association for filter dropdown.
     */
    private function quizOptions(): array
    {
        if (! Schema::hasColumn('posts', 'parent_material_id')) {
            return [];
        }

        return Post::query()
            ->where('post_type', 'quiz')
            ->with('parentMaterial:id,title,subject_id')
            ->orderBy('title')
            ->get(['id', 'title', 'parent_material_id'])
            ->map(fn (Post $quiz) => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'material_id' => $quiz->parent_material_id,
                'material_title' => $quiz->parentMaterial?->title,
                'subject_id' => $quiz->parentMaterial?->subject_id,
            ])
            ->values()
            ->all();
    }

    /**
     * Build insights of low-rated materials (by average feedback rating).
     * Filters by material, subject, quiz parent, and time range.
     * Can sort by low_rating (ascending) or high_rating (descending).
     *
     * @return array<int, array<string, mixed>>
     */
    private function buildLowRatedMaterialsInsights(?int $materialId, ?int $subjectId, ?int $quizId, ?CarbonInterface $since, string $sort, int $teacherId): array
    {
        if (! Schema::hasTable('study_material_feedback')) {
            return [];
        }

        $query = StudyMaterialFeedback::query()
            ->join('posts as materials', 'materials.id', '=', 'study_material_feedback.post_id')
            ->leftJoin('subjects', 'subjects.id', '=', 'materials.subject_id')
            ->where('materials.post_type', 'material')
            ->where('materials.user_id', $teacherId)
            ->whereNotNull('study_material_feedback.rating')
            ->when($materialId, fn ($builder) => $builder->where('study_material_feedback.post_id', $materialId))
            ->when($subjectId, fn ($builder) => $builder->where('materials.subject_id', $subjectId))
            ->when($since, fn ($builder) => $builder->where('study_material_feedback.updated_at', '>=', $since))
            ->selectRaw('study_material_feedback.post_id as material_id, materials.title as material_title, subjects.name as subject_name, ROUND(AVG(study_material_feedback.rating), 2) as average_rating, COUNT(study_material_feedback.rating) as rating_count')
            ->groupBy('study_material_feedback.post_id', 'materials.title', 'subjects.name');

        if ($quizId && Schema::hasColumn('posts', 'parent_material_id')) {
            $query->whereExists(function ($exists) use ($quizId) {
                $exists->selectRaw('1')
                    ->from('posts as quizzes')
                    ->whereColumn('quizzes.parent_material_id', 'study_material_feedback.post_id')
                    ->where('quizzes.id', $quizId);
            });
        }

        if ($sort === 'high_rating') {
            $query->orderByDesc('average_rating')->orderByDesc('rating_count');
        } else {
            $query->orderBy('average_rating')->orderByDesc('rating_count');
        }

        return $query
            ->limit(15)
            ->get()
            ->map(fn ($row) => [
                'material_id' => (int) $row->material_id,
                'material_title' => (string) $row->material_title,
                'subject_name' => $row->subject_name,
                'average_rating' => (float) $row->average_rating,
                'rating_count' => (int) $row->rating_count,
            ])
            ->values()
            ->all();
    }

    /**
     * Build insights of frequently wrong quiz questions (by wrong answer count and error rate).
     * Filters by material, subject, quiz, and time range.
     * Returns top 20 questions with highest wrong count.
     *
     * @return array<int, array<string, mixed>>
     */
    private function buildFrequentlyWrongQuestionsInsights(?int $materialId, ?int $subjectId, ?int $quizId, ?CarbonInterface $since, string $sort): array
    {
        if (! Schema::hasTable('quiz_mistakes') || ! Schema::hasColumn('posts', 'parent_material_id')) {
            return [];
        }

        $query = DB::table('quiz_mistakes as qm')
            ->join('posts as quizzes', 'quizzes.id', '=', 'qm.post_id')
            ->leftJoin('posts as materials', 'materials.id', '=', 'quizzes.parent_material_id')
            ->leftJoin('subjects', 'subjects.id', '=', 'materials.subject_id')
            ->where('quizzes.post_type', 'quiz')
            ->when($materialId, fn ($builder) => $builder->where('materials.id', $materialId))
            ->when($subjectId, fn ($builder) => $builder->where('materials.subject_id', $subjectId))
            ->when($quizId, fn ($builder) => $builder->where('quizzes.id', $quizId))
            ->when($since, fn ($builder) => $builder->where('qm.updated_at', '>=', $since))
            ->selectRaw('quizzes.id as quiz_id, quizzes.title as quiz_title, materials.id as material_id, materials.title as material_title, subjects.name as subject_name, qm.question_index, SUM(CASE WHEN qm.is_correct = 0 THEN 1 ELSE 0 END) as wrong_count, COUNT(*) as total_attempts')
            ->groupBy('quizzes.id', 'quizzes.title', 'materials.id', 'materials.title', 'subjects.name', 'qm.question_index')
            ->havingRaw('SUM(CASE WHEN qm.is_correct = 0 THEN 1 ELSE 0 END) > 0');

        if ($sort === 'most_wrong') {
            $query->orderByDesc('wrong_count')->orderByDesc('total_attempts');
        } else {
            $query->orderByDesc('wrong_count')->orderByDesc('total_attempts');
        }

        return $query
            ->limit(20)
            ->get()
            ->map(function ($row) {
                $wrongCount = (int) $row->wrong_count;
                $totalAttempts = (int) $row->total_attempts;

                return [
                    'quiz_id' => (int) $row->quiz_id,
                    'quiz_title' => (string) $row->quiz_title,
                    'material_id' => $row->material_id !== null ? (int) $row->material_id : null,
                    'material_title' => $row->material_title,
                    'subject_name' => $row->subject_name,
                    'question_index' => (int) $row->question_index,
                    'wrong_count' => $wrongCount,
                    'total_attempts' => $totalAttempts,
                    'error_rate' => $totalAttempts > 0 ? round(($wrongCount / $totalAttempts) * 100, 1) : 0.0,
                ];
            })
            ->values()
            ->all();
    }

}

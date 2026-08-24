<?php

namespace App\Services;

use App\Models\Post;
use App\Models\StudyMaterialFeedback;
use App\Models\Subject;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TeacherMaterialInsightsService
{
    /** @return array<int, array<string, mixed>> */
    public function materialOptions(): array
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
            ])->values()->all();
    }

    /** @return array<int, array<string, mixed>> */
    public function subjectOptions(): array
    {
        return Subject::query()->orderBy('name')->get(['id', 'name'])->values()->all();
    }

    /** @return array<int, array<string, mixed>> */
    public function quizOptions(): array
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
            ])->values()->all();
    }

    /** @return array<int, array<string, mixed>> */
    public function lowRatedMaterials(
        ?int $materialId,
        ?int $subjectId,
        ?int $quizId,
        ?CarbonInterface $since,
        string $sort,
        int $teacherId,
    ): array {
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
                $exists->selectRaw('1')->from('posts as quizzes')
                    ->whereColumn('quizzes.parent_material_id', 'study_material_feedback.post_id')
                    ->where('quizzes.id', $quizId);
            });
        }

        $sort === 'high_rating'
            ? $query->orderByDesc('average_rating')->orderByDesc('rating_count')
            : $query->orderBy('average_rating')->orderByDesc('rating_count');

        return $query->limit(15)->get()->map(fn ($row) => [
            'material_id' => (int) $row->material_id,
            'material_title' => (string) $row->material_title,
            'subject_name' => $row->subject_name,
            'average_rating' => (float) $row->average_rating,
            'rating_count' => (int) $row->rating_count,
        ])->values()->all();
    }

    /** @return array<int, array<string, mixed>> */
    public function frequentlyWrongQuestions(
        ?int $materialId,
        ?int $subjectId,
        ?int $quizId,
        ?CarbonInterface $since,
    ): array {
        if (! Schema::hasTable('quiz_mistakes') || ! Schema::hasColumn('posts', 'parent_material_id')) {
            return [];
        }

        return DB::table('quiz_mistakes as qm')
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
            ->havingRaw('SUM(CASE WHEN qm.is_correct = 0 THEN 1 ELSE 0 END) > 0')
            ->orderByDesc('wrong_count')->orderByDesc('total_attempts')
            ->limit(20)->get()
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
            })->values()->all();
    }
}

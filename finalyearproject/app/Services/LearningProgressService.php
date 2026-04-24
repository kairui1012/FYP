<?php

namespace App\Services;

use App\Models\Lesson;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class LearningProgressService
{
    public function buildLearningOverview(?User $user): array
    {
        if (! $user) {
            return $this->getEmptyOverview();
        }

        $recentLesson = $this->getMostRecentLesson();
        $subjectExperiences = $this->getSubjectExperiences($user, $recentLesson);
        $currentSubjectExperience = $subjectExperiences[0] ?? $this->getEmptySubjectExperience();

        return [
            'continue_learning' => $recentLesson ? $this->serializeLesson($recentLesson) : null,
            'current_subject_experience' => $currentSubjectExperience,
            'subject_experiences' => $subjectExperiences,
            'recommended_materials' => $this->getRecommendedMaterials($recentLesson),
            'today_goal' => $this->getTodayGoal($user),
        ];
    }

    private function getMostRecentLesson(): ?Lesson
    {
        return Lesson::query()
            ->with(['subject:id,name'])
            ->where('is_published', true)
            ->whereNotNull('source_post_id')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first(['id', 'subject_id', 'source_post_id', 'title', 'sequence']);
    }

    private function serializeLesson(Lesson $lesson): array
    {
        return [
            'lesson_id' => $lesson->id,
            'post_id' => $lesson->source_post_id,
            'title' => $lesson->title,
            'subject_id' => $lesson->subject_id,
            'subject_name' => $lesson->subject?->name,
        ];
    }

    private function getSubjectExperiences(User $user, ?Lesson $recentLesson): array
    {
        $materialsCreated = DB::table('lessons')
            ->join('posts', 'posts.id', '=', 'lessons.source_post_id')
            ->where('posts.user_id', $user->id)
            ->where('posts.post_type', 'material')
            ->whereNotNull('lessons.subject_id')
            ->selectRaw('lessons.subject_id, COUNT(*) as total')
            ->groupBy('lessons.subject_id')
            ->pluck('total', 'lessons.subject_id')
            ->map(fn ($total) => (int) $total)
            ->all();

        $questionsPosted = DB::table('posts')
            ->where('user_id', $user->id)
            ->where('post_type', 'question')
            ->whereNotNull('subject_id')
            ->selectRaw('subject_id, COUNT(*) as total')
            ->groupBy('subject_id')
            ->pluck('total', 'subject_id')
            ->map(fn ($total) => (int) $total)
            ->all();

        $quizzesCreated = DB::table('posts')
            ->where('user_id', $user->id)
            ->where('post_type', 'quiz')
            ->whereNotNull('subject_id')
            ->selectRaw('subject_id, COUNT(*) as total')
            ->groupBy('subject_id')
            ->pluck('total', 'subject_id')
            ->map(fn ($total) => (int) $total)
            ->all();

        $quizzesCompleted = Schema::hasTable('quiz_completions')
            ? DB::table('quiz_completions')
                ->where('user_id', $user->id)
                ->whereNotNull('subject_id')
                ->selectRaw('subject_id, COUNT(*) as total')
                ->groupBy('subject_id')
                ->pluck('total', 'subject_id')
                ->map(fn ($total) => (int) $total)
                ->all()
            : [];

        $subjectScores = [];
        $subjectIds = array_unique([
            ...array_keys($materialsCreated),
            ...array_keys($questionsPosted),
            ...array_keys($quizzesCreated),
            ...array_keys($quizzesCompleted),
        ]);

        foreach ($subjectIds as $subjectId) {
            $materials = (int) ($materialsCreated[$subjectId] ?? 0);
            $questions = (int) ($questionsPosted[$subjectId] ?? 0);
            $completedQuiz = (int) ($quizzesCompleted[$subjectId] ?? 0);
            $createdQuiz = (int) ($quizzesCreated[$subjectId] ?? 0);
            $totalXp = ($materials * 5) + ($questions * 1) + ($completedQuiz * 5) + ($createdQuiz * 10);

            $subjectScores[(int) $subjectId] = [
                'subject_id' => (int) $subjectId,
                'completed_materials' => $materials,
                'questions_posted' => $questions,
                'quizzes_completed' => $completedQuiz,
                'quizzes_created' => $createdQuiz,
                'total_xp' => $totalXp,
            ];
        }

        if (empty($subjectScores)) {
            return [];
        }

        $focusSubjectId = (int) ($recentLesson?->subject_id ?? 0);
        $subjectNames = DB::table('subjects')
            ->whereIn('id', array_keys($subjectScores))
            ->pluck('name', 'id')
            ->all();

        return collect($subjectScores)
            ->values()
            ->sort(function (array $left, array $right) use ($focusSubjectId, $subjectNames) {
                $leftFocused = (int) ($left['subject_id'] === $focusSubjectId);
                $rightFocused = (int) ($right['subject_id'] === $focusSubjectId);

                if ($leftFocused !== $rightFocused) {
                    return $rightFocused <=> $leftFocused;
                }

                if ((int) $left['total_xp'] !== (int) $right['total_xp']) {
                    return (int) $right['total_xp'] <=> (int) $left['total_xp'];
                }

                $leftName = (string) ($subjectNames[$left['subject_id']] ?? '');
                $rightName = (string) ($subjectNames[$right['subject_id']] ?? '');

                return strcasecmp($leftName, $rightName);
            })
            ->map(function (array $row) use ($subjectNames) {
                $totalXp = (int) $row['total_xp'];
                $xpPerLevel = 100;
                $level = (int) floor($totalXp / $xpPerLevel) + 1;
                $xpInLevel = $totalXp % $xpPerLevel;

                return [
                    'subject_id' => (int) $row['subject_id'],
                    'subject_name' => (string) ($subjectNames[$row['subject_id']] ?? ''),
                    'total_xp' => $totalXp,
                    'level' => $level,
                    'xp_in_level' => $xpInLevel,
                    'xp_per_level' => $xpPerLevel,
                    'progress_percent' => (int) round(($xpInLevel / $xpPerLevel) * 100),
                    'completed_materials' => (int) $row['completed_materials'],
                    'questions_posted' => (int) $row['questions_posted'],
                    'quizzes_completed' => (int) $row['quizzes_completed'],
                    'quizzes_created' => (int) $row['quizzes_created'],
                ];
            })
            ->values()
            ->all();
    }

    private function getEmptySubjectExperience(): array
    {
        return [
            'subject_id' => null,
            'subject_name' => null,
            'total_xp' => 0,
            'level' => 1,
            'xp_in_level' => 0,
            'xp_per_level' => 100,
            'progress_percent' => 0,
            'completed_materials' => 0,
            'questions_posted' => 0,
            'quizzes_completed' => 0,
            'quizzes_created' => 0,
        ];
    }

    private function getRecommendedMaterials(?Lesson $recentLesson): array
    {
        $focusSubjectId = $recentLesson?->subject_id;

        return Lesson::query()
            ->with(['subject:id,name'])
            ->where('is_published', true)
            ->whereNotNull('source_post_id')
            ->orderByDesc('sequence')
            ->orderByDesc('id')
            ->get(['id', 'subject_id', 'source_post_id', 'title', 'sequence'])
            ->map(function (Lesson $lesson) use ($focusSubjectId) {
                $isFocusedSubject = (int) ($lesson->subject_id ?? 0) === (int) ($focusSubjectId ?? 0);
                $focusScore = $isFocusedSubject ? 40 : 0;
                $sequenceScore = max(1, 100 - ((int) $lesson->sequence * 3));

                return [
                    'post_id' => (int) $lesson->source_post_id,
                    'lesson_id' => $lesson->id,
                    'title' => $lesson->title,
                    'subject_id' => $lesson->subject_id,
                    'subject_name' => $lesson->subject?->name,
                    'reason' => $isFocusedSubject ? 'Related to your current subject' : 'New material to explore',
                    'score' => $focusScore + $sequenceScore,
                ];
            })
            ->filter()
            ->sortByDesc('score')
            ->take(3)
            ->values()
            ->map(fn (array $material) => [
                'post_id' => $material['post_id'],
                'lesson_id' => $material['lesson_id'],
                'title' => $material['title'],
                'subject_id' => $material['subject_id'],
                'subject_name' => $material['subject_name'],
                'reason' => $material['reason'],
            ])
            ->all();
    }

    private function getTodayGoal(User $user): array
    {
        $today = Carbon::today();
        $todayCompletions = Schema::hasTable('quiz_completions')
            ? DB::table('quiz_completions')
                ->where('user_id', $user->id)
                ->whereDate('completed_at', $today)
                ->count()
            : 0;

        $earnedPoints = $todayCompletions * 5;
        $targetPoints = 10;
        $progressPercent = (int) round((min($targetPoints, $earnedPoints) / $targetPoints) * 100);

        return [
            'target_points' => $targetPoints,
            'earned_points' => $earnedPoints,
            'completed_lessons' => (int) $todayCompletions,
            'progress_percent' => $progressPercent,
        ];
    }

    private function getEmptyOverview(): array
    {
        return [
            'continue_learning' => null,
            'current_subject_experience' => $this->getEmptySubjectExperience(),
            'subject_experiences' => [],
            'recommended_materials' => [],
            'today_goal' => [
                'target_points' => 10,
                'earned_points' => 0,
                'completed_lessons' => 0,
                'progress_percent' => 0,
            ],
        ];
    }
}
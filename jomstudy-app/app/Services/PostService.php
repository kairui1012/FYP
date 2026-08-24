<?php

namespace App\Services;

use App\Models\Language;
use App\Models\Post;
use App\Models\QuizAttempt;
use App\Models\QuizCompletion;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PostService
{
    public function __construct(
        private readonly PointsService $pointsService,
        private readonly MaterialVersionService $materialVersionService,
        private readonly StudyMaterialService $studyMaterialService,
    ) {}

    public function followingIds(?User $user): array
    {
        return $user?->following()->pluck('users.id')->all() ?? [];
    }

    public function categoryLanguages()
    {
        return Language::query()->withCount('posts')->orderByDesc('posts_count')->orderBy('name')
            ->get(['id', 'code', 'name'])->map(fn (Language $language) => [
                'id' => $language->id, 'code' => $language->code,
                'name' => $language->name, 'posts_count' => (int) $language->posts_count,
            ])->values();
    }

    public function categorySubjects()
    {
        return Subject::query()->withCount('posts')->orderByDesc('posts_count')->orderBy('name')
            ->get(['id', 'name'])->map(fn (Subject $subject) => [
                'id' => $subject->id, 'name' => $subject->name,
                'posts_count' => (int) $subject->posts_count,
            ])->values();
    }

    public function attachViewerFlags(Post $post, ?int $userId): void
    {
        $post->setAttribute('is_liked', $userId ? $post->likes()->where('user_id', $userId)->exists() : false);
        $post->setAttribute('is_saved', $userId ? $post->bookmarkItems()->where('user_id', $userId)->exists() : false);
        $post->setAttribute('is_lesson_completed', false);
        $post->setAttribute('is_quiz_completed', $post->post_type === 'quiz' && $userId ? $this->hasCompletedQuiz($userId, $post->id) : false);
        $post->setAttribute('quiz_attempts', $userId ? $this->quizAttempts($userId, $post->id) : []);
    }

    public function update(Post $post, array $attributes, bool $material): void
    {
        if ($material && Schema::hasColumn('posts', 'material_improved_from_feedback') && $this->studyMaterialService->hasFeedback($post)) {
            $attributes['material_improved_from_feedback'] = true;
        }
        $post->update($attributes);

        if ($material) {
            $this->materialVersionService->createSnapshot($post->refresh());
        }
    }

    public function delete(Post $post): void
    {
        DB::transaction(function () use ($post): void {
            $owner = $post->user()->first();
            if ($owner) {
                $this->pointsService->revoke($owner, $post->post_type === 'material' ? 'resource_uploaded' : 'question_asked', $post);
            }
            $post->delete();
        });
    }

    private function hasCompletedQuiz(int $userId, int $postId): bool
    {
        return Schema::hasTable('quiz_completions') && QuizCompletion::query()
            ->where('user_id', $userId)->where('post_id', $postId)->exists();
    }

    private function quizAttempts(int $userId, int $postId): array
    {
        if (! Schema::hasTable('quiz_mistakes')) {
            return [];
        }

        return QuizAttempt::query()->where('user_id', $userId)->where('post_id', $postId)
            ->orderBy('question_index')->get(['question_index', 'selected_answer_index', 'is_correct'])
            ->map(fn (QuizAttempt $attempt) => [
                'question_index' => (int) $attempt->question_index,
                'selected_answer_index' => (int) $attempt->selected_answer_index,
                'is_correct' => (bool) $attempt->is_correct,
            ])->values()->all();
    }
}

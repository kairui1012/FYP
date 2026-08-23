<?php

namespace App\Http\Controllers\Concerns;

use App\Models\MaterialQuizAttempt;
use App\Models\Post;
use App\Models\QuizCompletion;
use App\Models\StudyMaterialFeedback;
use App\Models\StudyMaterialVersion;
use App\Models\StudyMaterialView;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

trait HandlesStudyMaterials
{
    /**
     * Record a user's view of a study material (increments view count).
     */
    private function recordMaterialView(Post $post, ?int $userId): void
    {
        if (! $userId || ! Schema::hasTable('study_material_views')) {
            return;
        }

        $view = StudyMaterialView::query()->firstOrCreate(
            ['user_id' => $userId, 'post_id' => $post->id],
            ['view_count' => 0, 'last_viewed_at' => now()],
        );

        $view->forceFill([
            'view_count' => ((int) $view->view_count) + 1,
            'last_viewed_at' => now(),
        ])->save();
    }

    /**
     * Record a user's quiz attempt linked to a material with score and result.
     */
    private function recordMaterialQuizAttempt(User $user, Post $quizPost, bool $isCorrect): void
    {
        if (
            ! Schema::hasTable('material_quiz_attempts')
            || ! Schema::hasColumn('posts', 'parent_material_id')
            || ! $quizPost->parent_material_id
        ) {
            return;
        }

        MaterialQuizAttempt::query()->create([
            'user_id' => $user->id,
            'post_id' => $quizPost->id,
            'material_id' => $quizPost->parent_material_id,
            'score' => $isCorrect ? 1 : 0,
            'total_questions' => 1,
        ]);
    }

    /**
     * Check if a material has any feedback (ratings or votes) submitted by users.
     */
    private function materialHasFeedback(Post $post): bool
    {
        return Schema::hasTable('study_material_feedback')
            && StudyMaterialFeedback::query()
                ->where('post_id', $post->id)
                ->where(function ($query) {
                    $query->whereNotNull('rating')
                        ->orWhereNotNull('vote');
                })
                ->exists();
    }

    /**
     * Build aggregated feedback summary for a material (ratings, votes, recommendations).
     */
    private function buildMaterialFeedbackSummary(Post $post, ?int $userId): array
    {
        if (! Schema::hasTable('study_material_feedback')) {
            return [
                'average_rating' => 0.0,
                'rating_count' => 0,
                'upvotes' => 0,
                'downvotes' => 0,
                'recommended_count' => 0,
                'not_recommended_count' => 0,
                'total_votes' => 0,
                'recommendation_rate' => 0,
                'feedback_count' => 0,
                'latest_feedback' => [],
            ];
        }

        $base = StudyMaterialFeedback::query()->where('post_id', $post->id);
        $snapshot = $this->materialVersionService->buildFeedbackSnapshot($post);
        $upvotes = $snapshot['recommended_count'];
        $downvotes = $snapshot['not_recommended_count'];
        $totalVotes = $snapshot['total_votes'];
        return [
            'average_rating' => $snapshot['average_rating'],
            'rating_count' => $snapshot['rating_count'],
            'upvotes' => $upvotes,
            'downvotes' => $downvotes,
            'recommended_count' => $upvotes,
            'not_recommended_count' => $downvotes,
            'total_votes' => $totalVotes,
            'recommendation_rate' => $snapshot['recommendation_rate'],
            'feedback_count' => 0,
            'latest_feedback' => [],
        ];
    }

    /**
     * Get current user's feedback on a material (rating, vote, timestamps).
     */
    private function buildMaterialUserFeedback(Post $post, ?int $userId): ?array
    {
        if (! $userId || ! Schema::hasTable('study_material_feedback')) {
            return null;
        }

        $feedback = StudyMaterialFeedback::query()
            ->where('post_id', $post->id)
            ->where('user_id', $userId)
            ->first();

        if (! $feedback) {
            return null;
        }

        return [
            'id' => $feedback->id,
            'vote' => $feedback->vote,
            'rating' => $feedback->rating,
            'created_at' => optional($feedback->created_at)->toISOString(),
            'updated_at' => optional($feedback->updated_at)->toISOString(),
        ];
    }

    /**
     * Build analytics for a material (views, quiz attempts, average scores, user improvements).
     * Includes feedback and view statistics for teacher insights.
     */
    private function buildLearningAnalytics(Post $post): array
    {
        $viewStats = ['views' => 0, 'unique_users' => 0];

        if (Schema::hasTable('study_material_views')) {
            $viewStats = StudyMaterialView::query()
                ->where('post_id', $post->id)
                ->selectRaw('COALESCE(SUM(view_count), 0) as views, COUNT(*) as unique_users')
                ->first()
                ?->only(['views', 'unique_users']) ?? $viewStats;
        }

        $quizAttempts = 0;
        $averageQuizScore = 0.0;
        $improvement = 0.0;

        if (Schema::hasTable('material_quiz_attempts')) {
            $attempts = MaterialQuizAttempt::query()
                ->where('material_id', $post->id)
                ->orderBy('created_at')
                ->get(['user_id', 'score', 'total_questions', 'created_at']);

            $quizAttempts = $attempts->count();
            $percentages = $attempts
                ->filter(fn (MaterialQuizAttempt $attempt) => (int) $attempt->total_questions > 0)
                ->map(fn (MaterialQuizAttempt $attempt) => ((int) $attempt->score / max(1, (int) $attempt->total_questions)) * 100);
            $averageQuizScore = $percentages->isNotEmpty() ? round($percentages->avg(), 1) : 0.0;

            $userImprovements = $attempts
                ->groupBy('user_id')
                ->map(function ($userAttempts) {
                    if ($userAttempts->count() < 2) {
                        return null;
                    }

                    $first = $userAttempts->first();
                    $latest = $userAttempts->last();

                    $firstScore = ((int) $first->score / max(1, (int) $first->total_questions)) * 100;
                    $latestScore = ((int) $latest->score / max(1, (int) $latest->total_questions)) * 100;

                    return $latestScore - $firstScore;
                })
                ->filter(fn ($value) => $value !== null);

            $improvement = $userImprovements->isNotEmpty() ? round($userImprovements->avg(), 1) : 0.0;
        }

        $feedback = $this->buildMaterialFeedbackSummary($post, null);

        return [
            'views' => (int) ($viewStats['views'] ?? 0),
            'unique_users' => (int) ($viewStats['unique_users'] ?? 0),
            'quiz_attempts' => $quizAttempts,
            'average_quiz_score' => $averageQuizScore,
            'improvement_across_attempts' => $improvement,
            'average_rating' => $feedback['average_rating'],
            'feedback_count' => $feedback['feedback_count'],
        ];
    }

    /**
     * Get all quizzes linked to a material with user's completion status.
     * Returns serialized quiz data including user follow status.
     */
    private function buildLinkedQuizzes(Post $post, array $followingIds, ?int $userId = null): array
    {
        if (! Schema::hasColumn('posts', 'parent_material_id')) {
            return [];
        }

        $quizzes = Post::query()
            ->where('parent_material_id', $post->id)
            ->where('post_type', 'quiz')
            ->with(['user:id,name,role,is_verified', 'user.socialAccounts:id,user_id,avatar', 'subject:id,name', 'language:id,code,name'])
            ->withCount(['likes', 'comments', 'bookmarkItems as saves_count'])
            ->latest()
            ->get();

        $completedQuizIds = [];
        if ($userId && Schema::hasTable('quiz_completions')) {
            $completedQuizIds = QuizCompletion::query()
                ->where('user_id', $userId)
                ->whereIn('post_id', $quizzes->pluck('id')->all())
                ->pluck('post_id')
                ->map(fn ($id) => (int) $id)
                ->all();
        }

        return $quizzes
            ->map(function (Post $quiz) use ($followingIds, $completedQuizIds) {
                $quiz->setAttribute('is_quiz_completed', in_array($quiz->id, $completedQuizIds, true));

                return $this->serializationService->serialize($quiz, $followingIds);
            })
            ->values()
            ->all();
    }

    /**
     * Attach learning state and path to material posts in a collection.
     * Sets material_learning_state and material_learning_path attributes.
     */
    private function attachMaterialLearningStates(Collection $posts, ?int $userId): void
    {
        $materialIds = $posts
            ->filter(fn (Post $post) => $post->post_type === 'material')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        if (count($materialIds) === 0) {
            return;
        }

        $stateMap = $this->buildMaterialLearningStateMap($materialIds, $userId);

        $posts->each(function (Post $post) use ($stateMap) {
            if ($post->post_type !== 'material') {
                return;
            }

            $post->setAttribute('material_learning_state', $stateMap[$post->id]['state'] ?? 'unread');
            $post->setAttribute('material_learning_path', $stateMap[$post->id]['path'] ?? []);
        });
    }

    /**
     * Attach feedback summary to material posts in a collection.
     * Sets material_feedback_summary attribute for each material post.
     */
    private function attachMaterialFeedbackSummaries(Collection $posts, ?int $userId): void
    {
        $posts->each(function (Post $post) use ($userId) {
            if ($post->post_type !== 'material') {
                return;
            }

            $post->setAttribute(
                'material_feedback_summary',
                $this->buildMaterialFeedbackSummary($post, $userId),
            );
        });
    }

    /**
     * @param  array<int>  $materialIds
     * @return array<int, array{state: string, path: array<int, array{key: string, status: string, required: bool, progress_current?: int, progress_target?: int}>}>
     */
    private function buildMaterialLearningStateMap(array $materialIds, ?int $userId): array
    {
        $uniqueMaterialIds = collect($materialIds)
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($uniqueMaterialIds->isEmpty()) {
            return [];
        }

        $quizIdsByMaterial = [];
        if (Schema::hasColumn('posts', 'parent_material_id')) {
            $quizIdsByMaterial = Post::query()
                ->where('post_type', 'quiz')
                ->whereIn('parent_material_id', $uniqueMaterialIds->all())
                ->get(['id', 'parent_material_id'])
                ->groupBy(fn (Post $quiz) => (int) $quiz->parent_material_id)
                ->map(fn (Collection $rows) => $rows->pluck('id')->map(fn ($id) => (int) $id)->values()->all())
                ->all();
        }

        $viewedMaterialIds = [];
        $attemptedMaterialIds = [];
        $feedbackMaterialIds = [];
        $completedQuizIds = [];

        if ($userId) {
            if (Schema::hasTable('study_material_views')) {
                $viewedMaterialIds = StudyMaterialView::query()
                    ->where('user_id', $userId)
                    ->whereIn('post_id', $uniqueMaterialIds->all())
                    ->pluck('post_id')
                    ->map(fn ($id) => (int) $id)
                    ->all();
            }

            if (Schema::hasTable('material_quiz_attempts')) {
                $attemptedMaterialIds = MaterialQuizAttempt::query()
                    ->where('user_id', $userId)
                    ->whereIn('material_id', $uniqueMaterialIds->all())
                    ->pluck('material_id')
                    ->map(fn ($id) => (int) $id)
                    ->all();
            }

            if (Schema::hasTable('study_material_feedback')) {
                $feedbackMaterialIds = StudyMaterialFeedback::query()
                    ->where('user_id', $userId)
                    ->whereIn('post_id', $uniqueMaterialIds->all())
                    ->pluck('post_id')
                    ->map(fn ($id) => (int) $id)
                    ->all();
            }

            if (Schema::hasTable('quiz_completions')) {
                $allLinkedQuizIds = collect($quizIdsByMaterial)->flatten()->unique()->values()->all();
                if (count($allLinkedQuizIds) > 0) {
                    $completedQuizIds = QuizCompletion::query()
                        ->where('user_id', $userId)
                        ->whereIn('post_id', $allLinkedQuizIds)
                        ->pluck('post_id')
                        ->map(fn ($id) => (int) $id)
                        ->all();
                }
            }
        }

        $viewedSet = array_fill_keys($viewedMaterialIds, true);
        $attemptedSet = array_fill_keys($attemptedMaterialIds, true);
        $feedbackSet = array_fill_keys($feedbackMaterialIds, true);
        $completedQuizSet = array_fill_keys($completedQuizIds, true);

        $result = [];

        foreach ($uniqueMaterialIds as $materialId) {
            $linkedQuizIds = $quizIdsByMaterial[$materialId] ?? [];
            $hasLinkedQuiz = count($linkedQuizIds) > 0;
            $requiredQuizCompletions = $hasLinkedQuiz ? min(2, count($linkedQuizIds)) : 0;
            $hasViewed = isset($viewedSet[$materialId]);
            $hasAttemptedQuiz = isset($attemptedSet[$materialId]);
            $completedLinkedQuizzes = count(array_filter(
                $linkedQuizIds,
                fn (int $quizId) => isset($completedQuizSet[$quizId]),
            ));
            $quizProgressCount = min($completedLinkedQuizzes, $requiredQuizCompletions);
            $hasStartedQuiz = $hasAttemptedQuiz || $quizProgressCount > 0;
            $hasCompletedQuiz = $hasLinkedQuiz && $quizProgressCount >= $requiredQuizCompletions;
            $hasSubmittedFeedback = isset($feedbackSet[$materialId]);

            $state = $this->determineMaterialLearningState($hasLinkedQuiz, $hasViewed, $hasStartedQuiz, $hasCompletedQuiz);

            $result[$materialId] = [
                'state' => $state,
                'path' => $this->buildMaterialLearningPath(
                    $hasLinkedQuiz,
                    $hasViewed,
                    $hasStartedQuiz,
                    $hasCompletedQuiz,
                    $hasSubmittedFeedback,
                    $quizProgressCount,
                    $requiredQuizCompletions,
                ),
            ];
        }

        return $result;
    }

    /**
     * Determine learning state of a material based on user's progress (unread, read, in_progress, completed).
     */
    private function determineMaterialLearningState(
        bool $hasLinkedQuiz,
        bool $hasViewed,
        bool $hasAttemptedQuiz,
        bool $hasCompletedQuiz,
    ): string {
        if ($hasLinkedQuiz) {
            if ($hasCompletedQuiz) {
                return 'completed';
            }

            if ($hasViewed || $hasAttemptedQuiz) {
                return 'in_progress';
            }

            return 'unread';
        }

        return $hasViewed ? 'read' : 'unread';
    }

    /**
     * @return array<int, array{key: string, status: string, required: bool, progress_current?: int, progress_target?: int}>
     */
    private function buildMaterialLearningPath(
        bool $hasLinkedQuiz,
        bool $hasViewed,
        bool $hasAttemptedQuiz,
        bool $hasCompletedQuiz,
        bool $hasSubmittedFeedback,
        int $quizProgressCount,
        int $requiredQuizCompletions,
    ): array {
        return [
            [
                'key' => 'read_material',
                'status' => $hasViewed ? 'completed' : 'pending',
                'required' => true,
            ],
            [
                'key' => 'complete_quiz',
                'status' => ! $hasLinkedQuiz
                    ? 'not_required'
                    : ($hasCompletedQuiz ? 'completed' : ($hasAttemptedQuiz ? 'in_progress' : 'pending')),
                'required' => $hasLinkedQuiz,
                'progress_current' => $quizProgressCount,
                'progress_target' => $requiredQuizCompletions,
            ],
            [
                'key' => 'submit_feedback',
                'status' => $hasSubmittedFeedback
                    ? 'completed'
                    : (($hasViewed || $hasAttemptedQuiz || $hasCompletedQuiz) ? 'in_progress' : 'pending'),
                'required' => true,
            ],
        ];
    }

    /**
     * Sync average rating and rating count to the latest version of a material.
     */
    private function syncLatestVersionRating(int $postId): void
    {
        if (
            ! Schema::hasTable('study_material_versions')
            || ! Schema::hasTable('study_material_feedback')
            || ! Schema::hasColumn('study_material_versions', 'average_rating')
            || ! Schema::hasColumn('study_material_versions', 'rating_count')
        ) {
            return;
        }

        $latestVersion = StudyMaterialVersion::query()
            ->where('post_id', $postId)
            ->orderByDesc('version_number')
            ->first();

        if (! $latestVersion) {
            return;
        }

        $agg = StudyMaterialFeedback::query()
            ->where('post_id', $postId)
            ->whereNotNull('rating')
            ->selectRaw('ROUND(AVG(rating), 2) as avg_rating, COUNT(*) as cnt')
            ->first();

        $latestVersion->update([
            'average_rating' => $agg ? (float) $agg->avg_rating : 0.0,
            'rating_count' => $agg ? (int) $agg->cnt : 0,
        ]);
    }
}

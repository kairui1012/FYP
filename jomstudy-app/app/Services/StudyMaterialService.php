<?php

namespace App\Services;

use App\Models\Post;
use App\Models\QuizCompletion;
use App\Models\StudyMaterialFeedback;
use App\Models\User;
use App\Services\Traits\ManagesStudyMaterials;
use Illuminate\Support\Collection;

class StudyMaterialService
{
    use ManagesStudyMaterials;

    public function __construct(
        private readonly MaterialVersionService $materialVersionService,
        private readonly PostSerializationService $serializationService,
    ) {}

    public function recordView(Post $post, ?int $userId): void
    {
        $this->recordMaterialView($post, $userId);
    }

    public function recordQuizAttempt(User $user, Post $post, bool $correct): void
    {
        $this->recordMaterialQuizAttempt($user, $post, $correct);
    }

    public function hasFeedback(Post $post): bool
    {
        return $this->materialHasFeedback($post);
    }

    public function feedbackSummary(Post $post): array
    {
        return $this->buildMaterialFeedbackSummary($post);
    }

    public function userFeedback(Post $post, ?int $userId): ?array
    {
        return $this->buildMaterialUserFeedback($post, $userId);
    }

    public function analytics(Post $post): array
    {
        return $this->buildLearningAnalytics($post);
    }

    public function linkedQuizzes(Post $post, array $followingIds, ?int $userId = null): array
    {
        return $this->buildLinkedQuizzes($post, $followingIds, $userId);
    }

    public function attachLearningStates(Collection $posts, ?int $userId): void
    {
        $this->attachMaterialLearningStates($posts, $userId);
    }

    public function attachFeedbackSummaries(Collection $posts): void
    {
        $this->attachMaterialFeedbackSummaries($posts);
    }

    public function learningStateMap(array $materialIds, ?int $userId): array
    {
        return $this->buildMaterialLearningStateMap($materialIds, $userId);
    }

    public function saveFeedback(User $user, Post $post, array $feedback): void
    {
        StudyMaterialFeedback::query()->updateOrCreate(
            ['user_id' => $user->id, 'post_id' => $post->id],
            ['vote' => $feedback['vote'] ?? null, 'rating' => $feedback['rating'] ?? null],
        );
        $this->syncLatestVersionRating($post->id);
    }

    public function completeQuiz(User $user, Post $post): bool
    {
        $completion = QuizCompletion::query()->firstOrCreate(
            ['user_id' => $user->id, 'post_id' => $post->id],
            ['subject_id' => $post->subject_id, 'completed_at' => now()],
        );

        return $completion->wasRecentlyCreated;
    }
}

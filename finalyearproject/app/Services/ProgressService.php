<?php

namespace App\Services;

use App\Models\Like;
use App\Models\Post;
use App\Models\QuizMistake;
use App\Models\User;
use App\Models\UserProgress;

class ProgressService
{
    public function __construct(private readonly AchievementService $achievementService) {}

    public function syncMistakeReview(
        User $user,
        Post $post,
        int $questionIndex,
        int $selectedAnswerIndex,
        bool $isCorrect,
    ): void {
        QuizMistake::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'post_id' => $post->id,
                'question_index' => $questionIndex,
            ],
            [
                'selected_answer_index' => $selectedAnswerIndex,
                'is_correct' => $isCorrect,
                'attempted_at' => now(),
            ],
        );
    }

    /**
     * Record a quiz attempt (correct or incorrect) and re-evaluate achievements.
     *
     * @param  bool  $isFirstCompletion  True when QuizCompletion was just created (not a repeat).
     * @return string[]  Newly unlocked achievement keys.
     */
    public function recordQuizAttempt(User $user, bool $isCorrect, bool $isFirstCompletion): array
    {
        $progress = UserProgress::firstOrCreate(
            ['user_id' => $user->id],
            ['quiz_scores' => []],
        );

        $scores   = is_array($progress->quiz_scores) ? $progress->quiz_scores : [];
        $scores[] = $isCorrect ? 1 : 0;

        // Keep only the last 20 attempts for trend analysis
        if (count($scores) > 20) {
            $scores = array_slice($scores, -20);
        }

        $progress->total_questions_answered += 1;

        if ($isCorrect) {
            $progress->correct_answers_count += 1;
        }

        if ($isCorrect && $isFirstCompletion) {
            $progress->quizzes_completed += 1;
        }

        $progress->quiz_scores      = $scores;
        $progress->improvement_score = $this->calculateImprovementScore($scores);
        $progress->save();

        return $this->achievementService->evaluateAchievements($user->fresh());
    }

    /**
     * Recount question/quiz posts from DB (robust against deletions) and re-evaluate.
     *
     * @return string[]
     */
    public function recordPostCreated(User $user, string $postType): array
    {
        $progress = UserProgress::firstOrCreate(['user_id' => $user->id]);

        // Recount so deletions don't cause drift
        $progress->total_post_posted      = $user->posts()->count();
        $progress->total_questions_posted = $user->posts()->where('post_type', 'question')->count();

        $progress->save();

        return $this->achievementService->evaluateAchievements($user->fresh());
    }
    

    /**
     * Recount likes received from DB (robust against un-likes) and re-evaluate.
     *
     * @return string[]
     */
    public function syncLikesReceived(User $user): array
    {
        $progress = UserProgress::firstOrCreate(['user_id' => $user->id]);

        $progress->total_likes_received = Like::query()
            ->whereHas('post', fn ($q) => $q->where('user_id', $user->id))
            ->count();

        $progress->save();

        return $this->achievementService->evaluateAchievements($user->fresh());
    }

    /**
     * Compare the first half of recent scores against the second half.
     * Returns the improvement as an integer percentage (can be negative).
     * Requires at least 6 data points to produce a meaningful result.
     */
    private function calculateImprovementScore(array $scores): int
    {
        if (count($scores) < 6) {
            return 0;
        }

        $half         = (int) floor(count($scores) / 2);
        $firstHalf    = array_slice($scores, 0, $half);
        $secondHalf   = array_slice($scores, -$half);
        $oldAccuracy  = array_sum($firstHalf) / count($firstHalf);
        $newAccuracy  = array_sum($secondHalf) / count($secondHalf);

        return (int) round(($newAccuracy - $oldAccuracy) * 100);
    }
}

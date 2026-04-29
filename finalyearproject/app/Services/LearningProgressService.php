<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\Post;
use App\Models\QuizCompletion;
use App\Models\QuizMistake;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\UserProgress;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

class LearningProgressService
{
    public function buildLearningOverview(?User $user): array
    {
        return [
            'learning_milestone' => $this->getClosestMilestone($user),
            'latest_posts' => $this->getLatestPosts($user),
            'today_score' => $this->getTodayScore($user),
            'leaderboard_points' => $this->getLeaderboardPoints($user),
            'mistake_review' => $this->getMistakeReview($user),
        ];
    }

    private function getClosestMilestone(?User $user): ?array
    {
        $achievements = Achievement::query()
            ->orderBy('threshold')
            ->get(['key', 'category', 'metric', 'threshold']);

        if ($achievements->isEmpty()) {
            return null;
        }

        $progress = $user
            ? UserProgress::query()->where('user_id', $user->id)->first()
            : null;

        $earnedKeys = $user
            ? UserAchievement::query()
                ->where('user_id', $user->id)
                ->pluck('achievement_key')
                ->all()
            : [];

        $items = $achievements->map(function (Achievement $achievement) use ($earnedKeys, $progress) {
            $current = $this->resolveMetricValue($achievement->metric, $progress);
            $threshold = (int) $achievement->threshold;

            return [
                'key' => $achievement->key,
                'category' => $achievement->category,
                'current' => $current,
                'threshold' => $threshold,
                'progress_percent' => $threshold > 0
                    ? min(100, (int) round(($current / $threshold) * 100))
                    : 0,
                'remaining' => max(0, $threshold - $current),
                'achieved' => in_array($achievement->key, $earnedKeys, true),
            ];
        });

        $pending = $items
            ->reject(fn (array $item) => $item['achieved'])
            ->sort(function (array $left, array $right) {
                if ($left['progress_percent'] !== $right['progress_percent']) {
                    return $right['progress_percent'] <=> $left['progress_percent'];
                }

                if ($left['remaining'] !== $right['remaining']) {
                    return $left['remaining'] <=> $right['remaining'];
                }

                return $left['threshold'] <=> $right['threshold'];
            })
            ->values();

        if ($pending->isNotEmpty()) {
            return $pending->first();
        }

        return $items
            ->sortByDesc('threshold')
            ->first();
    }

    private function getLatestPosts(?User $user): array
    {
        $query = Post::query()
            ->with(['subject:id,name', 'user:id,name'])
            ->latest();

        $source = 'community';

        if ($user) {
            $personalPosts = (clone $query)
                ->where('user_id', $user->id)
                ->take(3)
                ->get(['id', 'user_id', 'title', 'post_type', 'subject_id', 'created_at']);

            if ($personalPosts->isNotEmpty()) {
                $source = 'personal';

                return [
                    'source' => $source,
                    'items' => $personalPosts->map(fn (Post $post) => [
                        'id' => $post->id,
                        'title' => $post->title,
                        'post_type' => $post->post_type,
                        'subject_name' => $post->subject?->name,
                        'user_name' => $post->user?->name,
                        'created_at' => (string) $post->created_at,
                    ])->values()->all(),
                ];
            }
        }

        return [
            'source' => $source,
            'items' => $query
                ->take(3)
                ->get(['id', 'user_id', 'title', 'post_type', 'subject_id', 'created_at'])
                ->map(fn (Post $post) => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'post_type' => $post->post_type,
                    'subject_name' => $post->subject?->name,
                    'user_name' => $post->user?->name,
                    'created_at' => (string) $post->created_at,
                ])
                ->values()
                ->all(),
        ];
    }

    private function getTodayScore(?User $user): array
    {
        if (! $user || ! Schema::hasTable('quiz_completions')) {
            return [
                'points' => 0,
                'quizzes_completed' => 0,
            ];
        }

        $quizzesCompleted = QuizCompletion::query()
            ->where('user_id', $user->id)
            ->whereDate('completed_at', Carbon::today())
            ->count();

        return [
            'points' => (int) $quizzesCompleted * 5,
            'quizzes_completed' => (int) $quizzesCompleted,
        ];
    }

    private function getLeaderboardPoints(?User $user): array
    {
        if (! $user) {
            return [
                'points' => 0,
                'rank' => null,
                'points_to_next' => null,
                'is_hidden' => false,
            ];
        }

        $leaderboardUser = User::query()
            ->select(['id', 'total_points', 'show_on_leaderboard'])
            ->find($user->id);

        if (! $leaderboardUser) {
            return [
                'points' => 0,
                'rank' => null,
                'points_to_next' => null,
                'is_hidden' => false,
            ];
        }

        $points = (int) $leaderboardUser->total_points;

        if (! $leaderboardUser->show_on_leaderboard) {
            return [
                'points' => $points,
                'rank' => null,
                'points_to_next' => null,
                'is_hidden' => true,
            ];
        }

        $higherRankedUsers = fn (Builder $query) => $query
            ->where('total_points', '>', $points)
            ->orWhere(function (Builder $tieQuery) use ($leaderboardUser, $points) {
                $tieQuery
                    ->where('total_points', $points)
                    ->where('id', '<', $leaderboardUser->id);
            });

        $rank = User::query()
            ->where('show_on_leaderboard', true)
            ->where($higherRankedUsers)
            ->count() + 1;

        $nextRank = User::query()
            ->where('show_on_leaderboard', true)
            ->where($higherRankedUsers)
            ->orderBy('total_points')
            ->orderByDesc('id')
            ->first(['total_points']);

        return [
            'points' => $points,
            'rank' => (int) $rank,
            'points_to_next' => $nextRank
                ? max(0, (int) $nextRank->total_points - $points)
                : null,
            'is_hidden' => false,
        ];
    }

    private function getMistakeReview(?User $user): array
    {
        if (! $user || ! Schema::hasTable('quiz_mistakes')) {
            return [];
        }

        return QuizMistake::query()
            ->where('user_id', $user->id)
            ->where('is_correct', false)
            ->with(['post:id,title,subject_id,quiz_data', 'post.subject:id,name'])
            ->orderByDesc('attempted_at')
            ->take(3)
            ->get()
            ->map(fn (QuizMistake $mistake) => $this->serializeMistake($mistake))
            ->filter()
            ->values()
            ->all();
    }

    private function serializeMistake(QuizMistake $mistake): ?array
    {
        $post = $mistake->post;

        if (! $post) {
            return null;
        }

        $details = $this->extractQuizQuestionDetails(
            is_array($post->quiz_data) ? $post->quiz_data : [],
            (int) $mistake->question_index,
            (int) $mistake->selected_answer_index,
            $post->title,
        );

        return [
            'id' => $mistake->id,
            'post_id' => $post->id,
            'post_title' => $post->title,
            'question_index' => (int) $mistake->question_index,
            'question_text' => $details['question_text'],
            'subject_name' => $post->subject?->name,
            'selected_answer' => $details['selected_answer'],
            'correct_answer' => $details['correct_answer'],
            'attempted_at' => (string) $mistake->attempted_at,
        ];
    }

    private function extractQuizQuestionDetails(
        array $quizData,
        int $questionIndex,
        int $selectedAnswerIndex,
        string $fallbackTitle,
    ): array {
        $questionText = null;
        $selectedAnswer = null;
        $correctAnswer = null;

        if (isset($quizData['questions']) && is_array($quizData['questions'])) {
            $question = $quizData['questions'][$questionIndex] ?? null;

            if (is_array($question)) {
                $questionText = is_string($question['question'] ?? null) && trim((string) $question['question']) !== ''
                    ? trim((string) $question['question'])
                    : $fallbackTitle;

                $options = collect($question['options'] ?? [])
                    ->filter(fn ($option) => is_string($option))
                    ->values()
                    ->all();

                $selectedAnswer = $options[$selectedAnswerIndex] ?? null;
                $correctAnswer = $options[(int) ($question['answer_index'] ?? -1)] ?? null;
            }
        } else {
            $questionText = $fallbackTitle;

            $options = collect($quizData['options'] ?? [])
                ->filter(fn ($option) => is_string($option))
                ->values()
                ->all();

            $selectedAnswer = $options[$selectedAnswerIndex] ?? null;
            $correctAnswer = $options[(int) ($quizData['answer_index'] ?? -1)] ?? null;
        }

        return [
            'question_text' => $questionText ?: $fallbackTitle,
            'selected_answer' => $selectedAnswer,
            'correct_answer' => $correctAnswer,
        ];
    }

    private function resolveMetricValue(string $metric, ?UserProgress $progress): int
    {
        if (! $progress) {
            return 0;
        }

        $accuracyPct = $progress->total_questions_answered > 0
            ? (int) round(($progress->correct_answers_count / $progress->total_questions_answered) * 100)
            : 0;

        return match ($metric) {
            'total_questions_answered' => (int) $progress->total_questions_answered,
            'total_questions_posted'   => (int) $progress->total_questions_posted,
            'total_post_posted'        => (int) $progress->total_post_posted,
            'correct_answers_count'    => (int) $progress->correct_answers_count,
            'accuracy_pct'             => $accuracyPct,
            'improvement_score'        => max(0, (int) $progress->improvement_score),
            'total_likes_received'     => (int) $progress->total_likes_received,
            default                    => 0,
        };
    }
}

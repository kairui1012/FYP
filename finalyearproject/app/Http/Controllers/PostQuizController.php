<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesStudyMaterials;
use App\Models\Post;
use App\Models\QuizCompletion;
use App\Services\AchievementService;
use App\Services\ProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostQuizController extends Controller
{
    use HandlesStudyMaterials;

    public function __construct(
        private readonly AchievementService $achievementService,
        private readonly ProgressService $progressService,
    ) {}

    public function completeLesson(Request $request, Post $post): JsonResponse
    {
        if (! $request->expectsJson()) {
            abort(404);
        }

        if ($post->post_type !== 'material' || ! $post->lesson_id) {
            return response()->json([
                'status' => 'invalid',
                'message' => 'This post does not have a completable lesson.',
            ], 422);
        }

        return response()->json([
            'status' => 'removed',
            'lesson_id' => $post->lesson_id,
            'message' => 'Lesson progress tracking has been removed.',
        ]);
    }

    public function completeQuiz(Request $request, Post $post): JsonResponse
    {
        if (! $request->expectsJson()) {
            abort(404);
        }

        if ($post->post_type !== 'quiz') {
            return response()->json([
                'status' => 'invalid',
                'message' => 'This post is not a quiz.',
            ], 422);
        }

        $quizData = $post->quiz_data;

        if (isset($quizData['questions']) && is_array($quizData['questions'])) {
            return $this->completeMultiQuestionQuiz($request, $post, $quizData);
        }

        return $this->completeSingleQuestionQuiz($request, $post, $quizData);
    }

    private function completeMultiQuestionQuiz(Request $request, Post $post, array $quizData): JsonResponse
    {
        $validated = $request->validate([
            'question_index' => ['required', 'integer', 'min:0'],
            'answer_index' => ['required', 'integer', 'min:0'],
        ]);

        $questionIndex = (int) $validated['question_index'];
        $question = $quizData['questions'][$questionIndex] ?? null;

        if (! $question) {
            return response()->json(['status' => 'invalid', 'message' => 'Invalid question index.'], 422);
        }

        $correctIndex = (int) ($question['answer_index'] ?? -1);
        $selectedIndex = (int) $validated['answer_index'];

        if (! isset(($question['options'] ?? [])[$selectedIndex])) {
            return response()->json(['status' => 'invalid', 'message' => 'Invalid answer index.'], 422);
        }

        $isCorrect = $selectedIndex === $correctIndex;
        $isFirstCompletion = false;
        $totalQuestions = count($quizData['questions']);
        $isLastQuestion = $questionIndex === $totalQuestions - 1;

        if ($isLastQuestion && $isCorrect) {
            $completion = QuizCompletion::query()->firstOrCreate(
                ['user_id' => $request->user()->id, 'post_id' => $post->id],
                ['subject_id' => $post->subject_id, 'completed_at' => now()],
            );
            $isFirstCompletion = $completion->wasRecentlyCreated;
        }

        return $this->recordQuizResult($request, $post, $questionIndex, $selectedIndex, $isCorrect, $isFirstCompletion);
    }

    private function completeSingleQuestionQuiz(Request $request, Post $post, array $quizData): JsonResponse
    {
        $answerIndex = isset($quizData['answer_index']) ? (int) $quizData['answer_index'] : null;
        $optionCount = count($quizData['options'] ?? []);
        $validated = $request->validate([
            'answer_index' => ['required', 'integer', 'min:0', 'max:'.max(0, $optionCount - 1)],
        ]);
        $selectedIndex = (int) $validated['answer_index'];

        if ($answerIndex === null) {
            return response()->json([
                'status' => 'invalid',
                'message' => 'Quiz answer data is missing.',
            ], 422);
        }

        $isCorrect = $selectedIndex === $answerIndex;
        $isFirstCompletion = false;

        if ($isCorrect) {
            $completion = QuizCompletion::query()->firstOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'post_id' => $post->id,
                ],
                [
                    'subject_id' => $post->subject_id,
                    'completed_at' => now(),
                ],
            );
            $isFirstCompletion = $completion->wasRecentlyCreated;
        }

        return $this->recordQuizResult($request, $post, 0, $selectedIndex, $isCorrect, $isFirstCompletion);
    }

    private function recordQuizResult(
        Request $request,
        Post $post,
        int $questionIndex,
        int $selectedIndex,
        bool $isCorrect,
        bool $isFirstCompletion,
    ): JsonResponse {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $this->recordMaterialQuizAttempt($user, $post, $isCorrect);
        $this->progressService->syncMistakeReview($user, $post, $questionIndex, $selectedIndex, $isCorrect);
        $newlyEarned = $this->progressService->recordQuizAttempt($user, $isCorrect, $isFirstCompletion);
        $this->achievementService->syncUser($user);

        if (! $isCorrect) {
            return response()->json([
                'status' => 'incorrect',
                'newly_earned' => $newlyEarned,
            ]);
        }

        return response()->json([
            'status' => $isFirstCompletion ? 'completed' : 'already_completed',
            'newly_earned' => $newlyEarned,
        ]);
    }
}

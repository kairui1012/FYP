<?php

namespace App\Http\Controllers;

use App\Models\BookmarkItem;
use App\Models\QuizAttempt;
use App\Models\QuizCompletion;
use App\Services\PostSerializationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class PostBookmarkController extends Controller
{
    public function __construct(private readonly PostSerializationService $serializationService) {}

    /**
     * Display user's bookmarked posts, or quiz review page (correct/wrong answers).
     * Tracks completed quizzes and quiz attempt history for study mode.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $followingIds = $user
            ?->following()
            ->pluck('users.id')
            ->all() ?? [];

        $completedPostIds = $this->getCompletedQuizPostIds($user->id);
        $completedCount = count($completedPostIds);
        $correctCount = $this->getQuizReviewCount($user->id, true);
        $wrongCount = $this->getQuizReviewCount($user->id, false);

        $studyMode = $request->string('study')->toString(); // 'correct' | 'wrong' | ''
        if ($studyMode === 'completed') {
            $studyMode = 'correct';
        }

        if (in_array($studyMode, ['correct', 'wrong'], true)) {
            $quizReviewItems = $this->getQuizReviewItems($user->id, $studyMode === 'correct');

            return Inertia::render('StudyFolderPage', [
                'posts' => [],
                'studyMode' => $studyMode,
                'totalSaves' => $user->bookmarkItems()->count(),
                'completedCount' => $completedCount,
                'correctCount' => $correctCount,
                'wrongCount' => $wrongCount,
                'quizReviewItems' => $quizReviewItems,
            ]);
        }

        $posts = $user->bookmarkItems()
            ->with([
                'post.user:id,name',
                'post.user.socialAccounts:id,user_id,avatar',
                'post.subject:id,name',
                'post.language:id,code,name',
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (BookmarkItem $bookmarkItem) use ($followingIds, $completedPostIds, $user) {
                $post = $bookmarkItem->post;

                if (! $post) {
                    return null;
                }

                $post->setAttribute('saved_at', $bookmarkItem->created_at);
                $post->loadCount(['likes', 'comments', 'bookmarkItems as saves_count']);
                $post->setAttribute('is_liked', $post->likes()->where('user_id', $user->id)->exists());
                $post->setAttribute('is_saved', true);

                $serialized = $this->serializationService->serialize($post, $followingIds);
                $serialized['is_quiz_completed'] = in_array($post->id, $completedPostIds);

                return $serialized;
            })
            ->filter()
            ->values();

        return Inertia::render('StudyFolderPage', [
            'posts' => $posts,
            'studyMode' => '',
            'totalSaves' => $posts->count(),
            'completedCount' => $completedCount,
            'correctCount' => $correctCount,
            'wrongCount' => $wrongCount,
            'quizReviewItems' => [],
        ]);
    }

    /**
     * Get IDs of quizzes user has completed.
     *
     * @return int[]
     */
    private function getCompletedQuizPostIds(int $userId): array
    {
        if (! Schema::hasTable('quiz_completions')) {
            return [];
        }

        return QuizCompletion::query()
            ->where('user_id', $userId)
            ->pluck('post_id')
            ->unique()
            ->values()
            ->all();
    }

    /**
     * Count quiz attempts that are correct or wrong for study review.
     */
    private function getQuizReviewCount(int $userId, bool $isCorrect): int
    {
        if (! Schema::hasTable('quiz_mistakes')) {
            return 0;
        }

        return QuizAttempt::query()
            ->where('user_id', $userId)
            ->where('is_correct', $isCorrect)
            ->count();
    }

    /**
     * Get quiz review items (correct or wrong) with question/answer details.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getQuizReviewItems(int $userId, bool $isCorrect): array
    {
        if (! Schema::hasTable('quiz_mistakes')) {
            return [];
        }

        return QuizAttempt::query()
            ->where('user_id', $userId)
            ->where('is_correct', $isCorrect)
            ->with(['post:id,title,subject_id,quiz_data', 'post.subject:id,name'])
            ->orderByDesc('attempted_at')
            ->get()
            ->map(fn (QuizAttempt $mistake) => $this->serializeQuizReviewItem($mistake))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Serialize a quiz attempt for review display (question, selected/correct answer).
     *
     * @return array<string, mixed>|null
     */
    private function serializeQuizReviewItem(QuizAttempt $mistake): ?array
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
            'is_correct' => (bool) $mistake->is_correct,
        ];
    }

    /**
     * Extract question text and answer options from quiz data by index.
     *
     * @return array{question_text: string|null, selected_answer: string|null, correct_answer: string|null}
     */
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
            'question_text' => $questionText,
            'selected_answer' => $selectedAnswer,
            'correct_answer' => $correctAnswer,
        ];
    }
}

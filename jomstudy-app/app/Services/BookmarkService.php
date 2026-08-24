<?php

namespace App\Services;

use App\Models\BookmarkItem;
use App\Models\Post;
use App\Models\QuizAttempt;
use App\Models\QuizCompletion;
use App\Models\User;
use App\Models\UserProgress;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Schema;

class BookmarkService
{
    public function __construct(
        private readonly PointsService $pointsService,
        private readonly AchievementService $achievementService,
        private readonly PostSerializationService $serializationService,
    ) {}

    /** @return array<string, mixed> */
    public function pageData(User $user, string $studyMode, int $perPage = 12): array
    {
        $followingIds = $user->following()->pluck('users.id')->all();
        $completedPostIds = $this->completedQuizPostIds($user->id);
        $correctCount = $this->quizReviewCount($user->id, true);
        $wrongCount = $this->quizReviewCount($user->id, false);

        if (in_array($studyMode, ['correct', 'wrong'], true)) {
            $reviewPage = $this->quizReviewPage($user->id, $studyMode === 'correct', $perPage);

            return [
                'posts' => [],
                'studyMode' => $studyMode,
                'totalSaves' => $user->bookmarkItems()->count(),
                'completedCount' => count($completedPostIds),
                'correctCount' => $correctCount,
                'wrongCount' => $wrongCount,
                'quizReviewItems' => $reviewPage['items'],
                'pagination' => $reviewPage['pagination'],
            ];
        }

        $bookmarkItems = $user->bookmarkItems()
            ->with([
                'post' => function (Builder $query) use ($user): void {
                    $query->with([
                        'user:id,name',
                        'user.socialAccounts:id,user_id,avatar',
                        'subject:id,name',
                        'lesson:id,title,sequence',
                        'language:id,code,name',
                    ])->withCount(['likes', 'comments', 'bookmarkItems as saves_count'])
                        ->withExists([
                            'likes as is_liked' => fn (Builder $likeQuery) => $likeQuery->where('user_id', $user->id),
                        ]);
                },
            ])
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        $posts = $bookmarkItems->getCollection()
            ->map(function (BookmarkItem $bookmarkItem) use ($followingIds, $completedPostIds) {
                $post = $bookmarkItem->post;

                if (! $post) {
                    return null;
                }

                $post->setAttribute('saved_at', $bookmarkItem->created_at);
                $post->setAttribute('is_saved', true);
                $serialized = $this->serializationService->serialize($post, $followingIds);
                $serialized['is_quiz_completed'] = in_array($post->id, $completedPostIds, true);

                return $serialized;
            })
            ->filter()
            ->values();

        return [
            'posts' => $posts,
            'studyMode' => '',
            'totalSaves' => $bookmarkItems->total(),
            'completedCount' => count($completedPostIds),
            'correctCount' => $correctCount,
            'wrongCount' => $wrongCount,
            'quizReviewItems' => [],
            'pagination' => $this->paginationMeta($bookmarkItems),
        ];
    }

    /** @return array{saved: bool, saves_count: int} */
    public function toggle(User $user, Post $post): array
    {
        $bookmark = BookmarkItem::query()
            ->where('user_id', $user->id)
            ->where('post_id', $post->id)
            ->first();

        if ($bookmark) {
            if ($post->user) {
                $this->pointsService->revoke($post->user, 'resource_bookmarked', $bookmark);
            }

            $bookmark->delete();
            $isSaved = false;
        } else {
            $bookmark = BookmarkItem::query()->create(['user_id' => $user->id, 'post_id' => $post->id]);
            $isSaved = true;

            if ($post->user) {
                $this->pointsService->award($post->user, 'resource_bookmarked', $bookmark, $user);
            }
        }

        UserProgress::query()->firstOrCreate(['user_id' => $user->id]);
        $this->achievementService->evaluateAchievements($user->fresh());

        return ['saved' => $isSaved, 'saves_count' => $post->bookmarkItems()->count()];
    }

    /** @return int[] */
    private function completedQuizPostIds(int $userId): array
    {
        if (! Schema::hasTable('quiz_completions')) {
            return [];
        }

        return QuizCompletion::query()
            ->where('user_id', $userId)
            ->pluck('post_id')
            ->map(fn ($postId) => (int) $postId)
            ->unique()
            ->values()
            ->all();
    }

    private function quizReviewCount(int $userId, bool $isCorrect): int
    {
        if (! Schema::hasTable('quiz_mistakes')) {
            return 0;
        }

        return QuizAttempt::query()
            ->where('user_id', $userId)
            ->where('is_correct', $isCorrect)
            ->count();
    }

    /** @return array{items: array<int, array<string, mixed>>, pagination: array<string, mixed>} */
    private function quizReviewPage(int $userId, bool $isCorrect, int $perPage): array
    {
        if (! Schema::hasTable('quiz_mistakes')) {
            return [
                'items' => [],
                'pagination' => $this->paginationMeta(new LengthAwarePaginator([], 0, $perPage)),
            ];
        }

        $paginator = QuizAttempt::query()
            ->where('user_id', $userId)
            ->where('is_correct', $isCorrect)
            ->with(['post:id,title,subject_id,quiz_data', 'post.subject:id,name'])
            ->orderByDesc('attempted_at')
            ->paginate($perPage)
            ->withQueryString();
        $items = $paginator->getCollection()
            ->map(fn (QuizAttempt $attempt) => $this->serializeQuizReviewItem($attempt))
            ->filter()
            ->values()
            ->all();

        return ['items' => $items, 'pagination' => $this->paginationMeta($paginator)];
    }

    /** @return array<string, mixed>|null */
    private function serializeQuizReviewItem(QuizAttempt $attempt): ?array
    {
        $post = $attempt->post;

        if (! $post) {
            return null;
        }

        $details = $this->extractQuizQuestionDetails(
            is_array($post->quiz_data) ? $post->quiz_data : [],
            (int) $attempt->question_index,
            (int) $attempt->selected_answer_index,
            $post->title,
        );

        return [
            'id' => $attempt->id,
            'post_id' => $post->id,
            'post_title' => $post->title,
            'question_index' => (int) $attempt->question_index,
            'question_text' => $details['question_text'],
            'subject_name' => $post->subject?->name,
            'selected_answer' => $details['selected_answer'],
            'correct_answer' => $details['correct_answer'],
            'attempted_at' => (string) $attempt->attempted_at,
            'is_correct' => (bool) $attempt->is_correct,
        ];
    }

    /** @return array{question_text: string|null, selected_answer: string|null, correct_answer: string|null} */
    private function extractQuizQuestionDetails(array $quizData, int $questionIndex, int $selectedAnswerIndex, string $fallbackTitle): array
    {
        $questionText = null;
        $selectedAnswer = null;
        $correctAnswer = null;

        if (isset($quizData['questions']) && is_array($quizData['questions'])) {
            $question = $quizData['questions'][$questionIndex] ?? null;

            if (is_array($question)) {
                $questionText = is_string($question['question'] ?? null) && trim((string) $question['question']) !== ''
                    ? trim((string) $question['question'])
                    : $fallbackTitle;
                $options = collect($question['options'] ?? [])->filter(fn ($option) => is_string($option))->values()->all();
                $selectedAnswer = $options[$selectedAnswerIndex] ?? null;
                $correctAnswer = $options[(int) ($question['answer_index'] ?? -1)] ?? null;
            }
        } else {
            $questionText = $fallbackTitle;
            $options = collect($quizData['options'] ?? [])->filter(fn ($option) => is_string($option))->values()->all();
            $selectedAnswer = $options[$selectedAnswerIndex] ?? null;
            $correctAnswer = $options[(int) ($quizData['answer_index'] ?? -1)] ?? null;
        }

        return [
            'question_text' => $questionText,
            'selected_answer' => $selectedAnswer,
            'correct_answer' => $correctAnswer,
        ];
    }

    /** @return array<string, int|string|null> */
    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'prev_page_url' => $paginator->previousPageUrl(),
            'next_page_url' => $paginator->nextPageUrl(),
        ];
    }
}

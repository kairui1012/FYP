<?php

namespace App\Http\Controllers;

use App\Models\BookmarkFolder;
use App\Models\Post;
use App\Models\QuizCompletion;
use App\Models\QuizMistake;
use App\Services\PostSerializationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class PostBookmarkController extends Controller
{
    public function __construct(private readonly PostSerializationService $serializationService)
    {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $defaultFolder = BookmarkFolder::defaultFor($user);

        $followingIds = $user
            ?->following()
            ->pluck('users.id')
            ->all() ?? [];

        $folders = $user
            ->bookmarkFolders()
            ->withCount('items')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get()
            ->map(fn (BookmarkFolder $folder) => [
                'id' => $folder->id,
                'name' => $folder->name,
                'is_default' => (bool) $folder->is_default,
                'items_count' => (int) $folder->items_count,
            ])
            ->values();

        $completedPostIds = $this->getCompletedQuizPostIds($user->id);
        $completedCount = count($completedPostIds);
        $correctCount = $this->getQuizReviewCount($user->id, true);
        $wrongCount = $this->getQuizReviewCount($user->id, false);

        $studyMode = $request->string('study')->toString(); // 'completed' | 'correct' | 'wrong' | ''

        if (in_array($studyMode, ['completed', 'correct', 'wrong'], true)) {
            if ($studyMode === 'completed') {
                $posts = Post::query()
                    ->whereIn('id', array_values($completedPostIds))
                    ->with([
                        'user:id,name',
                        'user.socialAccounts:id,user_id,avatar',
                        'subject:id,name',
                        'language:id,code,name',
                    ])
                    ->withCount(['likes', 'comments', 'bookmarkItems as saves_count'])
                    ->withExists([
                        'likes as is_liked' => fn ($query) => $query->where('user_id', $user->id),
                        'bookmarkItems as is_saved' => fn ($query) => $query->where('user_id', $user->id),
                    ])
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(function (Post $post) use ($followingIds, $completedPostIds) {
                        $serialized = $this->serializationService->serialize($post, $followingIds);
                        $serialized['is_quiz_completed'] = in_array($post->id, $completedPostIds, true);

                        return $serialized;
                    });

                return Inertia::render('BookmarksPage', [
                    'posts' => $posts,
                    'folders' => $folders,
                    'activeFolderId' => null,
                    'studyMode' => $studyMode,
                    'completedCount' => $completedCount,
                    'correctCount' => $correctCount,
                    'wrongCount' => $wrongCount,
                    'quizReviewItems' => [],
                ]);
            }

            $quizReviewItems = $this->getQuizReviewItems($user->id, $studyMode === 'correct');

            return Inertia::render('BookmarksPage', [
                'posts' => [],
                'folders' => $folders,
                'activeFolderId' => null,
                'studyMode' => $studyMode,
                'completedCount' => $completedCount,
                'correctCount' => $correctCount,
                'wrongCount' => $wrongCount,
                'quizReviewItems' => $quizReviewItems,
            ]);
        }

        $selectedFolderId = $request->integer('folder_id');
        $selectedFolder = $selectedFolderId
            ? $user->bookmarkFolders()->whereKey($selectedFolderId)->first()
            : null;

        if (! $selectedFolder) {
            $selectedFolder = $defaultFolder;
        }

        $posts = $selectedFolder->posts()
            ->with([
                'user:id,name',
                'user.socialAccounts:id,user_id,avatar',
                'subject:id,name',
                'language:id,code,name',
            ])
            ->withCount(['likes', 'comments', 'bookmarkItems as saves_count'])
            ->withExists([
                'likes as is_liked' => fn ($query) => $query->where('user_id', $user?->id),
                'bookmarkItems as is_saved' => fn ($query) => $query->where('user_id', $user?->id),
            ])
            ->orderByPivot('created_at', 'desc')
            ->get()
            ->map(function (Post $post) use ($followingIds, $selectedFolder, $completedPostIds) {
                $post->setAttribute('saved_at', $post->pivot?->created_at);
                $post->setAttribute('bookmark_folder_id', $selectedFolder->id);

                $serialized = $this->serializationService->serialize($post, $followingIds);
                $serialized['is_quiz_completed'] = in_array($post->id, $completedPostIds);

                return $serialized;
            });

        return Inertia::render('BookmarksPage', [
            'posts' => $posts,
            'folders' => $folders,
            'activeFolderId' => $selectedFolder->id,
            'studyMode' => '',
            'completedCount' => $completedCount,
            'correctCount' => $correctCount,
            'wrongCount' => $wrongCount,
            'quizReviewItems' => [],
        ]);
    }

    /**
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

    private function getQuizReviewCount(int $userId, bool $isCorrect): int
    {
        if (! Schema::hasTable('quiz_mistakes')) {
            return 0;
        }

        return QuizMistake::query()
            ->where('user_id', $userId)
            ->where('is_correct', $isCorrect)
            ->count();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getQuizReviewItems(int $userId, bool $isCorrect): array
    {
        if (! Schema::hasTable('quiz_mistakes')) {
            return [];
        }

        return QuizMistake::query()
            ->where('user_id', $userId)
            ->where('is_correct', $isCorrect)
            ->with(['post:id,title,subject_id,quiz_data', 'post.subject:id,name'])
            ->orderByDesc('attempted_at')
            ->get()
            ->map(fn (QuizMistake $mistake) => $this->serializeQuizReviewItem($mistake))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function serializeQuizReviewItem(QuizMistake $mistake): ?array
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

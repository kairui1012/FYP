<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Language;
use App\Models\Post;
use App\Models\QuizCompletion;
use App\Models\QuizMistake;
use App\Models\Subject;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\PostQueryBuilder;
use App\Services\PostSerializationService;
use App\Services\LearningProgressService;
use App\Services\ProgressService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    private const POST_TYPES = ['material', 'question', 'quiz'];

    public function __construct(
        private readonly AchievementService $achievementService,
        private readonly PostQueryBuilder $queryBuilder,
        private readonly PostSerializationService $serializationService,
        private readonly LearningProgressService $learningProgressService,
        private readonly ProgressService $progressService,
    ) {
    }

    public function index(Request $request): Response
    {
        return $this->renderHomePage($request);
    }

    public function questions(Request $request): Response
    {
        return $this->renderHomePage($request, ['question', 'quiz'], 'questions');
    }

    public function learningMaterials(Request $request): Response
    {
        return $this->renderHomePage($request, 'material', 'materials');
    }

    public function learningOverview(Request $request): JsonResponse
    {
        return response()->json([
            'learningOverview' => $this->learningProgressService->buildLearningOverview($request->user()),
        ]);
    }

    public function categories(Request $request): Response
    {
        $validated = $request->validate([
            'post_type'     => ['nullable', 'string', Rule::in(self::POST_TYPES)],
            'language_code' => ['nullable', 'string', Rule::exists('languages', 'code')],
            'subject_id'    => ['nullable', 'integer', Rule::exists('subjects', 'id')],
        ]);

        return Inertia::render('CategoriesPage', [
            'languages' => Language::query()
                ->withCount('posts')
                ->orderByDesc('posts_count')
                ->orderBy('name')
                ->get(['id', 'code', 'name'])
                ->map(fn (Language $language) => [
                    'id' => $language->id,
                    'code' => $language->code,
                    'name' => $language->name,
                    'posts_count' => (int) $language->posts_count,
                ])
                ->values(),
            'subjects' => Subject::query()
                ->withCount('posts')
                ->orderByDesc('posts_count')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Subject $subject) => [
                    'id' => $subject->id,
                    'name' => $subject->name,
                    'posts_count' => (int) $subject->posts_count,
                ])
                ->values(),
            'filteredPosts' => Inertia::lazy(function () use ($request, $validated) {
                $followingIds = $request->user()
                    ?->following()
                    ->pluck('users.id')
                    ->all() ?? [];

                $postType     = $validated['post_type'] ?? '';
                $languageCode = $validated['language_code'] ?? '';
                $subjectId    = isset($validated['subject_id']) ? (int) $validated['subject_id'] : null;

                $query = new PostQueryBuilder();

                return $query
                    ->withStandardRelations()
                    ->withStandardCounts()
                    ->withUserFlags(Auth::id())
                    ->filterByPostType($postType !== '' ? [$postType] : [])
                    ->filterByLanguage($languageCode)
                    ->filterBySubject($subjectId)
                    ->latest()
                    ->get()
                    ->map(fn (Post $post) => $this->serializationService->serialize($post, $followingIds))
                    ->values();
            }),
        ]);
    }

    private function renderHomePage(Request $request, string|array|null $forcedPostType = null, string $pageContext = 'home'): Response
    {
        $followingIds = $request->user()
            ?->following()
            ->pluck('users.id')
            ->all() ?? [];

        $validated = $request->validate([
            'post_type' => ['nullable', 'string', Rule::in(self::POST_TYPES)],
            'language_code' => ['nullable', 'string', Rule::exists('languages', 'code')],
            'subject_id' => ['nullable', 'integer', Rule::exists('subjects', 'id')],
        ]);

        $postType = $validated['post_type'] ?? '';
        $postTypesFilter = [];

        if (is_array($forcedPostType)) {
            $postTypesFilter = $forcedPostType;
        } elseif (is_string($forcedPostType) && $forcedPostType !== '') {
            $postTypesFilter = [$forcedPostType];
        } elseif ($postType !== '') {
            $postTypesFilter = [$postType];
        }

        $languageCode = $validated['language_code'] ?? '';
        $subjectId = isset($validated['subject_id']) ? (int) $validated['subject_id'] : null;

        $query = new PostQueryBuilder();
        $posts = $query
            ->withStandardRelations()
            ->withStandardCounts()
            ->withUserFlags(Auth::id())
            ->filterByPostType($postTypesFilter)
            ->filterByLanguage($languageCode)
            ->filterBySubject($subjectId)
            ->latest()
            ->get()
            ->map(fn (Post $post) => $this->serializationService->serialize($post, $followingIds));

        return Inertia::render('homePage', [
            'posts' => $posts,
            'learningOverview' => $this->learningProgressService->buildLearningOverview($request->user()),
            'postTypeFilter' => count($postTypesFilter) === 1 ? $postTypesFilter[0] : null,
            'pageContext' => $pageContext,
            'languageFilter' => $languageCode !== '' ? $languageCode : null,
            'subjectFilter' => $subjectId,
        ]);
    }

    public function show(Post $post): Response
    {
        $userId = Auth::id();
        $followingIds = request()->user()
            ?->following()
            ->pluck('users.id')
            ->all() ?? [];

        $supportsCommentVotes = $this->supportsCommentVotes();

        try {
            $this->loadPostWithComments($post, $userId, $supportsCommentVotes);
        } catch (QueryException $exception) {
            if (! $supportsCommentVotes || ! $this->isVoteColumnMissingException($exception)) {
                throw $exception;
            }

            $supportsCommentVotes = false;
            $this->loadPostWithComments($post, $userId, false);
        }

        $post->setAttribute(
            'is_liked',
            $post->likes()->where('user_id', Auth::id())->exists()
        );

        $post->setAttribute(
            'is_saved',
            $post->bookmarkItems()->where('user_id', Auth::id())->exists()
        );

        $post->setAttribute('is_lesson_completed', false);
        $post->setAttribute(
            'quiz_attempts',
            $userId ? $this->getQuizAttemptsForPost($userId, $post->id) : []
        );

        return Inertia::render('PostContent', [
            'post' => $this->serializationService->serialize($post, $followingIds),
        ]);
    }

    public function update(Request $request, Post $post): \Illuminate\Http\RedirectResponse
    {
        if ($post->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'title'   => ['required', 'string', 'max:150'],
            'content' => ['required', 'string', 'max:2000'],
        ]);

        $post->update($validated);

        return redirect()->route('posts.show', $post);
    }

    public function destroy(Request $request, Post $post): \Illuminate\Http\RedirectResponse
    {
        if ($post->user_id !== Auth::id()) {
            abort(403);
        }

        $post->delete();

        return redirect()->route('homePage');
    }

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

        // Multi-question format: { questions: [{ question, options, answer_index }] }
        if (isset($quizData['questions']) && is_array($quizData['questions'])) {
            $validated = $request->validate([
                'question_index' => ['required', 'integer', 'min:0'],
                'answer_index'   => ['required', 'integer', 'min:0'],
            ]);

            $qIndex   = (int) $validated['question_index'];
            $question = $quizData['questions'][$qIndex] ?? null;

            if (! $question) {
                return response()->json(['status' => 'invalid', 'message' => 'Invalid question index.'], 422);
            }

            $correctIndex  = (int) ($question['answer_index'] ?? -1);
            $selectedIndex = (int) $validated['answer_index'];

            if (! isset(($question['options'] ?? [])[$selectedIndex])) {
                return response()->json(['status' => 'invalid', 'message' => 'Invalid answer index.'], 422);
            }

            $isCorrect        = $selectedIndex === $correctIndex;
            $isFirstCompletion = false;

            if ($isCorrect && $qIndex === 0) {
                $completion = QuizCompletion::query()->firstOrCreate(
                    ['user_id' => $request->user()->id, 'post_id' => $post->id],
                    ['subject_id' => $post->subject_id, 'completed_at' => now()],
                );
                $isFirstCompletion = $completion->wasRecentlyCreated;
            }

            /** @var \App\Models\User $user */
            $user = $request->user();
            $this->progressService->syncMistakeReview($user, $post, $qIndex, $selectedIndex, $isCorrect);
            $newlyEarned = $this->progressService->recordQuizAttempt($user, $isCorrect, $isFirstCompletion);
            $this->achievementService->syncUser($user);

            if (! $isCorrect) {
                return response()->json(['status' => 'incorrect', 'newly_earned' => $newlyEarned]);
            }

            return response()->json([
                'status'       => $isFirstCompletion ? 'completed' : 'already_completed',
                'newly_earned' => $newlyEarned,
            ]);
        }

        // Legacy single-question format: { options: [...], answer_index: N }
        $answerIndex = isset($quizData['answer_index']) ? (int) $quizData['answer_index'] : null;
        $optionCount = count($quizData['options'] ?? []);
        $validated = $request->validate([
            'answer_index' => ['required', 'integer', 'min:0', 'max:' . max(0, $optionCount - 1)],
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
                    'subject_id'   => $post->subject_id,
                    'completed_at' => now(),
                ]
            );
            $isFirstCompletion = $completion->wasRecentlyCreated;
        }

        /** @var \App\Models\User $user */
        $user = $request->user();
        $this->progressService->syncMistakeReview($user, $post, 0, $selectedIndex, $isCorrect);
        $newlyEarned = $this->progressService->recordQuizAttempt($user, $isCorrect, $isFirstCompletion);
        $this->achievementService->syncUser($user);

        if (! $isCorrect) {
            return response()->json([
                'status'           => 'incorrect',
                'newly_earned'     => $newlyEarned,
            ]);
        }

        return response()->json([
            'status'       => $isFirstCompletion ? 'completed' : 'already_completed',
            'newly_earned' => $newlyEarned,
        ]);
    }

    private function loadPostWithComments(Post $post, ?int $userId, bool $supportsCommentVotes): void
    {
        $post->load([
            'user:id,name',
            'user.socialAccounts:id,user_id,avatar',
            'subject:id,name',
            'lesson:id,title,sequence',
            'language:id,code,name',
            'comments' => function ($query) use ($userId, $supportsCommentVotes) {
                $query->with([
                    'user:id,name',
                    'user.socialAccounts:id,user_id,avatar',
                    'parent:id,user_id',
                    'parent.user:id,name',
                    'parent.user.socialAccounts:id,user_id,avatar',
                ]);

                if ($supportsCommentVotes) {
                    $query->with([
                        'votes:id,user_id,comment_id,vote',
                    ])
                        ->withCount([
                            'votes as upvotes_count' => fn ($voteQuery) => $voteQuery->where('vote', 1),
                            'votes as downvotes_count' => fn ($voteQuery) => $voteQuery->where('vote', -1),
                        ])
                        ->withExists([
                            'votes as is_upvoted' => fn ($voteQuery) => $voteQuery->where('user_id', $userId)->where('vote', 1),
                            'votes as is_downvoted' => fn ($voteQuery) => $voteQuery->where('user_id', $userId)->where('vote', -1),
                        ]);
                } else {
                    $query->withCount('likes')
                        ->withExists([
                            'likes as is_liked' => fn ($likeQuery) => $likeQuery->where('user_id', $userId),
                        ]);
                }
            },
        ])
            ->loadCount(['likes', 'comments', 'bookmarkItems as saves_count']);
    }

    private function supportsCommentVotes(): bool
    {
        try {
            return Schema::hasColumn('comment_likes', 'vote');
        } catch (\Throwable) {
            return false;
        }
    }

    private function isVoteColumnMissingException(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, "unknown column 'vote'")
            || str_contains($message, 'unknown column `vote`');
    }

    /**
     * @return array<int, array{question_index: int, selected_answer_index: int, is_correct: bool}>
     */
    private function getQuizAttemptsForPost(int $userId, int $postId): array
    {
        if (! Schema::hasTable('quiz_mistakes')) {
            return [];
        }

        return QuizMistake::query()
            ->where('user_id', $userId)
            ->where('post_id', $postId)
            ->orderBy('question_index')
            ->get(['question_index', 'selected_answer_index', 'is_correct'])
            ->map(fn (QuizMistake $attempt) => [
                'question_index' => (int) $attempt->question_index,
                'selected_answer_index' => (int) $attempt->selected_answer_index,
                'is_correct' => (bool) $attempt->is_correct,
            ])
            ->values()
            ->all();
    }

}

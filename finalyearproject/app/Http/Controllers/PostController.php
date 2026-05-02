<?php

namespace App\Http\Controllers;

use App\Models\Language;
use App\Models\MaterialQuizAttempt;
use App\Models\Post;
use App\Models\QuizCompletion;
use App\Models\QuizMistake;
use App\Models\StudyMaterialFeedback;
use App\Models\StudyMaterialVersion;
use App\Models\StudyMaterialView;
use App\Models\Subject;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\LearningProgressService;
use App\Services\MaterialVersionService;
use App\Services\PostQueryBuilder;
use App\Services\PostSerializationService;
use App\Services\ProgressService;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    private const POST_TYPES = ['material', 'question', 'quiz'];

    private const FEED_PER_PAGE = 10;

    public function __construct(
        private readonly AchievementService $achievementService,
        private readonly MaterialVersionService $materialVersionService,
        private readonly PostQueryBuilder $queryBuilder,
        private readonly PostSerializationService $serializationService,
        private readonly LearningProgressService $learningProgressService,
        private readonly ProgressService $progressService,
    ) {}

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
            'post_type' => ['nullable', 'string', Rule::in(self::POST_TYPES)],
            'language_code' => ['nullable', 'string', Rule::exists('languages', 'code')],
            'subject_id' => ['nullable', 'integer', Rule::exists('subjects', 'id')],
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

                $postType = $validated['post_type'] ?? '';
                $languageCode = $validated['language_code'] ?? '';
                $subjectId = isset($validated['subject_id']) ? (int) $validated['subject_id'] : null;

                $query = new PostQueryBuilder;

                $paginator = $query
                    ->withStandardRelations()
                    ->withStandardCounts()
                    ->withUserFlags(Auth::id())
                    ->excludeBlockedUsers()
                    ->filterByPostType($postType !== '' ? [$postType] : [])
                    ->filterByLanguage($languageCode)
                    ->filterBySubject($subjectId)
                    ->latest()
                    ->getQuery()
                    ->paginate(self::FEED_PER_PAGE)
                    ->withQueryString();

                $posts = $paginator->getCollection();
                $this->attachMaterialLearningStates($posts, Auth::id());

                return [
                    'posts' => $posts
                        ->map(fn (Post $post) => $this->serializationService->serialize($post, $followingIds))
                        ->values(),
                    'pagination' => $this->paginationMeta($paginator),
                ];
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

        $query = new PostQueryBuilder;
        $paginator = $query
            ->withStandardRelations()
            ->withStandardCounts()
            ->withUserFlags(Auth::id())
            ->excludeBlockedUsers()
            ->filterByPostType($postTypesFilter)
            ->filterByLanguage($languageCode)
            ->filterBySubject($subjectId)
            ->latest()
            ->getQuery()
            ->paginate(self::FEED_PER_PAGE)
            ->withQueryString();

        $posts = $paginator->getCollection();
        $this->attachMaterialLearningStates($posts, Auth::id());
        $this->attachMaterialFeedbackSummaries($posts, Auth::id());

        $serializedPosts = $posts
            ->map(fn (Post $post) => $this->serializationService->serialize($post, $followingIds));

        return Inertia::render('HomePage', [
            'posts' => $serializedPosts,
            'pagination' => $this->paginationMeta($paginator),
            'learningOverview' => $this->learningProgressService->buildLearningOverview($request->user()),
            'postTypeFilter' => count($postTypesFilter) === 1 ? $postTypesFilter[0] : null,
            'pageContext' => $pageContext,
            'languageFilter' => $languageCode !== '' ? $languageCode : null,
            'subjectFilter' => $subjectId,
        ]);
    }

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
            'is_quiz_completed',
            $post->post_type === 'quiz' && $userId
                ? $this->hasCompletedQuiz($userId, $post->id)
                : false
        );
        $post->setAttribute(
            'quiz_attempts',
            $userId ? $this->getQuizAttemptsForPost($userId, $post->id) : []
        );

        if ($post->post_type === 'material') {
            $this->recordMaterialView($post, $userId);
            $post->setAttribute('material_feedback_summary', $this->buildMaterialFeedbackSummary($post, $userId));
            $post->setAttribute('material_user_feedback', $this->buildMaterialUserFeedback($post, $userId));

            if ((request()->user()?->role ?? 'student') === 'teacher') {
                $post->setAttribute('learning_analytics', $this->buildLearningAnalytics($post));
            }

            $post->setAttribute('linked_quizzes', $this->buildLinkedQuizzes($post, $followingIds, $userId));

            $stateMap = $this->buildMaterialLearningStateMap([$post->id], $userId);
            $post->setAttribute('material_learning_state', $stateMap[$post->id]['state'] ?? 'unread');
            $post->setAttribute('material_learning_path', $stateMap[$post->id]['path'] ?? []);
        }

        return Inertia::render('PostContent', [
            'post' => $this->serializationService->serialize($post, $followingIds),
        ]);
    }

    public function update(Request $request, Post $post): \Illuminate\Http\RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $isAdmin = ($user->role ?? 'student') === 'admin';
        $isOwner = $post->user_id === $user->id;

        if ($post->post_type === 'material') {
            if (! $user->canPublishStudyMaterials() || (! $isOwner && ! $isAdmin)) {
                abort(403);
            }
        } elseif (! $isOwner) {
            abort(403);
        }

        if ($post->post_type === 'material') {
            $validated = $request->validate([
                'title' => ['required', 'string', 'max:150'],
                'content' => ['nullable', 'string', 'max:2000'],
                'material_blocks' => ['required', 'array', 'min:1'],
                'material_blocks.*.type' => ['required_with:material_blocks', 'string', Rule::in(['text', 'image', 'document', 'video'])],
                'material_blocks.*.text' => ['nullable', 'string', 'max:4000'],
                'material_blocks.*.url' => ['nullable', 'string', 'max:500'],
                'material_blocks.*.existing_path' => ['nullable', 'string', 'max:500'],
                'material_blocks.*.existing_name' => ['nullable', 'string', 'max:255'],
                'material_blocks.*.existing_mime' => ['nullable', 'string', 'max:255'],
                'material_blocks.*.file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif,pdf,doc,docx,xls,xlsx,ppt,pptx', 'max:20480'],
            ]);

            $materialBlocks = $this->normalizeMaterialBlocksForUpdate(
                $request,
                $post,
                $validated['material_blocks'] ?? [],
            );

            if (count($materialBlocks) === 0) {
                return back()->withErrors([
                    'material_blocks' => 'Add at least one complete content block.',
                ]);
            }

            $updateData = [
                'title' => $validated['title'],
                'content' => $this->buildMaterialPlainText($validated['title'], $materialBlocks),
                'content_blocks' => $materialBlocks,
            ];

            if (
                Schema::hasColumn('posts', 'material_improved_from_feedback')
                && $this->materialHasFeedback($post)
            ) {
                $updateData['material_improved_from_feedback'] = true;
            }

            $post->update($updateData);
            $post->refresh();
            $this->materialVersionService->createSnapshot($post);
        } else {
            $validated = $request->validate([
                'title' => ['required', 'string', 'max:150'],
                'content' => ['required', 'string', 'max:2000'],
            ]);

            $post->update($validated);
        }

        return redirect()->route('posts.show', $post);
    }

    private function normalizeMaterialBlocksForUpdate(Request $request, Post $post, array $blocks): array
    {
        $normalized = [];
        $existingFileBlocks = collect($post->content_blocks ?? [])
            ->filter(fn ($block) => in_array($block['type'] ?? null, ['image', 'document'], true) && isset($block['path']))
            ->keyBy(fn ($block) => (string) $block['path']);

        foreach ($blocks as $index => $block) {
            $type = $block['type'] ?? null;

            if ($type === 'text') {
                $text = trim((string) ($block['text'] ?? ''));

                if ($text !== '') {
                    $normalized[] = [
                        'type' => 'text',
                        'text' => $text,
                    ];
                }

                continue;
            }

            if ($type === 'video') {
                $url = trim((string) ($block['url'] ?? ''));

                if ($url !== '') {
                    $this->validateMaterialVideoUrl($url, $index);

                    $normalized[] = [
                        'type' => 'video',
                        'url' => $url,
                    ];
                }

                continue;
            }

            if (! in_array($type, ['image', 'document'], true)) {
                continue;
            }

            $file = $request->file("material_blocks.{$index}.file");

            if ($file) {
                $normalized[] = [
                    'type' => $type,
                    'path' => $file->store('posts/materials', 'public'),
                    'name' => $file->getClientOriginalName(),
                    'mime' => $file->getClientMimeType(),
                ];

                continue;
            }

            $existingPath = trim((string) ($block['existing_path'] ?? ''));
            $existingBlock = $existingFileBlocks->get($existingPath);

            if ($existingBlock && ($existingBlock['type'] ?? null) === $type) {
                $normalized[] = [
                    'type' => $type,
                    'path' => (string) $existingBlock['path'],
                    'name' => $existingBlock['name'] ?? null,
                    'mime' => $existingBlock['mime'] ?? null,
                ];
            }
        }

        return $normalized;
    }

    private function buildMaterialPlainText(string $title, array $blocks): string
    {
        $parts = [$title];

        foreach ($blocks as $block) {
            if (($block['type'] ?? null) === 'text') {
                $parts[] = (string) ($block['text'] ?? '');
            } elseif (($block['type'] ?? null) === 'video') {
                $parts[] = (string) ($block['url'] ?? '');
            } elseif (isset($block['name'])) {
                $parts[] = (string) $block['name'];
            }
        }

        return collect($parts)
            ->flatten()
            ->filter()
            ->implode("\n\n");
    }

    private function validateMaterialVideoUrl(string $url, int|string $index): void
    {
        if ($this->isValidHttpUrl($url)) {
            return;
        }

        throw ValidationException::withMessages([
            "material_blocks.{$index}.url" => 'Enter a valid video URL.',
        ]);
    }

    private function isValidHttpUrl(string $url): bool
    {
        if (! filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true);
    }

    public function destroy(Request $request, Post $post): \Illuminate\Http\RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $isOwner = $post->user_id === $user->id;
        $isAdmin = ($user->role ?? 'student') === 'admin';

        if ($post->post_type === 'material') {
            if (! $isOwner && ! $isAdmin) {
                abort(403);
            }
        } elseif (! $isOwner) {
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
                'answer_index' => ['required', 'integer', 'min:0'],
            ]);

            $qIndex = (int) $validated['question_index'];
            $question = $quizData['questions'][$qIndex] ?? null;

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
            $isLastQuestion = $qIndex === $totalQuestions - 1;

            if ($isLastQuestion) {
                $completion = QuizCompletion::query()->firstOrCreate(
                    ['user_id' => $request->user()->id, 'post_id' => $post->id],
                    ['subject_id' => $post->subject_id, 'completed_at' => now()],
                );
                $isFirstCompletion = $completion->wasRecentlyCreated;
            }

            /** @var \App\Models\User $user */
            $user = $request->user();
            $this->recordMaterialQuizAttempt($user, $post, $isCorrect);
            $this->progressService->syncMistakeReview($user, $post, $qIndex, $selectedIndex, $isCorrect);
            $newlyEarned = $this->progressService->recordQuizAttempt($user, $isCorrect, $isFirstCompletion);
            $this->achievementService->syncUser($user);

            if (! $isCorrect) {
                return response()->json(['status' => 'incorrect', 'newly_earned' => $newlyEarned]);
            }

            return response()->json([
                'status' => $isFirstCompletion ? 'completed' : 'already_completed',
                'newly_earned' => $newlyEarned,
            ]);
        }

        // Legacy single-question format: { options: [...], answer_index: N }
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

        $completion = QuizCompletion::query()->firstOrCreate(
            [
                'user_id' => $request->user()->id,
                'post_id' => $post->id,
            ],
            [
                'subject_id' => $post->subject_id,
                'completed_at' => now(),
            ]
        );
        $isFirstCompletion = $completion->wasRecentlyCreated;

        /** @var \App\Models\User $user */
        $user = $request->user();
        $this->recordMaterialQuizAttempt($user, $post, $isCorrect);
        $this->progressService->syncMistakeReview($user, $post, 0, $selectedIndex, $isCorrect);
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

    public function materialFeedback(Request $request, Post $post): JsonResponse
    {
        if (! $request->expectsJson()) {
            abort(404);
        }

        if ($post->post_type !== 'material') {
            return response()->json([
                'status' => 'invalid',
                'message' => 'Feedback can only be submitted for Study Materials.',
            ], 422);
        }

        $validated = $request->validate([
            'vote' => ['nullable', 'integer', Rule::in([-1, 1])],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'feedback' => ['nullable', 'string', 'max:2000'],
        ]);

        $feedbackText = trim((string) ($validated['feedback'] ?? ''));

        if (! isset($validated['vote']) && ! isset($validated['rating']) && $feedbackText === '') {
            return response()->json([
                'status' => 'invalid',
                'message' => 'Add a vote, rating, or written feedback before submitting.',
            ], 422);
        }

        StudyMaterialFeedback::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'post_id' => $post->id,
            ],
            [
                'vote' => $validated['vote'] ?? null,
                'rating' => $validated['rating'] ?? null,
                'feedback' => $feedbackText !== '' ? $feedbackText : null,
            ],
        );

        $this->syncLatestVersionRating($post->id);

        return response()->json([
            'status' => 'saved',
            'summary' => $this->buildMaterialFeedbackSummary($post, $request->user()->id),
            'user_feedback' => $this->buildMaterialUserFeedback($post, $request->user()->id),
            'analytics' => $this->buildLearningAnalytics($post),
        ]);
    }

    public function destroyMaterialFeedback(Request $request, Post $post): JsonResponse
    {
        if (! $request->expectsJson()) {
            abort(404);
        }

        if ($post->post_type !== 'material') {
            return response()->json([
                'status' => 'invalid',
                'message' => 'Feedback can only be removed for Study Materials.',
            ], 422);
        }

        if (Schema::hasTable('study_material_feedback')) {
            StudyMaterialFeedback::query()
                ->where('post_id', $post->id)
                ->where('user_id', $request->user()->id)
                ->delete();
        }

        $this->syncLatestVersionRating($post->id);

        return response()->json([
            'status' => 'deleted',
            'summary' => $this->buildMaterialFeedbackSummary($post, $request->user()->id),
            'user_feedback' => $this->buildMaterialUserFeedback($post, $request->user()->id),
            'analytics' => $this->buildLearningAnalytics($post),
        ]);
    }

    public function teacherMaterialInsights(Request $request): Response
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->canPublishStudyMaterials()) {
            abort(403);
        }

        $validated = $request->validate([
            'material_id' => ['nullable', 'integer', Rule::exists('posts', 'id')->where(fn ($query) => $query->where('post_type', 'material'))],
            'subject_id' => ['nullable', 'integer', Rule::exists('subjects', 'id')],
            'quiz_id' => ['nullable', 'integer', Rule::exists('posts', 'id')->where(fn ($query) => $query->where('post_type', 'quiz'))],
            'time_range' => ['nullable', 'string', Rule::in(['7d', '30d', '90d', 'all'])],
            'sort' => ['nullable', 'string', Rule::in(['low_rating', 'high_rating'])],
        ]);

        $materialId = isset($validated['material_id']) ? (int) $validated['material_id'] : null;
        $subjectId = isset($validated['subject_id']) ? (int) $validated['subject_id'] : null;
        $quizId = isset($validated['quiz_id']) ? (int) $validated['quiz_id'] : null;
        $timeRange = $validated['time_range'] ?? '30d';
        $sort = in_array($validated['sort'] ?? '', ['low_rating', 'high_rating']) ? $validated['sort'] : 'low_rating';
        $since = match ($timeRange) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            '90d' => now()->subDays(90),
            default => null,
        };

        $materials = Post::query()
            ->where('post_type', 'material')
            ->with('subject:id,name')
            ->orderBy('title')
            ->get(['id', 'title', 'subject_id'])
            ->map(fn (Post $material) => [
                'id' => $material->id,
                'title' => $material->title,
                'subject_id' => $material->subject_id,
                'subject_name' => $material->subject?->name,
            ])
            ->values()
            ->all();

        $quizzes = [];
        if (Schema::hasColumn('posts', 'parent_material_id')) {
            $quizzes = Post::query()
                ->where('post_type', 'quiz')
                ->with('parentMaterial:id,title,subject_id')
                ->orderBy('title')
                ->get(['id', 'title', 'parent_material_id'])
                ->map(fn (Post $quiz) => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'material_id' => $quiz->parent_material_id,
                    'material_title' => $quiz->parentMaterial?->title,
                    'subject_id' => $quiz->parentMaterial?->subject_id,
                ])
                ->values()
                ->all();
        }

        return Inertia::render('TeacherMaterialInsightsPage', [
            'filters' => [
                'material_id' => $materialId,
                'subject_id' => $subjectId,
                'quiz_id' => $quizId,
                'time_range' => $timeRange,
                'sort' => $sort,
            ],
            'materials' => $materials,
            'subjects' => Subject::query()->orderBy('name')->get(['id', 'name'])->values()->all(),
            'quizzes' => $quizzes,
            'insights' => [
                'low_rated_materials' => $this->buildLowRatedMaterialsInsights($materialId, $subjectId, $quizId, $since, $sort, $user->id),
                'frequently_wrong_questions' => $this->buildFrequentlyWrongQuestionsInsights($materialId, $subjectId, $quizId, $since, $sort),
                'material_versions' => $this->buildMaterialVersionHistoryInsights($materialId, $subjectId, $quizId, $since),
                'repeated_feedback' => $this->buildRepeatedFeedbackInsights($materialId, $subjectId, $quizId, $since, $sort),
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }

    private function loadPostWithComments(Post $post, ?int $userId, bool $supportsCommentVotes): void
    {
        $post->load([
            'user:id,name,role',
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
                            'votes as wrong_votes_count' => fn ($voteQuery) => $voteQuery->where('vote', -2),
                        ])
                        ->withExists([
                            'votes as is_upvoted' => fn ($voteQuery) => $voteQuery->where('user_id', $userId)->where('vote', 1),
                            'votes as is_downvoted' => fn ($voteQuery) => $voteQuery->where('user_id', $userId)->where('vote', -1),
                            'votes as is_wrong' => fn ($voteQuery) => $voteQuery->where('user_id', $userId)->where('vote', -2),
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

    private function hasCompletedQuiz(int $userId, int $postId): bool
    {
        if (! Schema::hasTable('quiz_completions')) {
            return false;
        }

        return QuizCompletion::query()
            ->where('user_id', $userId)
            ->where('post_id', $postId)
            ->exists();
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

    private function materialHasFeedback(Post $post): bool
    {
        return Schema::hasTable('study_material_feedback')
            && StudyMaterialFeedback::query()
                ->where('post_id', $post->id)
                ->where(function ($query) {
                    $query->whereNotNull('rating')
                        ->orWhereNotNull('vote')
                        ->orWhereNotNull('feedback');
                })
                ->exists();
    }

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
        $feedbackCount = (int) (clone $base)->whereNotNull('feedback')->count();

        $latestFeedback = (clone $base)
            ->whereNotNull('feedback')
            ->with([
                'user:id,name,role',
                'user.socialAccounts:id,user_id,avatar',
            ])
            ->latest('updated_at')
            ->get()
            ->map(fn (StudyMaterialFeedback $feedback) => [
                'id' => $feedback->id,
                'feedback' => $feedback->feedback,
                'rating' => $feedback->rating,
                'vote' => $feedback->vote,
                'created_at' => optional($feedback->created_at)->toISOString(),
                'updated_at' => optional($feedback->updated_at)->toISOString(),
                'is_owner' => $userId !== null && $feedback->user_id === $userId,
                'recommend_count' => (int) ($feedback->vote === 1),
                'not_recommend_count' => (int) ($feedback->vote === -1),
                'user' => [
                    'id' => $feedback->user?->id,
                    'name' => $feedback->user?->name ?? 'Student',
                    'role' => $feedback->user?->role ?? 'student',
                    'avatar' => $feedback->user?->socialAccounts
                        ?->first(fn ($account) => ! empty($account->avatar))
                        ?->avatar,
                ],
            ])
            ->values()
            ->all();

        return [
            'average_rating' => $snapshot['average_rating'],
            'rating_count' => $snapshot['rating_count'],
            'upvotes' => $upvotes,
            'downvotes' => $downvotes,
            'recommended_count' => $upvotes,
            'not_recommended_count' => $downvotes,
            'total_votes' => $totalVotes,
            'recommendation_rate' => $snapshot['recommendation_rate'],
            'feedback_count' => $feedbackCount,
            'latest_feedback' => $latestFeedback,
        ];
    }

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
            'feedback' => $feedback->feedback,
            'created_at' => optional($feedback->created_at)->toISOString(),
            'updated_at' => optional($feedback->updated_at)->toISOString(),
        ];
    }

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

    private function buildLinkedQuizzes(Post $post, array $followingIds, ?int $userId = null): array
    {
        if (! Schema::hasColumn('posts', 'parent_material_id')) {
            return [];
        }

        $quizzes = Post::query()
            ->where('parent_material_id', $post->id)
            ->where('post_type', 'quiz')
            ->with(['user:id,name,role', 'user.socialAccounts:id,user_id,avatar', 'subject:id,name', 'language:id,code,name'])
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

    private function syncLatestVersionRating(int $postId): void
    {
        if (! Schema::hasTable('study_material_versions') || ! Schema::hasTable('study_material_feedback')) {
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

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildLowRatedMaterialsInsights(?int $materialId, ?int $subjectId, ?int $quizId, ?CarbonInterface $since, string $sort, int $teacherId): array
    {
        if (! Schema::hasTable('study_material_feedback')) {
            return [];
        }

        $query = StudyMaterialFeedback::query()
            ->join('posts as materials', 'materials.id', '=', 'study_material_feedback.post_id')
            ->leftJoin('subjects', 'subjects.id', '=', 'materials.subject_id')
            ->where('materials.post_type', 'material')
            ->where('materials.user_id', $teacherId)
            ->whereNotNull('study_material_feedback.rating')
            ->when($materialId, fn ($builder) => $builder->where('study_material_feedback.post_id', $materialId))
            ->when($subjectId, fn ($builder) => $builder->where('materials.subject_id', $subjectId))
            ->when($since, fn ($builder) => $builder->where('study_material_feedback.updated_at', '>=', $since))
            ->selectRaw('study_material_feedback.post_id as material_id, materials.title as material_title, subjects.name as subject_name, ROUND(AVG(study_material_feedback.rating), 2) as average_rating, COUNT(study_material_feedback.rating) as rating_count')
            ->groupBy('study_material_feedback.post_id', 'materials.title', 'subjects.name');

        if ($quizId && Schema::hasColumn('posts', 'parent_material_id')) {
            $query->whereExists(function ($exists) use ($quizId) {
                $exists->selectRaw('1')
                    ->from('posts as quizzes')
                    ->whereColumn('quizzes.parent_material_id', 'study_material_feedback.post_id')
                    ->where('quizzes.id', $quizId);
            });
        }

        if ($sort === 'high_rating') {
            $query->orderByDesc('average_rating')->orderByDesc('rating_count');
        } else {
            $query->orderBy('average_rating')->orderByDesc('rating_count');
        }

        return $query
            ->limit(15)
            ->get()
            ->map(fn ($row) => [
                'material_id' => (int) $row->material_id,
                'material_title' => (string) $row->material_title,
                'subject_name' => $row->subject_name,
                'average_rating' => (float) $row->average_rating,
                'rating_count' => (int) $row->rating_count,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildFrequentlyWrongQuestionsInsights(?int $materialId, ?int $subjectId, ?int $quizId, ?CarbonInterface $since, string $sort): array
    {
        if (! Schema::hasTable('quiz_mistakes') || ! Schema::hasColumn('posts', 'parent_material_id')) {
            return [];
        }

        $query = DB::table('quiz_mistakes as qm')
            ->join('posts as quizzes', 'quizzes.id', '=', 'qm.post_id')
            ->leftJoin('posts as materials', 'materials.id', '=', 'quizzes.parent_material_id')
            ->leftJoin('subjects', 'subjects.id', '=', 'materials.subject_id')
            ->where('quizzes.post_type', 'quiz')
            ->when($materialId, fn ($builder) => $builder->where('materials.id', $materialId))
            ->when($subjectId, fn ($builder) => $builder->where('materials.subject_id', $subjectId))
            ->when($quizId, fn ($builder) => $builder->where('quizzes.id', $quizId))
            ->when($since, fn ($builder) => $builder->where('qm.updated_at', '>=', $since))
            ->selectRaw('quizzes.id as quiz_id, quizzes.title as quiz_title, materials.id as material_id, materials.title as material_title, subjects.name as subject_name, qm.question_index, SUM(CASE WHEN qm.is_correct = 0 THEN 1 ELSE 0 END) as wrong_count, COUNT(*) as total_attempts')
            ->groupBy('quizzes.id', 'quizzes.title', 'materials.id', 'materials.title', 'subjects.name', 'qm.question_index')
            ->havingRaw('SUM(CASE WHEN qm.is_correct = 0 THEN 1 ELSE 0 END) > 0');

        if ($sort === 'most_wrong') {
            $query->orderByDesc('wrong_count')->orderByDesc('total_attempts');
        } else {
            $query->orderByDesc('wrong_count')->orderByDesc('total_attempts');
        }

        return $query
            ->limit(20)
            ->get()
            ->map(function ($row) {
                $wrongCount = (int) $row->wrong_count;
                $totalAttempts = (int) $row->total_attempts;

                return [
                    'quiz_id' => (int) $row->quiz_id,
                    'quiz_title' => (string) $row->quiz_title,
                    'material_id' => $row->material_id !== null ? (int) $row->material_id : null,
                    'material_title' => $row->material_title,
                    'subject_name' => $row->subject_name,
                    'question_index' => (int) $row->question_index,
                    'wrong_count' => $wrongCount,
                    'total_attempts' => $totalAttempts,
                    'error_rate' => $totalAttempts > 0 ? round(($wrongCount / $totalAttempts) * 100, 1) : 0.0,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array{keywords: array<int, array<string, mixed>>, repeated_phrases: array<int, array<string, mixed>>, total_feedback_texts: int}
     */
    private function buildRepeatedFeedbackInsights(?int $materialId, ?int $subjectId, ?int $quizId, ?CarbonInterface $since, string $sort): array
    {
        if (! Schema::hasTable('study_material_feedback')) {
            return [
                'keywords' => [],
                'repeated_phrases' => [],
                'total_feedback_texts' => 0,
            ];
        }

        $rows = StudyMaterialFeedback::query()
            ->join('posts as materials', 'materials.id', '=', 'study_material_feedback.post_id')
            ->leftJoin('subjects', 'subjects.id', '=', 'materials.subject_id')
            ->where('materials.post_type', 'material')
            ->whereNotNull('study_material_feedback.feedback')
            ->whereRaw('LENGTH(TRIM(study_material_feedback.feedback)) > 0')
            ->when($materialId, fn ($builder) => $builder->where('materials.id', $materialId))
            ->when($subjectId, fn ($builder) => $builder->where('materials.subject_id', $subjectId))
            ->when($since, fn ($builder) => $builder->where('study_material_feedback.updated_at', '>=', $since))
            ->select([
                'study_material_feedback.feedback',
                'materials.id as material_id',
                'materials.title as material_title',
                'subjects.name as subject_name',
            ]);

        if ($quizId && Schema::hasColumn('posts', 'parent_material_id')) {
            $rows->whereExists(function ($exists) use ($quizId) {
                $exists->selectRaw('1')
                    ->from('posts as quizzes')
                    ->whereColumn('quizzes.parent_material_id', 'materials.id')
                    ->where('quizzes.id', $quizId);
            });
        }

        $feedbackRows = $rows->limit(1500)->get();

        $stopWords = [
            'the', 'and', 'for', 'that', 'with', 'this', 'from', 'your', 'are', 'was', 'were', 'have', 'has',
            'yang', 'dan', 'untuk', 'dengan', 'saya', 'kamu', 'anda', 'ini', 'itu', 'sudah', 'belum',
        ];

        $keywordStats = [];
        $phraseStats = [];

        foreach ($feedbackRows as $row) {
            $feedback = trim((string) $row->feedback);
            if ($feedback === '') {
                continue;
            }

            $normalizedPhrase = Str::of($feedback)
                ->lower()
                ->replaceMatches('/[^\\pL\\pN\\s]/u', ' ')
                ->squish()
                ->value();

            if (mb_strlen($normalizedPhrase) >= 4) {
                if (! isset($phraseStats[$normalizedPhrase])) {
                    $phraseStats[$normalizedPhrase] = [
                        'phrase' => $normalizedPhrase,
                        'count' => 0,
                        'materials' => [],
                    ];
                }

                $phraseStats[$normalizedPhrase]['count']++;
                $phraseStats[$normalizedPhrase]['materials'][(int) $row->material_id] = [
                    'id' => (int) $row->material_id,
                    'title' => (string) $row->material_title,
                    'subject_name' => $row->subject_name,
                ];
            }

            $tokens = preg_split('/\\s+/u', $normalizedPhrase) ?: [];
            foreach ($tokens as $token) {
                if (mb_strlen($token) < 3 || in_array($token, $stopWords, true)) {
                    continue;
                }

                if (! isset($keywordStats[$token])) {
                    $keywordStats[$token] = [
                        'keyword' => $token,
                        'count' => 0,
                        'materials' => [],
                    ];
                }

                $keywordStats[$token]['count']++;
                $keywordStats[$token]['materials'][(int) $row->material_id] = [
                    'id' => (int) $row->material_id,
                    'title' => (string) $row->material_title,
                    'subject_name' => $row->subject_name,
                ];
            }
        }

        $keywordItems = collect($keywordStats)
            ->filter(fn (array $item) => $item['count'] > 1)
            ->sortByDesc('count')
            ->take(12)
            ->map(fn (array $item) => [
                'keyword' => $item['keyword'],
                'count' => $item['count'],
                'materials' => array_values(array_slice($item['materials'], 0, 3)),
            ])
            ->values()
            ->all();

        $phraseItems = collect($phraseStats)
            ->filter(fn (array $item) => $item['count'] > 1)
            ->sortByDesc('count')
            ->take(12)
            ->map(fn (array $item) => [
                'phrase' => $item['phrase'],
                'count' => $item['count'],
                'materials' => array_values(array_slice($item['materials'], 0, 3)),
            ])
            ->values()
            ->all();

        if ($sort === 'most_repeated') {
            usort($keywordItems, fn ($left, $right) => $right['count'] <=> $left['count']);
            usort($phraseItems, fn ($left, $right) => $right['count'] <=> $left['count']);
        }

        return [
            'keywords' => $keywordItems,
            'repeated_phrases' => $phraseItems,
            'total_feedback_texts' => $feedbackRows->count(),
        ];
    }

    private function buildMaterialVersionHistoryInsights(?int $materialId, ?int $subjectId, ?int $quizId, ?CarbonInterface $since): array
    {
        if (! Schema::hasTable('study_material_versions')) {
            return [];
        }

        $resolvedMaterialId = $materialId;

        if (
            $resolvedMaterialId === null
            && $quizId !== null
            && Schema::hasColumn('posts', 'parent_material_id')
        ) {
            $resolvedMaterialId = Post::query()
                ->where('id', $quizId)
                ->where('post_type', 'quiz')
                ->value('parent_material_id');
            $resolvedMaterialId = $resolvedMaterialId !== null
                ? (int) $resolvedMaterialId
                : null;
        }

        $query = StudyMaterialVersion::query()
            ->select('study_material_versions.*')
            ->join('posts', 'posts.id', '=', 'study_material_versions.post_id')
            ->where('posts.post_type', 'material')
            ->with('post:id,title,subject_id');

        if ($resolvedMaterialId !== null) {
            $query->where('study_material_versions.post_id', $resolvedMaterialId);
        }

        if ($subjectId !== null) {
            $query->where('posts.subject_id', $subjectId);
        }

        if ($since !== null) {
            $query->where('study_material_versions.created_at', '>=', $since);
        }

        $versions = $query
            ->orderBy('study_material_versions.post_id')
            ->orderBy('study_material_versions.version_number')
            ->get();

        return $versions
            ->groupBy('post_id')
            ->flatMap(function (Collection $rows) {
                $previousRecommendationRate = null;

                return $rows->map(function (StudyMaterialVersion $version) use (&$previousRecommendationRate) {
                    $change = $previousRecommendationRate === null
                        ? null
                        : round(((float) $version->recommendation_rate) - $previousRecommendationRate, 1);

                    $previousRecommendationRate = (float) $version->recommendation_rate;

                    return [
                        'id' => $version->id,
                        'material_id' => $version->post_id,
                        'material_title' => $version->post?->title ?? $version->title,
                        'version_number' => (int) $version->version_number,
                        'version_title' => $version->title,
                        'average_rating' => round((float) $version->average_rating, 1),
                        'rating_count' => (int) $version->rating_count,
                        'recommended_count' => (int) $version->recommended_count,
                        'total_votes' => (int) $version->total_votes,
                        'recommendation_rate' => round((float) $version->recommendation_rate, 1),
                        'recommendation_rate_change' => $change,
                        'created_at' => optional($version->created_at)->toISOString(),
                    ];
                });
            })
            ->sortByDesc('created_at')
            ->values()
            ->all();
    }
}

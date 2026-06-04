<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesPostComments;
use App\Http\Controllers\Concerns\HandlesStudyMaterials;
use App\Models\Language;
use App\Models\Post;
use App\Models\QuizAttempt;
use App\Models\QuizCompletion;
use App\Models\Subject;
use App\Services\LearningProgressService;
use App\Services\MaterialVersionService;
use App\Services\PostQueryBuilder;
use App\Services\PostSerializationService;
use App\Services\PointsService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    use HandlesPostComments;
    use HandlesStudyMaterials;

    private const POST_TYPES = ['material', 'question', 'quiz'];

    private const FEED_PER_PAGE = 10;

    public function __construct(
        private readonly MaterialVersionService $materialVersionService,
        private readonly PostQueryBuilder $queryBuilder,
        private readonly PostSerializationService $serializationService,
        private readonly LearningProgressService $learningProgressService,
        private readonly PointsService $pointsService,
    ) {}

    /**
     * Display home page feed with all post types, newest first.
     */
    public function index(Request $request): Response
    {
        return $this->renderHomePage($request);
    }

    /**
     * Display questions feed (questions and quizzes only).
     * no used
     */
    public function questions(Request $request): Response
    {
        return $this->renderHomePage($request, ['question', 'quiz'], 'questions');
    }

    /**
     * Display learning materials feed (material posts only).
     * no used
     */
    public function learningMaterials(Request $request): Response
    {
        return $this->renderHomePage($request, 'material', 'materials');
    }

    /**
     * Return learning progress overview (learning paths, completion %) as JSON.
     * no used
     */
    public function learningOverview(Request $request): JsonResponse
    {
        return response()->json([
            'learningOverview' => $this->learningProgressService->buildLearningOverview($request->user()),
        ]);
    }

    /**
     * Display categories page with available languages and subjects, filtered by post type and filters.
     */
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

    /**
     * Render home page with paginated posts, filtered by type/language/subject.
     * Attaches learning states and material feedback summaries to posts.
     *
     * @param string|array|null $forcedPostType Force posts to specific type(s), overriding user filter
     * @param string $pageContext Page identifier for frontend context (home, questions, materials)
     */
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

    /**
     * Extract pagination metadata from paginator for JSON response.
     */
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

    /**
     * Display full post content with comments, votes, and learning metadata.
     * For materials, includes feedback summary and linked quizzes.
     * For quizzes, includes completion status and past attempts.
     */
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

            $this->loadPostWithComments($post, $userId, false);
        }

        $post->setAttribute('is_liked', $post->likes()->where('user_id', Auth::id())->exists());
        $post->setAttribute('is_saved', $post->bookmarkItems()->where('user_id', Auth::id())->exists());
        $post->setAttribute('is_lesson_completed', false);
        $post->setAttribute(
            'is_quiz_completed',
            $post->post_type === 'quiz' && $userId
                ? $this->hasCompletedQuiz($userId, $post->id)
                : false,
        );
        $post->setAttribute('quiz_attempts', $userId ? $this->getQuizAttemptsForPost($userId, $post->id) : []);

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

    /**
     * Update post content. Only owner can edit. For materials, handles block structure and file uploads.
     * Creates version snapshot for materials if feedback was received.
     */
    public function update(Request $request, Post $post): \Illuminate\Http\RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $isOwner = $post->user_id === $user->id;

        if ($post->post_type === 'material') {
            if (! $user->canPublishStudyMaterials() || ! $isOwner) {
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

            if (Schema::hasColumn('posts', 'material_improved_from_feedback') && $this->materialHasFeedback($post)) {
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

    /**
     * Normalize and validate material blocks from update request.
     * Handles new file uploads, retains existing file references, and validates video URLs.
     */
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
                    $normalized[] = ['type' => 'text', 'text' => $text];
                }

                continue;
            }

            if ($type === 'video') {
                $url = trim((string) ($block['url'] ?? ''));

                if ($url !== '') {
                    $this->validateMaterialVideoUrl($url, $index);
                    $normalized[] = ['type' => 'video', 'url' => $url];
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

    /**
     * Extract plain text content from material blocks (title + text blocks + file names).
     * Used for searchable content storage.
     */
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

        return collect($parts)->flatten()->filter()->implode("\n\n");
    }

    /**
     * Validate that material block URL is a valid http/https URL.
     * Throws ValidationException if invalid.
     */
    private function validateMaterialVideoUrl(string $url, int|string $index): void
    {
        if ($this->isValidHttpUrl($url)) {
            return;
        }

        throw ValidationException::withMessages([
            "material_blocks.{$index}.url" => 'Enter a valid video URL.',
        ]);
    }

    /**
     * Check if URL is a valid http or https URL.
     */
    private function isValidHttpUrl(string $url): bool
    {
        if (! filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true);
    }

    /**
     * Delete a post (owner or admin only). Revokes points earned by the post creator.
     */
    public function destroy(Request $request, Post $post): \Illuminate\Http\RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $isOwner = $post->user_id === $user->id;
        $isAdmin = ($user->role ?? null) === 'admin';

        if (! $isOwner && ! $isAdmin) {
            abort(403);
        }

        DB::transaction(function () use ($post): void {
            $owner = $post->user()->first();
            $action = $post->post_type === 'material'
                ? 'resource_uploaded'
                : 'question_asked';

            if ($owner) {
                $this->pointsService->revoke($owner, $action, $post);
            }

            $post->delete();
        });

        return redirect()->route('homePage');
    }

    /**
     * Check if user has completed a quiz (has entry in quiz_completions table).
     */
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

        return QuizAttempt::query()
            ->where('user_id', $userId)
            ->where('post_id', $postId)
            ->orderBy('question_index')
            ->get(['question_index', 'selected_answer_index', 'is_correct'])
            ->map(fn (QuizAttempt $attempt) => [
                'question_index' => (int) $attempt->question_index,
                'selected_answer_index' => (int) $attempt->selected_answer_index,
                'is_correct' => (bool) $attempt->is_correct,
            ])
            ->values()
            ->all();
    }
}

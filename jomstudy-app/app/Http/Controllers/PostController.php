<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Services\LearningProgressService;
use App\Services\PostCommentService;
use App\Services\PostQueryBuilder;
use App\Services\PostSerializationService;
use App\Services\PostService;
use App\Services\StudyMaterialService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    private const POST_TYPES = ['material', 'question', 'quiz'];

    private const FEED_PER_PAGE = 10;

    public function __construct(
        private readonly PostSerializationService $serializationService,
        private readonly LearningProgressService $learningProgressService,
        private readonly PostService $postService,
        private readonly PostCommentService $postCommentService,
        private readonly StudyMaterialService $studyMaterialService,
    ) {}

    /**
     * Display home page feed with all post types, newest first.
     */
    public function index(Request $request): Response
    {
        return $this->renderHomePage($request);
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

        return Inertia::render('categoriesPage', [
            'languages' => $this->postService->categoryLanguages(),
            'subjects' => $this->postService->categorySubjects(),
            'filteredPosts' => Inertia::lazy(function () use ($request, $validated) {
                $followingIds = $this->postService->followingIds($request->user());

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
                $this->studyMaterialService->attachLearningStates($posts, Auth::id());

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
     */
    private function renderHomePage(Request $request): Response
    {
        $followingIds = $this->postService->followingIds($request->user());

        $validated = $request->validate([
            'post_type' => ['nullable', 'string', Rule::in(self::POST_TYPES)],
            'language_code' => ['nullable', 'string', Rule::exists('languages', 'code')],
            'subject_id' => ['nullable', 'integer', Rule::exists('subjects', 'id')],
        ]);

        $postType = $validated['post_type'] ?? '';
        $postTypesFilter = $postType !== '' ? [$postType] : [];

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
        $this->studyMaterialService->attachLearningStates($posts, Auth::id());
        $this->studyMaterialService->attachFeedbackSummaries($posts);

        $serializedPosts = $posts
            ->map(fn (Post $post) => $this->serializationService->serialize($post, $followingIds));

        return Inertia::render('homePage', [
            'posts' => $serializedPosts,
            'pagination' => $this->paginationMeta($paginator),
            'learningOverview' => $this->learningProgressService->buildLearningOverview($request->user()),
            'postTypeFilter' => count($postTypesFilter) === 1 ? $postTypesFilter[0] : null,
            'pageContext' => 'home',
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
        $followingIds = $this->postService->followingIds(request()->user());
        $supportsCommentVotes = $this->postCommentService->supportsVotes();

        try {
            $this->postCommentService->load($post, $userId, $supportsCommentVotes);
        } catch (QueryException $exception) {
            if (! $supportsCommentVotes || ! $this->postCommentService->isMissingVoteColumn($exception)) {
                throw $exception;
            }

            $this->postCommentService->load($post, $userId, false);
        }

        $this->postService->attachViewerFlags($post, $userId);

        if ($post->post_type === 'material') {
            $this->studyMaterialService->recordView($post, $userId);
            $post->setAttribute('material_feedback_summary', $this->studyMaterialService->feedbackSummary($post));
            $post->setAttribute('material_user_feedback', $this->studyMaterialService->userFeedback($post, $userId));

            if ((request()->user()?->role ?? 'student') === 'teacher') {
                $post->setAttribute('learning_analytics', $this->studyMaterialService->analytics($post));
            }

            $post->setAttribute('linked_quizzes', $this->studyMaterialService->linkedQuizzes($post, $followingIds, $userId));

            $stateMap = $this->studyMaterialService->learningStateMap([$post->id], $userId);
            $post->setAttribute('material_learning_state', $stateMap[$post->id]['state'] ?? 'unread');
            $post->setAttribute('material_learning_path', $stateMap[$post->id]['path'] ?? []);
        }

        return Inertia::render('postContent', [
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
                'material_blocks.*.type' => ['required_with:material_blocks', 'string', Rule::in(['text', 'image', 'document'])],
                'material_blocks.*.text' => ['nullable', 'string', 'max:4000'],
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

            $this->postService->update($post, $updateData, true);
        } else {
            $validated = $request->validate([
                'title' => ['required', 'string', 'max:150'],
                'content' => ['required', 'string', 'max:2000'],
            ]);

            $this->postService->update($post, $validated, false);
        }

        return redirect()->route('posts.show', $post);
    }

    /**
     * Normalize and validate material blocks from update request.
     * Handles new file uploads and retains existing file references.
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
            } elseif (isset($block['name'])) {
                $parts[] = (string) $block['name'];
            }
        }

        return collect($parts)->flatten()->filter()->implode("\n\n");
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

        $this->postService->delete($post);

        return redirect()->route('homePage');
    }
}

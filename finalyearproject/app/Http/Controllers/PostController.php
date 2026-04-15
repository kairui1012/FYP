<?php

namespace App\Http\Controllers;

use App\Models\BookmarkFolder;
use App\Models\Comment;
use App\Models\Language;
use App\Models\Post;
use App\Models\Subject;
use App\Services\AchievementService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    private const POST_TYPES = ['material', 'question', 'quiz'];

    public function __construct(private readonly AchievementService $achievementService)
    {
    }

    public function create(): Response
    {
        return Inertia::render('createPostPage', [
            'subjects' => Subject::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function index(Request $request): Response
    {
        return $this->renderHomePage($request);
    }

    public function questions(Request $request): Response
    {
        return $this->renderHomePage($request, ['question', 'quiz']);
    }

    public function learningMaterials(Request $request): Response
    {
        return $this->renderHomePage($request, 'material');
    }

    public function categories(): Response
    {
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
        ]);
    }

    public function popular(Request $request): Response
    {
        $validated = $request->validate([
            'range' => ['nullable', 'string', Rule::in(['today', 'week', 'month', 'all'])],
        ]);

        $range = $validated['range'] ?? 'week';
        [$startAt, $endAt] = $this->resolvePopularRange($range);

        $followingIds = $request->user()
            ?->following()
            ->pluck('users.id')
            ->all() ?? [];

        $popularPostsQuery = Post::query()
            ->with([
                'user:id,name',
                'user.socialAccounts:id,user_id,avatar',
                'subject:id,name',
                'language:id,code,name',
            ])
            ->withCount([
                'comments',
                'bookmarkItems as saves_count',
                'likes as popular_likes_count' => function ($likeQuery) use ($startAt, $endAt, $range) {
                    if ($range === 'all') {
                        return;
                    }

                    $likeQuery->whereBetween('created_at', [$startAt, $endAt]);
                },
            ])
            ->withExists([
                'likes as is_liked' => fn ($query) => $query->where('user_id', Auth::id()),
                'bookmarkItems as is_saved' => fn ($query) => $query->where('user_id', Auth::id()),
            ])
            ->whereHas('likes', function ($likeQuery) use ($startAt, $endAt, $range) {
                if ($range === 'all') {
                    return;
                }

                $likeQuery->whereBetween('created_at', [$startAt, $endAt]);
            });

        $posts = $popularPostsQuery
            ->orderByDesc('popular_likes_count')
            ->latest()
            ->get()
            ->map(function (Post $post) use ($followingIds) {
                $post->setAttribute('likes_count', (int) ($post->popular_likes_count ?? 0));

                return $this->serializePost($post, $followingIds);
            })
            ->values();

        return Inertia::render('popularPage', [
            'posts' => $posts,
            'activeRange' => $range,
            'rangeOptions' => [
                'today' => __('popular.today'),
                'week' => __('popular.week'),
                'month' => __('popular.month'),
                'all' => __('popular.all'),
            ],
        ]);
    }

    public function bookmarks(Request $request): Response
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
            ->map(function (Post $post) use ($followingIds, $selectedFolder) {
                $post->setAttribute('saved_at', $post->pivot?->created_at);
                $post->setAttribute('bookmark_folder_id', $selectedFolder->id);

                return $this->serializePost($post, $followingIds);
            });

        return Inertia::render('BookmarksPage', [
            'posts' => $posts,
            'folders' => $folders,
            'activeFolderId' => $selectedFolder->id,
        ]);
    }

    private function renderHomePage(Request $request, string|array|null $forcedPostType = null): Response
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

        $postsQuery = Post::query()
            ->with([
                'user:id,name',
                'user.socialAccounts:id,user_id,avatar',
                'subject:id,name',
                'language:id,code,name',
            ])
            ->withCount(['likes', 'comments', 'bookmarkItems as saves_count'])
            ->withExists([
                'likes as is_liked' => fn ($query) => $query->where('user_id', Auth::id()),
                'bookmarkItems as is_saved' => fn ($query) => $query->where('user_id', Auth::id()),
            ]);

        if (count($postTypesFilter) > 0) {
            $postsQuery->whereIn('post_type', $postTypesFilter);
        }

        if ($languageCode !== '') {
            $postsQuery->whereHas('language', fn ($query) => $query->where('code', $languageCode));
        }

        if ($subjectId !== null) {
            $postsQuery->where('subject_id', $subjectId);
        }

        $posts = $postsQuery
            ->latest()
            ->get()
            ->map(fn (Post $post) => $this->serializePost($post, $followingIds));

        return Inertia::render('homePage', [
            'posts' => $posts,
            'postTypeFilter' => count($postTypesFilter) === 1 ? $postTypesFilter[0] : null,
            'languageFilter' => $languageCode !== '' ? $languageCode : null,
            'subjectFilter' => $subjectId,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'content' => ['required', 'string', 'max:2000'],
            'post_type' => ['required', 'string', Rule::in(self::POST_TYPES)],
            'subject_id' => ['required', 'integer', Rule::exists('subjects', 'id')],
            'language_code' => ['required', 'string', Rule::exists('languages', 'code')],
            'quiz_options' => ['nullable', 'array', 'size:4', 'required_if:post_type,quiz'],
            'quiz_options.*' => ['required_if:post_type,quiz', 'string', 'max:255'],
            'quiz_answer' => ['nullable', 'integer', 'between:0,3', 'required_if:post_type,quiz'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'mimetypes:image/jpeg,image/png,image/webp,image/gif,application/pdf', 'max:10240'],
        ]);

        $quizData = null;
        if (($validated['post_type'] ?? null) === 'quiz') {
            $options = collect($validated['quiz_options'] ?? [])
                ->map(fn ($option) => trim((string) $option))
                ->all();

            $answerIndex = (int) ($validated['quiz_answer'] ?? -1);

            if (count(array_filter($options, fn ($option) => $option !== '')) !== 4 || ! isset($options[$answerIndex])) {
                throw ValidationException::withMessages([
                    'quiz_options' => 'Please provide four options and a valid answer.',
                ]);
            }

            $quizData = [
                'options' => array_values($options),
                'answer_index' => $answerIndex,
            ];
        }

        $subject = Subject::query()->find($validated['subject_id']);

        if (! $subject) {
            throw ValidationException::withMessages([
                'subject_id' => 'The selected subject is invalid.',
            ]);
        }

        $language = Language::query()
            ->where('code', $validated['language_code'])
            ->first();

        if (!$language) {
            throw ValidationException::withMessages([
                'language_code' => 'The selected language is invalid.',
            ]);
        }

        $storedAttachments = [];

        foreach ($request->file('attachments', []) as $file) {
            $storedAttachments[] = $file->store('posts', 'public');
        }

        DB::transaction(function () use ($request, $validated, $language, $storedAttachments, $subject, $quizData): void {
            Post::query()->create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'content' => $validated['content'],
                'post_type' => $validated['post_type'],
                'quiz_data' => $quizData,
                'subject_id' => $subject->id,
                'language_id' => $language->id,
                'image' => count($storedAttachments) > 0 ? $storedAttachments : null,
            ]);
        });

        $this->achievementService->syncUser($request->user());

        return redirect()
            ->route('homePage')
            ->with('success', 'Post created successfully.');
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

        return Inertia::render('PostContent', [
            'post' => $this->serializePost($post, $followingIds),
        ]);
    }

    private function loadPostWithComments(Post $post, ?int $userId, bool $supportsCommentVotes): void
    {
        $post->load([
            'user:id,name',
            'user.socialAccounts:id,user_id,avatar',
            'subject:id,name',
            'language:id,code,name',
            'comments' => function ($query) use ($userId, $supportsCommentVotes) {
                $query->with([
                    'user:id,name',
                    'user.socialAccounts:id,user_id,avatar',
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

    private function serializePost(Post $post, array $followingIds = []): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'content' => $post->content,
            'post_type' => $post->post_type,
            'quiz_data' => $post->quiz_data,
            'image' => $post->image,
            'created_at' => optional($post->created_at)->toISOString(),
            'saved_at' => optional($post->saved_at)->toISOString(),
            'bookmark_folder_id' => $post->bookmark_folder_id ?? $post->pivot?->bookmark_folder_id,
            'user' => $post->user ? [
                'id' => $post->user->id,
                'name' => $post->user->name,
                'avatar' => $post->user->socialAccounts
                    ->first(fn ($account) => ! empty($account->avatar))
                    ?->avatar,
                'is_following' => in_array($post->user->id, $followingIds, true),
            ] : null,
            'language' => $post->language ? [
                'code' => $post->language->code,
                'name' => $post->language->name,
            ] : null,
            'subject' => $post->subject ? [
                'id' => $post->subject->id,
                'name' => $post->subject->name,
            ] : null,
            'likes_count' => $post->likes_count,
            'comments_count' => $post->comments_count,
            'saves_count' => $post->saves_count,
            'is_liked' => (bool) ($post->is_liked ?? false),
            'is_saved' => (bool) ($post->is_saved ?? false),
            'comments' => $post->relationLoaded('comments')
                ? $this->buildCommentTree($post->comments)
                : null,
        ];
    }

    private function buildCommentTree(Collection $comments, ?int $parentId = null, int $depth = 1): array
    {
        return $comments
            ->filter(fn (Comment $comment) => $comment->parent_id === $parentId)
            ->sort(function (Comment $left, Comment $right) {
                return $this->compareComments($left, $right);
            })
            ->values()
            ->map(function (Comment $comment) use ($comments, $depth) {
                $comment->setAttribute('score', $this->calculateCommentScore($comment));
                return [
                    ...$this->serializeComment($comment, $depth),
                    'replies' => $this->buildCommentTree($comments, $comment->id, $depth + 1),
                ];
            })
            ->all();
    }

    private function serializeComment(Comment $comment, int $depth): array
    {
        $upvotesCount = (int) ($comment->upvotes_count ?? $comment->likes_count ?? 0);
        $downvotesCount = (int) ($comment->downvotes_count ?? 0);
        $score = (int) ($comment->score ?? ($upvotesCount - $downvotesCount));
        $userVote = $this->resolveUserVote($comment);

        return [
            'id' => $comment->id,
            'parent_id' => $comment->parent_id,
            'depth' => $depth,
            'content' => $comment->content,
            'attachments' => $comment->attachments,
            'mentions' => $comment->mentions,
            'created_at' => optional($comment->created_at)->toISOString(),
            'likes_count' => $upvotesCount,
            'upvotes_count' => $upvotesCount,
            'downvotes_count' => $downvotesCount,
            'score' => $score,
            'user_vote' => $userVote,
            'is_liked' => $userVote === 1,
            'is_upvoted' => $userVote === 1,
            'is_downvoted' => $userVote === -1,
            'user' => $comment->user ? [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'avatar' => $comment->user->socialAccounts
                    ->first(fn ($account) => ! empty($account->avatar))
                    ?->avatar,
            ] : null,
        ];
    }

    private function compareComments(Comment $left, Comment $right): int
    {
        $leftScore = $this->calculateCommentScore($left);
        $rightScore = $this->calculateCommentScore($right);

        if ($leftScore !== $rightScore) {
            return $rightScore <=> $leftScore;
        }

        $leftUpvotes = (int) ($left->upvotes_count ?? 0);
        $rightUpvotes = (int) ($right->upvotes_count ?? 0);

        if ($leftUpvotes !== $rightUpvotes) {
            return $rightUpvotes <=> $leftUpvotes;
        }

        return ($left->created_at?->getTimestamp() ?? 0) <=> ($right->created_at?->getTimestamp() ?? 0);
    }

    private function calculateCommentScore(Comment $comment): int
    {
        return (int) ($comment->upvotes_count ?? 0) - (int) ($comment->downvotes_count ?? 0);
    }

    private function resolveUserVote(Comment $comment): int
    {
        $vote = $comment->relationLoaded('votes')
            ? $comment->votes->first()?->vote
            : null;

        if ($vote !== null) {
            return (int) $vote;
        }

        return (int) ($comment->is_liked ?? 0);
    }

    /**
     * @return array{0: Carbon|null, 1: Carbon|null}
     */
    private function resolvePopularRange(string $range): array
    {
        $now = Carbon::now();

        return match ($range) {
            'today' => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            default => [null, null],
        };
    }
}

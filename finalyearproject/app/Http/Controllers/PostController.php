<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Language;
use App\Models\Post;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    private const POST_TYPES = ['material', 'question'];

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
        return $this->renderHomePage($request, 'question');
    }

    public function learningMaterials(Request $request): Response
    {
        return $this->renderHomePage($request, 'material');
    }

    private function renderHomePage(Request $request, ?string $forcedPostType = null): Response
    {
        $followingIds = $request->user()
            ?->following()
            ->pluck('users.id')
            ->all() ?? [];

        $queryPostType = $request->string('post_type')->toString();
        $postType = $forcedPostType ?? $queryPostType;

        if ($postType !== '' && !in_array($postType, self::POST_TYPES, true)) {
            throw ValidationException::withMessages([
                'post_type' => 'The selected post type is invalid.',
            ]);
        }

        $postsQuery = Post::query()
            ->with([
                'user:id,name',
                'user.socialAccounts:id,user_id,avatar',
                'subject:id,name',
                'language:id,code,name',
            ])
            ->withCount(['likes', 'comments', 'saves'])
            ->withExists([
                'likes as is_liked' => fn ($query) => $query->where('user_id', Auth::id()),
                'saves as is_saved' => fn ($query) => $query->where('user_id', Auth::id()),
            ]);

        if ($postType !== '') {
            $postsQuery->where('post_type', $postType);
        }

        $posts = $postsQuery
            ->latest()
            ->get()
            ->map(fn (Post $post) => $this->serializePost($post, $followingIds));

        return Inertia::render('homePage', [
            'posts' => $posts,
            'postTypeFilter' => $postType !== '' ? $postType : null,
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
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'mimetypes:image/jpeg,image/png,image/webp,image/gif,application/pdf', 'max:10240'],
        ]);

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

        DB::transaction(function () use ($request, $validated, $language, $storedAttachments, $subject): void {
            Post::query()->create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'content' => $validated['content'],
                'post_type' => $validated['post_type'],
                'subject_id' => $subject->id,
                'language_id' => $language->id,
                'image' => count($storedAttachments) > 0 ? $storedAttachments : null,
            ]);
        });

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

        $post->load([
            'user:id,name',
            'user.socialAccounts:id,user_id,avatar',
            'subject:id,name',
            'language:id,code,name',
            'comments' => fn ($query) => $query
                ->oldest('created_at')
                ->with([
                    'user:id,name',
                    'user.socialAccounts:id,user_id,avatar',
                ])
                ->withCount('likes')
                ->withExists([
                    'likes as is_liked' => fn ($likeQuery) => $likeQuery->where('user_id', $userId),
                ]),
        ])
            ->loadCount(['likes', 'comments', 'saves']);

        $post->setAttribute(
            'is_liked',
            $post->likes()->where('user_id', Auth::id())->exists()
        );

        $post->setAttribute(
            'is_saved',
            $post->saves()->where('user_id', Auth::id())->exists()
        );

        return Inertia::render('PostContent', [
            'post' => $this->serializePost($post, $followingIds),
        ]);
    }

    private function serializePost(Post $post, array $followingIds = []): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'content' => $post->content,
            'post_type' => $post->post_type,
            'image' => $post->image,
            'created_at' => optional($post->created_at)->toISOString(),
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
            ->values()
            ->map(function (Comment $comment) use ($comments, $depth) {
                return [
                    ...$this->serializeComment($comment, $depth),
                    'replies' => $this->buildCommentTree($comments, $comment->id, $depth + 1),
                ];
            })
            ->all();
    }

    private function serializeComment(Comment $comment, int $depth): array
    {
        return [
            'id' => $comment->id,
            'parent_id' => $comment->parent_id,
            'depth' => $depth,
            'content' => $comment->content,
            'attachments' => $comment->attachments,
            'mentions' => $comment->mentions,
            'created_at' => optional($comment->created_at)->toISOString(),
            'likes_count' => (int) ($comment->likes_count ?? 0),
            'is_liked' => (bool) ($comment->is_liked ?? false),
            'user' => $comment->user ? [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'avatar' => $comment->user->socialAccounts
                    ->first(fn ($account) => ! empty($account->avatar))
                    ?->avatar,
            ] : null,
        ];
    }
}

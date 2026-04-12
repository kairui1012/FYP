<?php

namespace App\Http\Controllers;

use App\Models\Language;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    public function index(): Response
    {
        $posts = Post::query()
            ->with(['user:id,name', 'language:id,code,name'])
            ->withCount(['likes', 'comments'])
            ->withExists([
                'likes as is_liked' => fn ($query) => $query->where('user_id', auth()->id()),
            ])
            ->latest()
            ->get()
            ->map(fn (Post $post) => $this->serializePost($post));

        return Inertia::render('homePage', [
            'posts' => $posts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'content' => ['required', 'string', 'max:2000'],
            'language_code' => ['required', 'string', Rule::exists('languages', 'code')],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'mimetypes:image/jpeg,image/png,image/webp,image/gif,application/pdf', 'max:10240'],
        ]);

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

        DB::transaction(function () use ($request, $validated, $language, $storedAttachments): void {
            Post::query()->create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'content' => $validated['content'],
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
        $post->load(['user:id,name', 'language:id,code,name'])
            ->loadCount(['likes', 'comments']);

        $post->setAttribute(
            'is_liked',
            $post->likes()->where('user_id', auth()->id())->exists()
        );

        return Inertia::render('PostContent', [
            'post' => $this->serializePost($post),
        ]);
    }

    private function serializePost(Post $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'content' => $post->content,
            'image' => $post->image,
            'created_at' => optional($post->created_at)->toISOString(),
            'user' => $post->user ? [
                'name' => $post->user->name,
            ] : null,
            'language' => $post->language ? [
                'code' => $post->language->code,
                'name' => $post->language->name,
            ] : null,
            'likes_count' => $post->likes_count,
            'comments_count' => $post->comments_count,
            'is_liked' => (bool) ($post->is_liked ?? false),
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Language;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'content' => ['required', 'string', 'max:2000'],
            'language_code' => ['required', 'string', 'in:en,zh,bm'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'mimetypes:image/jpeg,image/png,image/webp,image/gif,application/pdf', 'max:10240'],
        ]);

        $language = Language::query()
            ->where('code', $validated['language_code'])
            ->firstOrFail();

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
}

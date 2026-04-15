<?php

namespace App\Http\Controllers;

use App\Models\BookmarkFolder;
use App\Models\BookmarkItem;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookmarkFolderController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:80',
                Rule::unique('bookmark_folders', 'name')
                    ->where(fn ($query) => $query->where('user_id', $request->user()->id)),
            ],
        ]);

        $name = trim($validated['name']);

        if ($name === '') {
            return response()->json([
                'message' => 'Folder name is required.',
            ], 422);
        }

        $folder = BookmarkFolder::query()->create([
            'user_id' => $request->user()->id,
            'name' => $name,
            'is_default' => false,
        ]);

        return response()->json([
            'folder' => $this->serializeFolder($folder),
        ], 201);
    }

    public function update(Request $request, BookmarkFolder $bookmarkFolder): JsonResponse
    {
        $this->assertOwnership($request, $bookmarkFolder);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:80',
                Rule::unique('bookmark_folders', 'name')
                    ->where(fn ($query) => $query->where('user_id', $request->user()->id))
                    ->ignore($bookmarkFolder->id),
            ],
        ]);

        $name = trim($validated['name']);

        if ($name === '') {
            return response()->json([
                'message' => 'Folder name is required.',
            ], 422);
        }

        $bookmarkFolder->update([
            'name' => $name,
        ]);

        return response()->json([
            'folder' => $this->serializeFolder($bookmarkFolder->refresh()),
        ]);
    }

    public function destroy(Request $request, BookmarkFolder $bookmarkFolder): JsonResponse
    {
        $this->assertOwnership($request, $bookmarkFolder);

        if ($bookmarkFolder->is_default) {
            return response()->json([
                'message' => 'The default bookmark folder cannot be deleted.',
            ], 422);
        }

        $defaultFolder = BookmarkFolder::defaultFor($request->user());

        BookmarkItem::query()
            ->where('bookmark_folder_id', $bookmarkFolder->id)
            ->update(['bookmark_folder_id' => $defaultFolder->id]);

        $bookmarkFolder->delete();

        return response()->json([
            'folder_id' => $defaultFolder->id,
        ]);
    }

    public function movePost(Request $request, Post $post): JsonResponse
    {
        $validated = $request->validate([
            'folder_id' => ['required', 'integer', Rule::exists('bookmark_folders', 'id')],
        ]);

        $folder = BookmarkFolder::query()
            ->where('id', $validated['folder_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        BookmarkItem::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'post_id' => $post->id,
            ],
            [
                'bookmark_folder_id' => $folder->id,
            ]
        );

        return response()->json([
            'folder_id' => $folder->id,
        ]);
    }

    private function assertOwnership(Request $request, BookmarkFolder $bookmarkFolder): void
    {
        abort_unless($bookmarkFolder->user_id === $request->user()->id, 403);
    }

    private function serializeFolder(BookmarkFolder $folder): array
    {
        return [
            'id' => $folder->id,
            'name' => $folder->name,
            'is_default' => (bool) $folder->is_default,
            'items_count' => (int) ($folder->items_count ?? $folder->items()->count()),
        ];
    }
}
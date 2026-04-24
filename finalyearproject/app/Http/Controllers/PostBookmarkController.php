<?php

namespace App\Http\Controllers;

use App\Models\BookmarkFolder;
use App\Models\Post;
use App\Services\PostSerializationService;
use Illuminate\Http\Request;
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

                return $this->serializationService->serialize($post, $followingIds);
            });

        return Inertia::render('BookmarksPage', [
            'posts' => $posts,
            'folders' => $folders,
            'activeFolderId' => $selectedFolder->id,
        ]);
    }
}

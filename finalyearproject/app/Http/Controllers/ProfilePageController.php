<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfilePageController extends Controller
{
    public function show(Request $request, ?User $user = null): Response
    {
        /** @var User $viewer */
        $viewer = $request->user();
        $profileUser = $user ?? $viewer;

        $profileUser->loadMissing([
            'socialAccounts:id,user_id,avatar',
            'profile:id,user_id,cover_image',
        ]);

        $avatar = $profileUser->socialAccounts
            ->first(fn ($account) => ! empty($account->avatar))
            ?->avatar;

        $isFollowing = $viewer->id !== $profileUser->id
            ? $viewer->following()->where('following_id', $profileUser->id)->exists()
            : false;

        $posts = Post::query()
            ->where('user_id', $profileUser->id)
            ->with(['language:id,code,name'])
            ->withCount(['likes', 'comments'])
            ->latest()
            ->get()
            ->map(fn (Post $post) => [
                'id' => $post->id,
                'title' => $post->title,
                'content' => $post->content,
                'image' => $post->image,
                'created_at' => optional($post->created_at)->toISOString(),
                'likes_count' => $post->likes_count,
                'comments_count' => $post->comments_count,
                'language' => $post->language ? [
                    'code' => $post->language->code,
                    'name' => $post->language->name,
                ] : null,
            ]);

        return Inertia::render('profilePage', [
            'profileUser' => [
                'id' => $profileUser->id,
                'name' => $profileUser->name,
                'email' => $viewer->id === $profileUser->id ? $profileUser->email : null,
                'avatar' => $avatar,
                'cover_image' => $profileUser->profile?->cover_image ?? $profileUser->cover_image,
                'is_following' => $isFollowing,
            ],
            'can_edit_cover' => $viewer->id === $profileUser->id,
            'posts' => $posts,
        ]);
    }

    public function updateCover(Request $request): RedirectResponse
    {
        $request->validate([
            'cover_image' => [
                'required',
                'file',
                'image',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:5120',
            ],
        ]);

        /** @var User $user */
        $user = $request->user();

        $existingProfile = $user->profile;

        if (! empty($existingProfile?->cover_image)) {
            Storage::disk('public')->delete($existingProfile->cover_image);
        }

        $path = $request->file('cover_image')->store('profile-covers', 'public');

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            ['cover_image' => $path],
        );

        return back()->with('success', 'Profile cover updated.');
    }
}

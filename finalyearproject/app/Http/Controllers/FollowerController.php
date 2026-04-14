<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;


class FollowerController extends Controller
{
    public function toggle(Request $request, User $user): JsonResponse|RedirectResponse
    {
        $authUser = $request->user();

        if (! $authUser || $authUser->id === $user->id) {
            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'invalid',
                    'is_following' => false,
                ], 422);
            }

            return back()->with('status', 'invalid');
        }

        if ($authUser->following()->where('following_id', $user->id)->exists()) {
            $authUser->following()->detach($user->id);
            $status = 'unfollowed';
            $isFollowing = false;
        } else {
            $authUser->following()->attach($user->id);
            $status = 'followed';
            $isFollowing = true;
        }

        if ($request->expectsJson()) {
            return response()->json([
                'status' => $status,
                'is_following' => $isFollowing,
            ]);
        }

        return back()->with('status', $status);
    }

    public function index(Request $request)
    {
        $followingIds = $request->user()
            ?->following()
            ->pluck('users.id')
            ->all() ?? [];

        $posts = Post::query()
            ->whereIn('user_id', $followingIds)
            ->with([
                'user:id,name',
                'user.socialAccounts:id,user_id,avatar',
                'language:id,code,name',
            ])
            ->withCount(['likes', 'comments', 'saves'])
            ->withExists([
                'likes as is_liked' => fn ($query) => $query->where('user_id', Auth::id()),
                'saves as is_saved' => fn ($query) => $query->where('user_id', Auth::id()),
            ])
            ->latest()
            ->get()
            ->map(fn (Post $post) => [
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
                'likes_count' => $post->likes_count,
                'comments_count' => $post->comments_count,
                'saves_count' => $post->saves_count,
                'is_liked' => (bool) ($post->is_liked ?? false),
                'is_saved' => (bool) ($post->is_saved ?? false),
            ]);

        return inertia('homePage', [
            'posts' => $posts,
            'postTypeFilter' => null,
        ]);
    }
}

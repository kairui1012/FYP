<?php

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class FollowService
{
    public function __construct(
        private readonly LeaderboardTitleService $leaderboardTitleService,
        private readonly PointsService $pointsService,
    ) {}

    /** @return array{status: string, is_following: bool} */
    public function toggle(User $viewer, User $target): array
    {
        if ($viewer->following()->where('following_id', $target->id)->exists()) {
            $this->pointsService->revoke($target, 'follower_gained', $viewer);
            $viewer->following()->detach($target->id);

            return ['status' => 'unfollowed', 'is_following' => false];
        }

        $viewer->following()->attach($target->id);
        $this->pointsService->award($target, 'follower_gained', $viewer, $viewer);

        return ['status' => 'followed', 'is_following' => true];
    }

    /** @return array{posts: mixed, pagination: array<string, mixed>} */
    public function feed(User $user, int $perPage): array
    {
        $followingIds = $user->following()->pluck('users.id')->all();
        $paginator = Post::query()
            ->whereIn('user_id', $followingIds)
            ->whereHas('user', fn ($query) => $query->where('is_blocked', false))
            ->with(['user:id,name,role,is_verified', 'user.socialAccounts:id,user_id,avatar', 'language:id,code,name'])
            ->withCount(['likes', 'comments', 'bookmarkItems as saves_count'])
            ->withExists([
                'likes as is_liked' => fn ($query) => $query->where('user_id', $user->id),
                'bookmarkItems as is_saved' => fn ($query) => $query->where('user_id', $user->id),
            ])->latest()->paginate($perPage)->withQueryString();

        $posts = $paginator->getCollection()->map(fn (Post $post) => [
            'id' => $post->id,
            'title' => $post->title,
            'content' => $post->content,
            'post_type' => $post->post_type,
            'image' => $post->image,
            'created_at' => optional($post->created_at)->toISOString(),
            'user' => $post->user ? [
                'id' => $post->user->id,
                'name' => $post->user->name,
                'role' => $post->user->role ?? 'student',
                'is_verified' => (bool) ($post->user->is_verified ?? false),
                'avatar' => $post->user->socialAccounts->first(fn ($account) => ! empty($account->avatar))?->avatar,
                'leaderboard_title' => $this->leaderboardTitleService->titleForUserId($post->user->id),
                'is_following' => in_array($post->user->id, $followingIds, true),
            ] : null,
            'language' => $post->language ? ['code' => $post->language->code, 'name' => $post->language->name] : null,
            'likes_count' => $post->likes_count,
            'comments_count' => $post->comments_count,
            'saves_count' => $post->saves_count,
            'is_liked' => (bool) ($post->is_liked ?? false),
            'is_saved' => (bool) ($post->is_saved ?? false),
        ]);

        return ['posts' => $posts, 'pagination' => $this->paginationMeta($paginator)];
    }

    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(), 'total' => $paginator->total(),
            'from' => $paginator->firstItem(), 'to' => $paginator->lastItem(),
            'prev_page_url' => $paginator->previousPageUrl(), 'next_page_url' => $paginator->nextPageUrl(),
        ];
    }
}

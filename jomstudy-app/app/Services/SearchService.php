<?php

namespace App\Services;

use App\Models\Post;
use App\Models\User;

class SearchService
{
    public function __construct(private readonly LeaderboardTitleService $leaderboardTitleService) {}

    /** @return array{users: mixed, posts: mixed} */
    public function search(string $query): array
    {
        if (strlen($query) < 2) {
            return ['users' => [], 'posts' => []];
        }

        $like = '%'.$query.'%';

        $users = User::query()
            ->where('name', 'LIKE', $like)
            ->select('id', 'name')
            ->with('socialAccounts:id,user_id,avatar')
            ->orderByRaw('CASE WHEN LOWER(name) = LOWER(?) THEN 0 WHEN LOWER(name) LIKE LOWER(?) THEN 1 ELSE 2 END', [$query, $query.'%'])
            ->limit(5)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->socialAccounts->first(fn ($account) => ! empty($account->avatar))?->avatar,
                'leaderboard_title' => $this->leaderboardTitleService->titleForUserId($user->id),
                'type' => 'user',
            ]);

        $posts = Post::query()
            ->where(function ($postQuery) use ($like) {
                $postQuery->where('title', 'LIKE', $like)->orWhere('content', 'LIKE', $like);
            })
            ->select('id', 'title', 'post_type', 'user_id')
            ->with('user:id,name,is_verified')
            ->orderByRaw('CASE WHEN LOWER(title) = LOWER(?) THEN 0 WHEN LOWER(title) LIKE LOWER(?) THEN 1 WHEN LOWER(content) LIKE LOWER(?) THEN 2 ELSE 3 END', [$query, $query.'%', $like])
            ->limit(5)
            ->get()
            ->map(fn (Post $post) => [
                'id' => $post->id,
                'title' => $post->title,
                'post_type' => $post->post_type,
                'author' => $post->user?->name,
                'author_leaderboard_title' => $this->leaderboardTitleService->titleForUserId($post->user?->id),
                'type' => 'post',
            ]);

        return ['users' => $users, 'posts' => $posts];
    }
}

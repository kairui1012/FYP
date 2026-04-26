<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use App\Services\LeaderboardTitleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(private readonly LeaderboardTitleService $leaderboardTitleService) {}

    public function search(Request $request): JsonResponse
    {
        $query = trim($request->get('q', ''));

        if (strlen($query) < 2) {
            return response()->json(['users' => [], 'posts' => []]);
        }

        $like = '%'.$query.'%';

        $users = User::where('name', 'LIKE', $like)
            ->select('id', 'name')
            ->with('socialAccounts:id,user_id,avatar')
            ->orderByRaw('
                CASE
                    WHEN LOWER(name) = LOWER(?) THEN 0
                    WHEN LOWER(name) LIKE LOWER(?) THEN 1
                    ELSE 2
                END
            ', [$query, $query.'%'])
            ->limit(5)
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->socialAccounts->first(fn ($a) => ! empty($a->avatar))?->avatar,
                'leaderboard_title' => $this->leaderboardTitleService->titleForUserId($user->id),
                'type' => 'user',
            ]);

        $posts = Post::where('title', 'LIKE', $like)
            ->select('id', 'title', 'post_type', 'user_id')
            ->with('user:id,name')
            ->orderByRaw('
                CASE
                    WHEN LOWER(title) = LOWER(?) THEN 0
                    WHEN LOWER(title) LIKE LOWER(?) THEN 1
                    ELSE 2
                END
            ', [$query, $query.'%'])
            ->limit(5)
            ->get()
            ->map(fn ($post) => [
                'id' => $post->id,
                'title' => $post->title,
                'post_type' => $post->post_type,
                'author' => $post->user?->name,
                'author_leaderboard_title' => $this->leaderboardTitleService->titleForUserId($post->user?->id),
                'type' => 'post',
            ]);

        return response()->json([
            'users' => $users,
            'posts' => $posts,
        ]);
    }
}

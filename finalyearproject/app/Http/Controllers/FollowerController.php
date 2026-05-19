<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use App\Services\LeaderboardTitleService;
use App\Services\PointsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class FollowerController extends Controller
{
    private const FEED_PER_PAGE = 10;

    public function __construct(
        private readonly LeaderboardTitleService $leaderboardTitleService,
        private readonly PointsService $pointsService,
    ) {}

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
            $this->pointsService->revoke($user, 'follower_gained', $authUser);
            $authUser->following()->detach($user->id);
            $status = 'unfollowed';
            $isFollowing = false;
        } else {
            $authUser->following()->attach($user->id);
            $this->pointsService->award($user, 'follower_gained', $authUser, $authUser);
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

        $paginator = Post::query()
            ->whereIn('user_id', $followingIds)
            ->whereHas('user', fn ($q) => $q->where('is_blocked', false))
            ->with([
                'user:id,name,role,is_verified',
                'user.socialAccounts:id,user_id,avatar',
                'language:id,code,name',
            ])
            ->withCount(['likes', 'comments', 'bookmarkItems as saves_count'])
            ->withExists([
                'likes as is_liked' => fn ($query) => $query->where('user_id', Auth::id()),
                'bookmarkItems as is_saved' => fn ($query) => $query->where('user_id', Auth::id()),
            ])
            ->latest()
            ->paginate(self::FEED_PER_PAGE)
            ->withQueryString();

        $posts = $paginator->getCollection()
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
                    'role' => $post->user->role ?? 'student',
                    'is_verified' => (bool) ($post->user->is_verified ?? false),
                    'avatar' => $post->user->socialAccounts
                        ->first(fn ($account) => ! empty($account->avatar))
                        ?->avatar,
                    'leaderboard_title' => $this->leaderboardTitleService->titleForUserId($post->user->id),
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

        return inertia('HomePage', [
            'posts' => $posts,
            'pagination' => $this->paginationMeta($paginator),
            'postTypeFilter' => null,
            'pageContext' => 'following',
        ]);
    }

    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'prev_page_url' => $paginator->previousPageUrl(),
            'next_page_url' => $paginator->nextPageUrl(),
        ];
    }
}

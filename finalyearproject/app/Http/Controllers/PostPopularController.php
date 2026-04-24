<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Services\PostSerializationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PostPopularController extends Controller
{
    public function __construct(private readonly PostSerializationService $serializationService)
    {
    }

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'range' => ['nullable', 'string', Rule::in(['today', 'week', 'month', 'all'])],
        ]);

        $range = $validated['range'] ?? 'week';
        [$startAt, $endAt] = $this->resolvePopularRange($range);

        $followingIds = $request->user()
            ?->following()
            ->pluck('users.id')
            ->all() ?? [];

        $popularPostsQuery = Post::query()
            ->with([
                'user:id,name',
                'user.socialAccounts:id,user_id,avatar',
                'subject:id,name',
                'language:id,code,name',
            ])
            ->withCount([
                'comments',
                'bookmarkItems as saves_count',
                'likes as popular_likes_count' => function ($likeQuery) use ($startAt, $endAt, $range) {
                    if ($range === 'all') {
                        return;
                    }

                    $likeQuery->whereBetween('created_at', [$startAt, $endAt]);
                },
            ])
            ->withExists([
                'likes as is_liked' => fn ($query) => $query->where('user_id', Auth::id()),
                'bookmarkItems as is_saved' => fn ($query) => $query->where('user_id', Auth::id()),
            ])
            ->whereHas('likes', function ($likeQuery) use ($startAt, $endAt, $range) {
                if ($range === 'all') {
                    return;
                }

                $likeQuery->whereBetween('created_at', [$startAt, $endAt]);
            });

        $posts = $popularPostsQuery
            ->orderByDesc('popular_likes_count')
            ->latest()
            ->get()
            ->map(function (Post $post) use ($followingIds) {
                $post->setAttribute('likes_count', (int) ($post->popular_likes_count ?? 0));

                return $this->serializationService->serialize($post, $followingIds);
            })
            ->values();

        return Inertia::render('popularPage', [
            'posts' => $posts,
            'activeRange' => $range,
            'rangeOptions' => [
                'today' => __('popular.today'),
                'week' => __('popular.week'),
                'month' => __('popular.month'),
                'all' => __('popular.all'),
            ],
        ]);
    }

    /**
     * @return array{0: Carbon|null, 1: Carbon|null}
     */
    private function resolvePopularRange(string $range): array
    {
        $now = Carbon::now();

        return match ($range) {
            'today' => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            default => [null, null],
        };
    }
}

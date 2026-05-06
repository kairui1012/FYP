<?php

namespace App\Http\Controllers;

use App\Models\Language;
use App\Models\Post;
use App\Models\Subject;
use App\Services\PostSerializationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PostPopularController extends Controller
{
    private const FEED_PER_PAGE = 10;

    public function __construct(private readonly PostSerializationService $serializationService)
    {
    }

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'range'         => ['nullable', 'string', Rule::in(['today', 'week', 'month', 'all'])],
            'sort'          => ['nullable', 'string', Rule::in(['newest', 'hottest'])],
            'language_code' => ['nullable', 'string', Rule::exists('languages', 'code')],
            'subject_id'    => ['nullable', 'integer', Rule::exists('subjects', 'id')],
            'post_type'     => ['nullable', 'string', Rule::in(['material', 'question', 'quiz'])],
        ]);

        $languageCode = $validated['language_code'] ?? '';
        $subjectId    = isset($validated['subject_id']) ? (int) $validated['subject_id'] : null;
        $postType     = $validated['post_type'] ?? '';

        $hasCategoryFilter = $languageCode !== '' || $subjectId !== null || $postType !== '';

        $range = $validated['range'] ?? ($hasCategoryFilter ? 'all' : 'week');
        $sort  = $validated['sort'] ?? ($hasCategoryFilter ? 'newest' : 'hottest');
        [$startAt, $endAt] = $this->resolvePopularRange($range);

        $followingIds = $request->user()
            ?->following()
            ->pluck('users.id')
            ->all() ?? [];

        $popularPostsQuery = Post::query()
            ->whereHas('user', fn ($q) => $q->where('is_blocked', false))
            ->with([
                'user:id,name,role,is_verified',
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
            ]);

        if ($languageCode !== '') {
            $popularPostsQuery->whereHas('language', fn ($q) => $q->where('code', $languageCode));
        }

        if ($subjectId !== null) {
            $popularPostsQuery->where('subject_id', $subjectId);
        }

        if ($postType !== '') {
            $popularPostsQuery->where('post_type', $postType);
        }

        if ($sort === 'newest') {
            $popularPostsQuery->latest();
        } else {
            $popularPostsQuery->orderByDesc('popular_likes_count')->latest();
        }

        $paginator = $popularPostsQuery
            ->paginate(self::FEED_PER_PAGE)
            ->withQueryString();

        $posts = $paginator->getCollection()
            ->map(function (Post $post) use ($followingIds) {
                $post->setAttribute('likes_count', (int) ($post->popular_likes_count ?? 0));

                return $this->serializationService->serialize($post, $followingIds);
            })
            ->values();

        return Inertia::render('LearningTrendsPage', [
            'posts'      => $posts,
            'pagination' => $this->paginationMeta($paginator),
            'activeRange' => $range,
            'activeSort' => $sort,
            'rangeOptions' => [
                'today' => __('popular.today'),
                'week'  => __('popular.week'),
                'month' => __('popular.month'),
                'all'   => __('popular.all'),
            ],
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

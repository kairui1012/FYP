<?php

namespace App\Http\Controllers;

use App\Services\LeaderboardService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardController extends Controller
{
    private const PER_PAGE = 10;

    public function __construct(private readonly LeaderboardService $leaderboardService) {}

    /**
     * Toggle whether the current user appears on the leaderboard.
     * Invalidates leaderboard caches after toggling visibility state.
     */
    public function toggleVisibility(Request $request): \Illuminate\Http\RedirectResponse
    {
        $this->leaderboardService->toggleVisibility($request->user());

        return back();
    }

    /**
     * Toggle whether the current user shows their leaderboard title badge.
     * Invalidates leaderboard caches after toggling badge visibility state.
     */
    public function toggleTitleBadge(Request $request): \Illuminate\Http\RedirectResponse
    {
        $this->leaderboardService->toggleTitleBadge($request->user());

        return back();
    }

    /**
     * Display the leaderboard with podium (top 3) and paginated ranked list.
     * Supports filtering by period (all_time, weekly, monthly). Returns current user's rank and points history.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'period' => ['nullable', 'string', Rule::in($this->leaderboardService->periods())],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $period = $validated['period'] ?? LeaderboardService::PERIOD_WEEKLY;
        $page = (int) ($validated['page'] ?? 1);
        $rankedUsers = collect($this->leaderboardService->cachedLeaderboard($period));

        $podium = $rankedUsers->take(3)->values();
        $listUsers = $rankedUsers->slice(3, LeaderboardService::MAX_RANK - 3)->values();

        $paginatedList = new LengthAwarePaginator(
            $listUsers->forPage($page, self::PER_PAGE)->values(),
            $listUsers->count(),
            self::PER_PAGE,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ],
        );

        return Inertia::render('leaderboard', [
            'leaderboard' => [
                'activePeriod' => $period,
                'periods' => $this->leaderboardService->periods(),
                'podium' => $podium,
                'rows' => $paginatedList,
                'currentUser' => $this->leaderboardService->currentUserRank($request->user(), $period),
                'pointsHistory' => $this->leaderboardService->currentUserPointsHistory($request->user()),
            ],
        ]);
    }
}

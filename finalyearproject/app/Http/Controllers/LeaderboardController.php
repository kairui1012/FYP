<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\LeaderboardTitleService;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardController extends Controller
{
    private const PERIOD_ALL_TIME = 'all_time';

    private const PERIOD_WEEKLY = 'weekly';

    private const PERIOD_MONTHLY = 'monthly';

    private const PER_PAGE = 10;

    private const MAX_RANK = 50;

    public function __construct(private readonly LeaderboardTitleService $leaderboardTitleService) {}

    public function toggleVisibility(Request $request): \Illuminate\Http\RedirectResponse
    {
        $user = $request->user();
        $user->show_on_leaderboard = ! $user->show_on_leaderboard;
        $user->save();
        Cache::forget("leaderboard.all_time.top-50");
        Cache::forget("leaderboard.weekly.top-50");
        Cache::forget("leaderboard.monthly.top-50");
        Cache::forget('leaderboard.titles.all-time.top-three');
        return back();
    }

    public function toggleTitleBadge(Request $request): \Illuminate\Http\RedirectResponse
    {
        $user = $request->user();
        $user->show_leaderboard_badge = ! $user->show_leaderboard_badge;
        $user->save();
        Cache::forget("leaderboard.all_time.top-50");
        Cache::forget("leaderboard.weekly.top-50");
        Cache::forget("leaderboard.monthly.top-50");
        Cache::forget('leaderboard.titles.all-time.top-three');
        return back();
    }

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'period' => ['nullable', 'string', Rule::in($this->periods())],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $period = $validated['period'] ?? self::PERIOD_WEEKLY;
        $page = (int) ($validated['page'] ?? 1);
        $rankedUsers = collect($this->cachedLeaderboard($period));

        $podium = $rankedUsers->take(3)->values();
        $listUsers = $rankedUsers->slice(3, self::MAX_RANK - 3)->values();

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

        return Inertia::render('Leaderboard', [
            'leaderboard' => [
                'activePeriod' => $period,
                'periods' => $this->periods(),
                'podium' => $podium,
                'rows' => $paginatedList,
                'currentUser' => $this->currentUserRank($request->user(), $period),
                'pointsHistory' => $this->currentUserPointsHistory($request->user()),
            ],
        ]);
    }

    /**
     * @return array<int, string>
     */
    private function periods(): array
    {
        return [
            self::PERIOD_ALL_TIME,
            self::PERIOD_WEEKLY,
            self::PERIOD_MONTHLY,
        ];
    }

    /**
     * @return array<int, array{id: int, name: string, avatar: string|null, points: int, rank: int, is_anonymous: bool, role: string|null, is_verified: bool, leaderboard_title: string|null}>
     */
    private function cachedLeaderboard(string $period): array
    {
        return Cache::remember(
            "leaderboard.{$period}.top-50",
            now()->addMinutes(5),
            fn () => $this->leaderboardQuery($period)
                ->limit(self::MAX_RANK)
                ->get()
                ->map(fn ($user, int $index) => [
                    'id' => (bool) $user->show_on_leaderboard ? (int) $user->id : 0,
                    'name' => (bool) $user->show_on_leaderboard ? $user->name : '',
                    'avatar' => (bool) $user->show_on_leaderboard ? $user->avatar : null,
                    'points' => (int) $user->points,
                    'rank' => $index + 1,
                    'is_anonymous' => ! (bool) $user->show_on_leaderboard,
                    'role' => (bool) $user->show_on_leaderboard ? $user->role : null,
                    'is_verified' => (bool) $user->show_on_leaderboard && (bool) $user->is_verified,
                    'leaderboard_title' => (bool) $user->show_on_leaderboard && $user->show_leaderboard_badge
                        ? $this->leaderboardTitleService->titleForUserId((int) $user->id)
                        : null,
                ])
                ->all(),
        );
    }

    private function currentUserRank(?User $user, string $period): ?array
    {
        if (! $user) {
            return null;
        }

        $leaderboardUser = User::query()
            ->select(['id', 'total_points', 'show_on_leaderboard', 'show_leaderboard_badge'])
            ->find($user->id);

        if (! $leaderboardUser) {
            return null;
        }

        $points = $this->pointsForUser($leaderboardUser, $period);

        return [
            'rank' => $this->rankForUser($leaderboardUser, $period, $points),
            'points' => $points,
            'pointsToNext' => $this->pointsToNextRank($leaderboardUser, $period, $points),
            'isAnonymous' => ! $leaderboardUser->show_on_leaderboard,
            'showLeaderboardBadge' => (bool) $leaderboardUser->show_leaderboard_badge,
        ];
    }

    private function pointsForUser(User $user, string $period): int
    {
        if ($period === self::PERIOD_ALL_TIME) {
            return (int) $user->total_points;
        }

        return (int) DB::table('points_transactions')
            ->where('user_id', $user->id)
            ->where('created_at', '>=', $this->periodStart($period))
            ->sum('points');
    }

    private function rankForUser(User $user, string $period, int $points): int
    {
        return (int) DB::query()
            ->fromSub($this->rankableUsersQuery($period), 'ranked_users')
            ->where(function (Builder $query) use ($user, $points) {
                $query
                    ->where('points', '>', $points)
                    ->orWhere(function (Builder $tieQuery) use ($user, $points) {
                        $tieQuery
                            ->where('points', $points)
                            ->where('id', '<', $user->id);
                    });
            })
            ->count() + 1;
    }

    private function pointsToNextRank(User $user, string $period, int $points): ?int
    {
        $nextRank = DB::query()
            ->fromSub($this->rankableUsersQuery($period), 'ranked_users')
            ->where(function (Builder $query) use ($user, $points) {
                $query
                    ->where('points', '>', $points)
                    ->orWhere(function (Builder $tieQuery) use ($user, $points) {
                        $tieQuery
                            ->where('points', $points)
                            ->where('id', '<', $user->id);
                    });
            })
            ->orderBy('points')
            ->orderByDesc('id')
            ->first();

        if (! $nextRank) {
            return null;
        }

        return max(0, (int) $nextRank->points - $points);
    }

    private function leaderboardQuery(string $period): Builder
    {
        return DB::query()
            ->fromSub($this->rankableUsersQuery($period), 'ranked_users')
            ->leftJoin('social_accounts', 'ranked_users.id', '=', 'social_accounts.user_id')
            ->select([
                'ranked_users.id',
                'ranked_users.name',
                'ranked_users.role',
                'ranked_users.is_verified',
                'ranked_users.points',
                'ranked_users.show_leaderboard_badge',
                'ranked_users.show_on_leaderboard',
                DB::raw('MAX(social_accounts.avatar) as avatar'),
            ])
            ->groupBy('ranked_users.id', 'ranked_users.name', 'ranked_users.role', 'ranked_users.is_verified', 'ranked_users.points', 'ranked_users.show_leaderboard_badge', 'ranked_users.show_on_leaderboard')
            ->orderByDesc('ranked_users.points')
            ->orderBy('ranked_users.id');
    }

    private function rankableUsersQuery(string $period): Builder
    {
        if ($period === self::PERIOD_ALL_TIME) {
            return DB::table('users')
                ->select([
                    'id',
                    'name',
                    'role',
                    'is_verified',
                    'show_leaderboard_badge',
                    'show_on_leaderboard',
                    DB::raw('total_points as points'),
                ]);
        }

        return DB::table('users')
            ->leftJoin('points_transactions', function (JoinClause $join) use ($period) {
                $join
                    ->on('users.id', '=', 'points_transactions.user_id')
                    ->where('points_transactions.created_at', '>=', $this->periodStart($period));
            })
            ->select([
                'users.id',
                'users.name',
                'users.role',
                'users.is_verified',
                'users.show_leaderboard_badge',
                'users.show_on_leaderboard',
                DB::raw('COALESCE(SUM(points_transactions.points), 0) as points'),
            ])
            ->groupBy('users.id', 'users.name', 'users.role', 'users.is_verified', 'users.show_leaderboard_badge', 'users.show_on_leaderboard');
    }

    /**
     * @return array<int, array{points: int, action: string, created_at: string}>
     */
    private function currentUserPointsHistory(?User $user): array
    {
        if (! $user) {
            return [];
        }

        return DB::table('points_transactions')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(30)
            ->get(['points', 'action', 'created_at'])
            ->map(fn ($t) => [
                'points' => (int) $t->points,
                'action' => $t->action,
                'created_at' => $t->created_at,
            ])
            ->all();
    }

    private function periodStart(string $period): ?\Carbon\CarbonInterface
    {
        return match ($period) {
            self::PERIOD_WEEKLY => now()->subDays(7),
            self::PERIOD_MONTHLY => now()->subDays(30),
            default => null,
        };
    }
}

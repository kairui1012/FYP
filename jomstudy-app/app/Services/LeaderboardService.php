<?php

namespace App\Services;

use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class LeaderboardService
{
    public const PERIOD_ALL_TIME = 'all_time';

    public const PERIOD_WEEKLY = 'weekly';

    public const PERIOD_MONTHLY = 'monthly';

    public const MAX_RANK = 50;

    public function __construct(private readonly LeaderboardTitleService $leaderboardTitleService) {}

    /** @return array<int, string> */
    public function periods(): array
    {
        return [self::PERIOD_ALL_TIME, self::PERIOD_WEEKLY, self::PERIOD_MONTHLY];
    }

    public function toggleVisibility(User $user): void
    {
        $user->forceFill(['show_on_leaderboard' => ! $user->show_on_leaderboard])->save();
        $this->clearCaches();
    }

    public function toggleTitleBadge(User $user): void
    {
        $user->forceFill(['show_leaderboard_badge' => ! $user->show_leaderboard_badge])->save();
        $this->clearCaches();
    }

    /** @return array<int, array<string, mixed>> */
    public function cachedLeaderboard(string $period): array
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

    public function currentUserRank(?User $user, string $period): ?array
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

    /** @return array<int, array{points: int, action: string, created_at: string}> */
    public function currentUserPointsHistory(?User $user): array
    {
        if (! $user) {
            return [];
        }

        return DB::table('points_transactions')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(30)
            ->get(['points', 'action', 'created_at'])
            ->map(fn ($transaction) => [
                'points' => (int) $transaction->points,
                'action' => $transaction->action,
                'created_at' => $transaction->created_at,
            ])
            ->all();
    }

    private function clearCaches(): void
    {
        foreach ($this->periods() as $period) {
            Cache::forget("leaderboard.{$period}.top-50");
        }

        Cache::forget('leaderboard.titles.all-time.top-three');
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
            ->where(fn (Builder $query) => $this->applyHigherRankFilter($query, $user, $points))
            ->count() + 1;
    }

    private function pointsToNextRank(User $user, string $period, int $points): ?int
    {
        $nextRank = DB::query()
            ->fromSub($this->rankableUsersQuery($period), 'ranked_users')
            ->where(fn (Builder $query) => $this->applyHigherRankFilter($query, $user, $points))
            ->orderBy('points')
            ->orderByDesc('id')
            ->first();

        return $nextRank ? max(0, (int) $nextRank->points - $points) : null;
    }

    private function applyHigherRankFilter(Builder $query, User $user, int $points): void
    {
        $query
            ->where('points', '>', $points)
            ->orWhere(function (Builder $tieQuery) use ($user, $points) {
                $tieQuery->where('points', $points)->where('id', '<', $user->id);
            });
    }

    private function leaderboardQuery(string $period): Builder
    {
        return DB::query()
            ->fromSub($this->rankableUsersQuery($period), 'ranked_users')
            ->leftJoin('social_accounts', 'ranked_users.id', '=', 'social_accounts.user_id')
            ->select([
                'ranked_users.id', 'ranked_users.name', 'ranked_users.role', 'ranked_users.is_verified',
                'ranked_users.points', 'ranked_users.show_leaderboard_badge', 'ranked_users.show_on_leaderboard',
                DB::raw('MAX(social_accounts.avatar) as avatar'),
            ])
            ->groupBy('ranked_users.id', 'ranked_users.name', 'ranked_users.role', 'ranked_users.is_verified', 'ranked_users.points', 'ranked_users.show_leaderboard_badge', 'ranked_users.show_on_leaderboard')
            ->orderByDesc('ranked_users.points')
            ->orderBy('ranked_users.id');
    }

    private function rankableUsersQuery(string $period): Builder
    {
        if ($period === self::PERIOD_ALL_TIME) {
            return DB::table('users')->select([
                'id', 'name', 'role', 'is_verified', 'show_leaderboard_badge', 'show_on_leaderboard',
                DB::raw('total_points as points'),
            ]);
        }

        return DB::table('users')
            ->leftJoin('points_transactions', function (JoinClause $join) use ($period) {
                $join->on('users.id', '=', 'points_transactions.user_id')
                    ->where('points_transactions.created_at', '>=', $this->periodStart($period));
            })
            ->select([
                'users.id', 'users.name', 'users.role', 'users.is_verified',
                'users.show_leaderboard_badge', 'users.show_on_leaderboard',
                DB::raw('COALESCE(SUM(points_transactions.points), 0) as points'),
            ])
            ->groupBy('users.id', 'users.name', 'users.role', 'users.is_verified', 'users.show_leaderboard_badge', 'users.show_on_leaderboard');
    }

    private function periodStart(string $period): ?CarbonInterface
    {
        return match ($period) {
            self::PERIOD_WEEKLY => now()->subDays(7),
            self::PERIOD_MONTHLY => now()->subDays(30),
            default => null,
        };
    }
}

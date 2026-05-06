<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class LeaderboardTitleService
{
    private const TITLES = [
        1 => 'champion',
        2 => 'runner_up',
        3 => 'third_place',
    ];

    public function titleForRank(int $rank): ?string
    {
        return self::TITLES[$rank] ?? null;
    }

    public function titleForUserId(?int $userId): ?string
    {
        if (! $userId) {
            return null;
        }

        return $this->allTimeTitlesByUserId()[$userId] ?? null;
    }

    /**
     * @return array<int, string>
     */
    private function allTimeTitlesByUserId(): array
    {
        return Cache::remember('leaderboard.titles.all-time.top-three', now()->addMinutes(5), function () {
            return DB::table('users')
                ->where('show_on_leaderboard', true)
                ->where('show_leaderboard_badge', true)
                ->where('total_points', '>', 0)
                ->orderByDesc('total_points')
                ->orderBy('id')
                ->limit(3)
                ->pluck('id')
                ->mapWithKeys(fn ($userId, int $index) => [
                    (int) $userId => $this->titleForRank($index + 1),
                ])
                ->all();
        });
    }
}
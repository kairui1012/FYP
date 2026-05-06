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

        $entry = $this->allTimeTitlesByUserId()[$userId] ?? null;

        if (! $entry) {
            return null;
        }

        return $entry['display'] ? $entry['title'] : null;
    }

    /**
     * Rank ownership is always based on the real top 3 (all users).
     * Visibility settings only control whether that owner's title is displayed.
     *
     * @return array<int, array{title: string, display: bool}>
     */
    private function allTimeTitlesByUserId(): array
    {
        return Cache::remember('leaderboard.titles.all-time.top-three', now()->addMinutes(5), function () {
            return DB::table('users')
                ->where('total_points', '>', 0)
                ->orderByDesc('total_points')
                ->orderBy('id')
                ->limit(3)
                ->get(['id', 'show_on_leaderboard', 'show_leaderboard_badge'])
                ->mapWithKeys(fn ($user, int $index) => [
                    (int) $user->id => [
                        'title' => $this->titleForRank($index + 1),
                        'display' => (bool) $user->show_on_leaderboard && (bool) $user->show_leaderboard_badge,
                    ],
                ])
                ->all();
        });
    }
}

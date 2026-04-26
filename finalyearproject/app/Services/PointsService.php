<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PointsService
{
    private const POINTS = [
        'question_asked' => 2,
        'answer_posted' => 5,
        'question_upvoted' => 5,
        'answer_upvoted' => 10,
        'best_answer_marked' => 15,
        'resource_uploaded' => 3,
        'resource_bookmarked' => 2,
        'follower_gained' => 5,
        'content_downvoted' => -2,
    ];

    public function award(User $user, string $action, Model $source, ?User $actor = null): bool
    {
        if ($this->isSelfAward($user, $actor)) {
            return false;
        }

        $points = $this->pointsFor($action);

        return DB::transaction(function () use ($user, $action, $source, $points) {
            if ($this->netPointsFor($user, $action, $source) !== 0) {
                return false;
            }

            $this->recordTransaction($user, $action, $source, $points);
            $this->applyPoints($user, $points);
            $this->clearLeaderboardCache();

            return true;
        });
    }

    public function revoke(User $user, string $action, Model $source): bool
    {
        return DB::transaction(function () use ($user, $action, $source) {
            $this->pointsFor($action);

            $netPoints = $this->netPointsFor($user, $action, $source);

            if ($netPoints === 0) {
                return false;
            }

            $reversalPoints = -$netPoints;

            $this->recordTransaction($user, $action, $source, $reversalPoints);
            $this->applyPoints($user, $reversalPoints);
            $this->clearLeaderboardCache();

            return true;
        });
    }

    private function pointsFor(string $action): int
    {
        if (! array_key_exists($action, self::POINTS)) {
            throw new InvalidArgumentException("Unsupported points action [{$action}].");
        }

        return self::POINTS[$action];
    }

    private function isSelfAward(User $user, ?User $actor): bool
    {
        return $actor !== null && $actor->getKey() === $user->getKey();
    }

    private function netPointsFor(User $user, string $action, Model $source): int
    {
        return (int) DB::table('points_transactions')
            ->where('user_id', $user->getKey())
            ->where('action', $action)
            ->where('source_type', $source->getMorphClass())
            ->where('source_id', $source->getKey())
            ->lockForUpdate()
            ->sum('points');
    }

    private function recordTransaction(User $user, string $action, Model $source, int $points): void
    {
        DB::table('points_transactions')->insert([
            'user_id' => $user->getKey(),
            'points' => $points,
            'action' => $action,
            'source_type' => $source->getMorphClass(),
            'source_id' => $source->getKey(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function applyPoints(User $user, int $points): void
    {
        DB::table('users')
            ->where('id', $user->getKey())
            ->increment('total_points', $points);
    }

    private function clearLeaderboardCache(): void
    {
        foreach (['all_time', 'weekly', 'monthly'] as $period) {
            Cache::forget("leaderboard.{$period}.top-50");
        }

        Cache::forget('leaderboard.titles.all-time.top-three');
    }
}

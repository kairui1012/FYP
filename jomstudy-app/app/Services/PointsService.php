<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * PointsService
 *
 * Handles awarding and revoking user points. Point values are defined in
 * the `POINTS` constant. Key design considerations: anti-abuse (only one
 * award per same source/action), reversibility (record inverse transactions),
 * transactional and row-lock safety for concurrency, and leaderboard cache
 * invalidation after changes.
 *
 * Typically injected into controllers (e.g. `CommentController`,
 * `LikeController`, `PostCreateController`) and covered by unit tests
 * (`tests/Unit/PointsServiceTest.php`).
 */
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

    /**
     * Award points to a user for a specific action and source.
     *
     * - Prevents self-awarding.
     * - Ensures idempotence: if a transaction for the same user/action/source
     *   already exists (net points != 0) it will not award again.
     * - Records a points transaction, updates the user's total, and clears
     *   leaderboard caches inside a DB transaction.
     *
     * @return bool True when points were awarded, false otherwise.
     */
    public function award(User $user, string $action, Model $source, ?User $actor = null): bool
    {
        // Prevent users from awarding points to themselves.
        if ($this->isSelfAward($user, $actor)) {
            return false;
        }

        $points = $this->pointsFor($action);

        return DB::transaction(function () use ($user, $action, $source, $points) {
            // If there is already a non-zero net points record for this
                // user/action/source, we consider the action already applied.
            if ($this->netPointsFor($user, $action, $source) !== 0) {
                return false;
            }

            // Persist the transaction and update aggregates.
            $this->recordTransaction($user, $action, $source, $points);
            $this->applyPoints($user, $points);
            $this->clearLeaderboardCache();

            return true;
        });
    }

    /**
     * Revoke previously awarded points for the given user/action/source.
     *
     * If there are no net points for the given tuple this is a no-op and
     * returns false. Otherwise the method records a reversal transaction
     * (negative points), updates the user's total, and clears caches.
     *
     * @return bool True when points were revoked, false otherwise.
     */
    public function revoke(User $user, string $action, Model $source): bool
    {
        return DB::transaction(function () use ($user, $action, $source) {
            // Validate action exists (throws if unknown).
            $this->pointsFor($action);

            $netPoints = $this->netPointsFor($user, $action, $source);

            // Nothing to revoke.
            if ($netPoints === 0) {
                return false;
            }

            // Record the inverse transaction and update user aggregates.
            $reversalPoints = -$netPoints;

            $this->recordTransaction($user, $action, $source, $reversalPoints);
            $this->applyPoints($user, $reversalPoints);
            $this->clearLeaderboardCache();

            return true;
        });
    }

    /**
     * Return configured points for a given action or throw if unsupported.
     */
    private function pointsFor(string $action): int
    {
        if (! array_key_exists($action, self::POINTS)) {
            throw new InvalidArgumentException("Unsupported points action [{$action}].");
        }

        return self::POINTS[$action];
    }

    /**
     * Determine whether the actor is the same as the target user.
     */
    private function isSelfAward(User $user, ?User $actor): bool
    {
        return $actor !== null && $actor->getKey() === $user->getKey();
    }

    /**
     * Compute the net points already recorded for the given user/action/source.
     * Uses a FOR UPDATE lock to ensure concurrent safety when calculating
     * and modifying points inside a transaction.
     */
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

    /**
     * Persist a points transaction row backing the award/revoke operation.
     */
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

    /**
     * Apply the given points delta to the user's total_points column.
     */
    private function applyPoints(User $user, int $points): void
    {
        DB::table('users')
            ->where('id', $user->getKey())
            ->increment('total_points', $points);
    }

    /**
     * Clear leaderboard related caches after any points change so that
     * leaderboards reflect fresh values.
     */
    private function clearLeaderboardCache(): void
    {
        foreach (['all_time', 'weekly', 'monthly'] as $period) {
            Cache::forget("leaderboard.{$period}.top-50");
        }

        Cache::forget('leaderboard.titles.all-time.top-three');
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\User;
use App\Services\PointsService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class CommentLikeController extends Controller
{
    public function __construct(private readonly PointsService $pointsService) {}

    /**
     * Toggle vote on a comment (upvote/downvote/wrong if vote column exists, else simple like).
     * Toggle same vote type to remove. Syncs points to comment owner.
     */
    public function toggle(Request $request, Comment $comment): JsonResponse
    {
        $supportsVoteColumn = $this->supportsVoteColumn();

        $validated = $request->validate([
            'direction' => $supportsVoteColumn
                ? ['required', 'string', 'in:up,down,wrong']
                : ['nullable', 'string', 'in:up,down,wrong'],
        ]);

        $desiredVote = match ($validated['direction'] ?? 'up') {
            'down'  => -1,
            'wrong' => -2,
            default => 1,
        };

        $existingLike = CommentLike::query()
            ->where('user_id', $request->user()->id)
            ->where('comment_id', $comment->id)
            ->first();

        $previousVote = $existingLike
            ? (int) ($existingLike->vote ?? 1)
            : null;
        $finalVote = null;
        $pointsSource = null;

        if ($supportsVoteColumn) {
            try {
                if ($existingLike && (int) $existingLike->vote === $desiredVote) {
                    $pointsSource = $existingLike;
                    $existingLike->delete();
                } else {
                    $pointsSource = CommentLike::query()->updateOrCreate(
                        [
                            'user_id' => $request->user()->id,
                            'comment_id' => $comment->id,
                        ],
                        [
                            'vote' => $desiredVote,
                        ],
                    );

                    $finalVote = $desiredVote;
                }

                $upvotesCount = CommentLike::query()
                    ->where('comment_id', $comment->id)
                    ->where('vote', 1)
                    ->count();

                $downvotesCount = CommentLike::query()
                    ->where('comment_id', $comment->id)
                    ->where('vote', -1)
                    ->count();

                $wrongVotesCount = CommentLike::query()
                    ->where('comment_id', $comment->id)
                    ->where('vote', -2)
                    ->count();
            } catch (QueryException $exception) {
                if (! $this->isVoteColumnMissingException($exception)) {
                    throw $exception;
                }

                [$finalVote, $upvotesCount, $downvotesCount, $pointsSource] = $this->toggleLegacyLike($request, $comment, $existingLike);
            }
        } else {
            [$finalVote, $upvotesCount, $downvotesCount, $pointsSource] = $this->toggleLegacyLike($request, $comment, $existingLike);
        }

        $wrongVotesCount = $wrongVotesCount ?? 0;
        $this->syncLeaderboardVotePoints(
            $comment,
            $request->user(),
            $pointsSource,
            $previousVote,
            $finalVote,
        );

        return response()->json([
            'vote' => $finalVote,
            'is_upvoted' => $finalVote === 1,
            'is_downvoted' => $finalVote === -1,
            'is_wrong' => $finalVote === -2,
            'liked' => $finalVote === 1,
            'likes_count' => $upvotesCount,
            'upvotes_count' => $upvotesCount,
            'downvotes_count' => $downvotesCount,
            'wrong_votes_count' => $wrongVotesCount,
            'score' => $upvotesCount - $downvotesCount - (2 * $wrongVotesCount),
        ]);
    }

    /**
     * Check if comment_likes table supports voting (upvote/downvote/wrong).
     */
    private function supportsVoteColumn(): bool
    {
        try {
            return Schema::hasColumn('comment_likes', 'vote');
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Detect if query exception is due to missing vote column.
     */
    private function isVoteColumnMissingException(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, "unknown column 'vote'")
            || str_contains($message, 'unknown column `vote`');
    }

    /**
     * Toggle legacy like (before vote column existed).
     * @return array{0:int|null,1:int,2:int,3:CommentLike|null}
     */
    private function toggleLegacyLike(Request $request, Comment $comment, ?CommentLike $existingLike): array
    {
        $finalVote = null;
        $pointsSource = $existingLike;

        if ($existingLike) {
            $existingLike->delete();
        } else {
            $pointsSource = CommentLike::query()->create([
                'user_id' => $request->user()->id,
                'comment_id' => $comment->id,
            ]);
            $finalVote = 1;
        }

        $upvotesCount = CommentLike::query()
            ->where('comment_id', $comment->id)
            ->count();

        return [$finalVote, $upvotesCount, 0, $pointsSource];
    }

    /**
     * Sync points to comment owner when vote changes.
     * Revokes previous vote points and awards new vote points.
     */
    private function syncLeaderboardVotePoints(
        Comment $comment,
        User $actor,
        ?CommentLike $source,
        ?int $previousVote,
        ?int $finalVote,
    ): void {
        if (! $source) {
            return;
        }

        $comment->loadMissing('user:id');
        $owner = $comment->user;

        if (! $owner || $previousVote === $finalVote) {
            return;
        }

        if ($previousVote !== null) {
            $previousAction = $this->leaderboardActionForVote($previousVote);

            if ($previousAction) {
                $this->pointsService->revoke($owner, $previousAction, $source);
            }
        }

        if ($finalVote !== null) {
            $finalAction = $this->leaderboardActionForVote($finalVote);

            if ($finalAction) {
                $this->pointsService->award($owner, $finalAction, $source, $actor);
            }
        }
    }

    /**
     * Map vote type to leaderboard action for points.
     */
    private function leaderboardActionForVote(int $vote): ?string
    {
        return match ($vote) {
            1 => 'answer_upvoted',
            -1, -2 => 'content_downvoted',
            default => null,
        };
    }
}

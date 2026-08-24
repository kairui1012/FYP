<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Schema;

class CommentVoteService
{
    public function __construct(private readonly PointsService $pointsService) {}

    public function supportsVoteColumn(): bool
    {
        try {
            return Schema::hasColumn('comment_likes', 'vote');
        } catch (\Throwable) {
            return false;
        }
    }

    /** @return array<string, int|bool|null> */
    public function toggle(User $actor, Comment $comment, int $desiredVote, bool $supportsVoteColumn): array
    {
        $existingLike = CommentLike::query()
            ->where('user_id', $actor->id)
            ->where('comment_id', $comment->id)
            ->first();

        $previousVote = $existingLike ? (int) ($existingLike->vote ?? 1) : null;
        $finalVote = null;
        $pointsSource = null;

        if ($supportsVoteColumn) {
            try {
                if ($existingLike && (int) $existingLike->vote === $desiredVote) {
                    $pointsSource = $existingLike;
                    $existingLike->delete();
                } else {
                    $pointsSource = CommentLike::query()->updateOrCreate(
                        ['user_id' => $actor->id, 'comment_id' => $comment->id],
                        ['vote' => $desiredVote],
                    );
                    $finalVote = $desiredVote;
                }

                $counts = $this->voteCounts($comment);
            } catch (QueryException $exception) {
                if (! $this->isVoteColumnMissingException($exception)) {
                    throw $exception;
                }

                [$finalVote, $counts, $pointsSource] = $this->toggleLegacyLike($actor, $comment, $existingLike);
            }
        } else {
            [$finalVote, $counts, $pointsSource] = $this->toggleLegacyLike($actor, $comment, $existingLike);
        }

        $this->syncLeaderboardVotePoints($comment, $actor, $pointsSource, $previousVote, $finalVote);

        $upvotes = $counts['upvotes'];
        $downvotes = $counts['downvotes'];
        $wrongVotes = $counts['wrong'];

        return [
            'vote' => $finalVote,
            'is_upvoted' => $finalVote === 1,
            'is_downvoted' => $finalVote === -1,
            'is_wrong' => $finalVote === -2,
            'liked' => $finalVote === 1,
            'likes_count' => $upvotes,
            'upvotes_count' => $upvotes,
            'downvotes_count' => $downvotes,
            'wrong_votes_count' => $wrongVotes,
            'score' => $upvotes - $downvotes - (2 * $wrongVotes),
        ];
    }

    /** @return array{upvotes: int, downvotes: int, wrong: int} */
    private function voteCounts(Comment $comment): array
    {
        $counts = CommentLike::query()
            ->where('comment_id', $comment->id)
            ->selectRaw('vote, COUNT(*) as aggregate')
            ->groupBy('vote')
            ->pluck('aggregate', 'vote');

        return [
            'upvotes' => (int) ($counts[1] ?? 0),
            'downvotes' => (int) ($counts[-1] ?? 0),
            'wrong' => (int) ($counts[-2] ?? 0),
        ];
    }

    private function isVoteColumnMissingException(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, "unknown column 'vote'")
            || str_contains($message, 'unknown column `vote`');
    }

    /** @return array{0: int|null, 1: array{upvotes: int, downvotes: int, wrong: int}, 2: CommentLike|null} */
    private function toggleLegacyLike(User $actor, Comment $comment, ?CommentLike $existingLike): array
    {
        $finalVote = null;
        $pointsSource = $existingLike;

        if ($existingLike) {
            $existingLike->delete();
        } else {
            $pointsSource = CommentLike::query()->create([
                'user_id' => $actor->id,
                'comment_id' => $comment->id,
            ]);
            $finalVote = 1;
        }

        return [
            $finalVote,
            ['upvotes' => CommentLike::query()->where('comment_id', $comment->id)->count(), 'downvotes' => 0, 'wrong' => 0],
            $pointsSource,
        ];
    }

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

        $previousAction = $previousVote !== null ? $this->leaderboardActionForVote($previousVote) : null;
        if ($previousAction) {
            $this->pointsService->revoke($owner, $previousAction, $source);
        }

        $finalAction = $finalVote !== null ? $this->leaderboardActionForVote($finalVote) : null;
        if ($finalAction) {
            $this->pointsService->award($owner, $finalAction, $source, $actor);
        }
    }

    private function leaderboardActionForVote(int $vote): ?string
    {
        return match ($vote) {
            1 => 'answer_upvoted',
            -1, -2 => 'content_downvoted',
            default => null,
        };
    }
}

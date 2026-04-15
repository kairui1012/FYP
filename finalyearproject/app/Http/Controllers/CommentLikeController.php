<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\CommentLike;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class CommentLikeController extends Controller
{
    public function toggle(Request $request, Comment $comment): JsonResponse
    {
        $supportsVoteColumn = $this->supportsVoteColumn();

        $validated = $request->validate([
            'direction' => $supportsVoteColumn
                ? ['required', 'string', 'in:up,down']
                : ['nullable', 'string', 'in:up,down'],
        ]);

        $desiredVote = $supportsVoteColumn && ($validated['direction'] ?? 'up') === 'down' ? -1 : 1;

        $existingLike = CommentLike::query()
            ->where('user_id', $request->user()->id)
            ->where('comment_id', $comment->id)
            ->first();

        $finalVote = null;

        if ($supportsVoteColumn) {
            try {
                if ($existingLike && (int) $existingLike->vote === $desiredVote) {
                    $existingLike->delete();
                } else {
                    CommentLike::query()->updateOrCreate(
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
            } catch (QueryException $exception) {
                if (! $this->isVoteColumnMissingException($exception)) {
                    throw $exception;
                }

                [$finalVote, $upvotesCount, $downvotesCount] = $this->toggleLegacyLike($request, $comment, $existingLike);
            }
        } else {
            [$finalVote, $upvotesCount, $downvotesCount] = $this->toggleLegacyLike($request, $comment, $existingLike);
        }

        return response()->json([
            'vote' => $finalVote,
            'is_upvoted' => $finalVote === 1,
            'is_downvoted' => $finalVote === -1,
            'liked' => $finalVote === 1,
            'likes_count' => $upvotesCount,
            'upvotes_count' => $upvotesCount,
            'downvotes_count' => $downvotesCount,
            'score' => $upvotesCount - $downvotesCount,
        ]);
    }

    private function supportsVoteColumn(): bool
    {
        try {
            return Schema::hasColumn('comment_likes', 'vote');
        } catch (\Throwable) {
            return false;
        }
    }

    private function isVoteColumnMissingException(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, "unknown column 'vote'")
            || str_contains($message, 'unknown column `vote`');
    }

    /** @return array{0:int|null,1:int,2:int} */
    private function toggleLegacyLike(Request $request, Comment $comment, ?CommentLike $existingLike): array
    {
        $finalVote = null;

        if ($existingLike) {
            $existingLike->delete();
        } else {
            CommentLike::query()->create([
                'user_id' => $request->user()->id,
                'comment_id' => $comment->id,
            ]);
            $finalVote = 1;
        }

        $upvotesCount = CommentLike::query()
            ->where('comment_id', $comment->id)
            ->count();

        return [$finalVote, $upvotesCount, 0];
    }
}

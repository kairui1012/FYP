<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Services\CommentVoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentLikeController extends Controller
{
    public function __construct(private readonly CommentVoteService $commentVoteService) {}

    /**
     * Toggle vote on a comment (upvote/downvote/wrong if vote column exists, else simple like).
     * Toggle same vote type to remove. Syncs points to comment owner.
     */
    public function toggle(Request $request, Comment $comment): JsonResponse
    {
        $supportsVoteColumn = $this->commentVoteService->supportsVoteColumn();

        $validated = $request->validate([
            'direction' => $supportsVoteColumn
                ? ['required', 'string', 'in:up,down,wrong']
                : ['nullable', 'string', 'in:up,down,wrong'],
        ]);

        $desiredVote = match ($validated['direction'] ?? 'up') {
            'down' => -1,
            'wrong' => -2,
            default => 1,
        };

        return response()->json($this->commentVoteService->toggle(
            $request->user(),
            $comment,
            $desiredVote,
            $supportsVoteColumn,
        ));
    }
}

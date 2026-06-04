<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Post;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Schema;

trait HandlesPostComments
{
    // Eagerly load post relations with comments, including user info and votes/likes based on feature support
    private function loadPostWithComments(Post $post, ?int $userId, bool $supportsCommentVotes): void
    {
        $post->load([
            'user:id,name,role,is_verified',
            'user.socialAccounts:id,user_id,avatar',
            'subject:id,name',
            'lesson:id,title,sequence',
            'language:id,code,name',
            'comments' => function ($query) use ($userId, $supportsCommentVotes) {
                $query->with([
                    'user:id,name,is_verified',
                    'user.socialAccounts:id,user_id,avatar',
                    'parent:id,user_id',
                    'parent.user:id,name,is_verified',
                    'parent.user.socialAccounts:id,user_id,avatar',
                ]);

                if ($supportsCommentVotes) {
                    $query->with([
                        'votes:id,user_id,comment_id,vote',
                    ])
                        ->withCount([
                            'votes as upvotes_count' => fn ($voteQuery) => $voteQuery->where('vote', 1),
                            'votes as downvotes_count' => fn ($voteQuery) => $voteQuery->where('vote', -1),
                            'votes as wrong_votes_count' => fn ($voteQuery) => $voteQuery->where('vote', -2),
                        ])
                        ->withExists([
                            'votes as is_upvoted' => fn ($voteQuery) => $voteQuery->where('user_id', $userId)->where('vote', 1),
                            'votes as is_downvoted' => fn ($voteQuery) => $voteQuery->where('user_id', $userId)->where('vote', -1),
                            'votes as is_wrong' => fn ($voteQuery) => $voteQuery->where('user_id', $userId)->where('vote', -2),
                        ]);
                } else {
                    $query->withCount('likes')
                        ->withExists([
                            'likes as is_liked' => fn ($likeQuery) => $likeQuery->where('user_id', $userId),
                        ]);
                }
            },
        ])
            ->loadCount(['likes', 'comments', 'bookmarkItems as saves_count']);
    }

    // Check if the comment_likes table has been migrated to support vote types (upvote, downvote, wrong)
    private function supportsCommentVotes(): bool
    {
        try {
            return Schema::hasColumn('comment_likes', 'vote');
        } catch (\Throwable) {
            return false;
        }
    }

    // Detect if a query exception is due to the vote column not existing in comment_likes table
    private function isVoteColumnMissingException(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, "unknown column 'vote'")
            || str_contains($message, 'unknown column `vote`');
    }
}

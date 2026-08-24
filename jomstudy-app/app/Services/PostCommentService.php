<?php

namespace App\Services;

use App\Models\Post;
use App\Services\Traits\LoadsPostComments;
use Illuminate\Database\QueryException;

class PostCommentService
{
    use LoadsPostComments;

    public function load(Post $post, ?int $userId, bool $supportsVotes): void
    {
        $this->loadPostWithComments($post, $userId, $supportsVotes);
    }

    public function supportsVotes(): bool
    {
        return $this->supportsCommentVotes();
    }

    public function isMissingVoteColumn(QueryException $exception): bool
    {
        return $this->isVoteColumnMissingException($exception);
    }
}

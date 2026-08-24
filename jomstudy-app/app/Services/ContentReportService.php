<?php

namespace App\Services;

use App\Jobs\QueueCommentReportForModeration;
use App\Jobs\QueuePostReportForModeration;
use App\Models\Comment;
use App\Models\CommentReport;
use App\Models\Post;
use App\Models\PostReport;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Throwable;

class ContentReportService
{
    public const UNAVAILABLE = 'unavailable';

    public const DUPLICATE = 'duplicate';

    public const SUBMITTED = 'submitted';

    public function reportComment(User $user, Comment $comment, ?string $reason): string
    {
        if (! Schema::hasTable('comment_reports')) {
            return self::UNAVAILABLE;
        }

        if (CommentReport::query()->where('user_id', $user->id)->where('comment_id', $comment->id)->exists()) {
            return self::DUPLICATE;
        }

        $attributes = [
            'user_id' => $user->id,
            'comment_id' => $comment->id,
            'reason' => $reason ?? 'inappropriate',
        ];

        if (Schema::hasColumn('comment_reports', 'status')) {
            $attributes['status'] = 'pending';
        }

        if (Schema::hasColumn('comment_reports', 'moderation_queued_at')) {
            $attributes['moderation_queued_at'] = now();
        }

        $report = CommentReport::query()->create($attributes);
        $this->dispatchCommentModeration($report->id);

        return self::SUBMITTED;
    }

    public function reportPost(User $user, Post $post, ?string $reason): string
    {
        if (! Schema::hasTable('post_reports')) {
            return self::UNAVAILABLE;
        }

        if (PostReport::query()->where('user_id', $user->id)->where('post_id', $post->id)->exists()) {
            return self::DUPLICATE;
        }

        $attributes = [
            'user_id' => $user->id,
            'post_id' => $post->id,
            'reason' => $reason ?? 'inappropriate',
        ];

        if (Schema::hasColumn('post_reports', 'status')) {
            $attributes['status'] = 'pending';
        }

        if (Schema::hasColumn('post_reports', 'moderation_queued_at')) {
            $attributes['moderation_queued_at'] = now();
        }

        $report = PostReport::query()->create($attributes);
        $this->dispatchPostModeration($report->id);

        return self::SUBMITTED;
    }

    private function dispatchCommentModeration(int $reportId): void
    {
        try {
            QueueCommentReportForModeration::dispatch($reportId);
        } catch (Throwable $exception) {
            report($exception);
            QueueCommentReportForModeration::dispatchSync($reportId);
        }
    }

    private function dispatchPostModeration(int $reportId): void
    {
        try {
            QueuePostReportForModeration::dispatch($reportId);
        } catch (Throwable $exception) {
            report($exception);
            QueuePostReportForModeration::dispatchSync($reportId);
        }
    }
}

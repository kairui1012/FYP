<?php

namespace App\Jobs;

use App\Models\CommentReport;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class QueueCommentReportForModeration implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $reportId)
    {
        $this->onQueue('moderation');
    }

    public function handle(): void
    {
        $report = CommentReport::query()->find($this->reportId);

        if (! $report) {
            return;
        }

        if (Schema::hasColumn('comment_reports', 'status') && ! $report->status) {
            $report->status = 'pending';
        }

        if (
            Schema::hasColumn('comment_reports', 'moderation_queued_at')
            && ! $report->moderation_queued_at
        ) {
            $report->moderation_queued_at = now();
        }

        if ($report->isDirty()) {
            $report->save();
        }

        Log::info('Comment report queued for moderation.', [
            'report_id' => $report->id,
            'comment_id' => $report->comment_id,
            'reporter_id' => $report->user_id,
        ]);
    }
}


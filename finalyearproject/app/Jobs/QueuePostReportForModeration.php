<?php

namespace App\Jobs;

use App\Models\PostReport;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class QueuePostReportForModeration implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $reportId)
    {
        $this->onQueue('moderation');
    }

    public function handle(): void
    {
        $report = PostReport::query()->find($this->reportId);

        if (! $report) {
            return;
        }

        if (Schema::hasColumn('post_reports', 'status') && ! $report->status) {
            $report->status = 'pending';
        }

        if (
            Schema::hasColumn('post_reports', 'moderation_queued_at')
            && ! $report->moderation_queued_at
        ) {
            $report->moderation_queued_at = now();
        }

        if ($report->isDirty()) {
            $report->save();
        }

        Log::info('Post report queued for moderation.', [
            'report_id' => $report->id,
            'post_id' => $report->post_id,
            'reporter_id' => $report->user_id,
        ]);
    }
}


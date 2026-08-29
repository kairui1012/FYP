<?php

namespace App\Services;

use App\Models\TeacherApplication;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminService
{
    /** @return array{users: mixed, pagination: array<string, mixed>} */
    public function users(int $perPage = 20): array
    {
        $paginator = User::query()
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
        $users = $paginator->getCollection()->map(fn (User $user) => [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
            'role' => $user->role ?? 'student', 'points' => $user->points ?? 0,
            'is_blocked' => (bool) $user->is_blocked, 'is_verified' => (bool) $user->is_verified,
            'created_at' => $user->created_at?->toDateString(),
        ]);

        return ['users' => $users, 'pagination' => $this->paginationMeta($paginator)];
    }

    /** @return array{reports: mixed, pagination: array<string, mixed>} */
    public function reports(int $perPage = 20): array
    {
        $comments = DB::table('comment_reports as reports')
            ->leftJoin('users as reporters', 'reporters.id', '=', 'reports.user_id')
            ->leftJoin('comments as targets', 'targets.id', '=', 'reports.comment_id')
            ->leftJoin('users as authors', 'authors.id', '=', 'targets.user_id')
            ->when(Schema::hasColumn('comment_reports', 'status'), fn ($query) => $query->where('reports.status', 'pending'))
            ->select([
                'reports.id', 'reports.reason', 'reporters.name as reporter_name',
                'reporters.email as reporter_email', 'reports.comment_id as target_id',
                'targets.content as target_body', 'authors.name as target_author', 'reports.created_at',
            ])
            ->selectRaw("'comment' as report_type")
            ->selectRaw(Schema::hasColumn('comment_reports', 'status') ? 'reports.status' : "'pending' as status");

        $combined = $comments;
        if (Schema::hasTable('post_reports')) {
            $posts = DB::table('post_reports as reports')
                ->leftJoin('users as reporters', 'reporters.id', '=', 'reports.user_id')
                ->leftJoin('posts as targets', 'targets.id', '=', 'reports.post_id')
                ->leftJoin('users as authors', 'authors.id', '=', 'targets.user_id')
                ->when(Schema::hasColumn('post_reports', 'status'), fn ($query) => $query->where('reports.status', 'pending'))
                ->select([
                    'reports.id', 'reports.reason', 'reporters.name as reporter_name',
                    'reporters.email as reporter_email', 'reports.post_id as target_id',
                    'targets.title as target_body', 'authors.name as target_author', 'reports.created_at',
                ])
                ->selectRaw("'post' as report_type")
                ->selectRaw(Schema::hasColumn('post_reports', 'status') ? 'reports.status' : "'pending' as status");
            $combined->unionAll($posts);
        }

        $paginator = DB::query()
            ->fromSub($combined, 'combined_reports')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();
        $reports = $paginator->getCollection()->map(fn ($report) => [
            'id' => (int) $report->id,
            'report_type' => $report->report_type,
            'reason' => $report->reason,
            'reporter_name' => $report->reporter_name,
            'reporter_email' => $report->reporter_email,
            'target_id' => (int) $report->target_id,
            'target_body' => $report->target_body,
            'target_author' => $report->target_author,
            'status' => $report->status,
            'created_at' => $report->created_at ? Carbon::parse($report->created_at)->toDateString() : null,
        ]);

        return ['reports' => $reports, 'pagination' => $this->paginationMeta($paginator)];
    }

    public function delete(Model $model): void
    {
        $model->delete();
    }

    /** @return array{applications: mixed, pagination: array<string, mixed>} */
    public function teacherApplications(int $perPage = 20): array
    {
        $paginator = TeacherApplication::query()
            ->with(['user:id,name,email,role,is_verified', 'documents'])
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
        $applications = $paginator->getCollection()->map(fn ($application) => [
            'id' => $application->id, 'user_id' => $application->user_id,
            'user_name' => $application->user?->name, 'user_email' => $application->user?->email,
            'user_role' => $application->user?->role ?? 'student',
            'user_verified' => (bool) ($application->user?->is_verified ?? false),
            'status' => $application->status, 'admin_note' => $application->admin_note,
            'documents' => $application->documents->map(fn ($document) => [
                'id' => $document->id, 'original_name' => $document->original_name,
                'download_url' => route('admin.verification-documents.download', $document->id),
            ])->values()->all(),
            'created_at' => $application->created_at?->toDateString(),
        ]);

        return ['applications' => $applications, 'pagination' => $this->paginationMeta($paginator)];
    }

    public function approve(TeacherApplication $application): void
    {
        $application->update(['status' => 'approved']);
        $application->user?->update(['role' => 'teacher']);
    }

    public function reject(TeacherApplication $application, ?string $note): void
    {
        $application->update(['status' => 'rejected', 'admin_note' => $note]);
    }

    public function toggleVerification(User $user): void
    {
        $user->update(['is_verified' => ! $user->is_verified]);
        $this->clearLeaderboardCache();
    }

    public function toggleBlock(User $user): void
    {
        $user->update(['is_blocked' => ! $user->is_blocked]);
    }

    public function updateRole(User $user, string $role): void
    {
        $updates = ['role' => $role];
        if ($role !== 'teacher' && $user->is_verified) {
            $updates['is_verified'] = false;
        }
        $user->update($updates);
        $this->clearLeaderboardCache();
    }

    private function clearLeaderboardCache(): void
    {
        foreach (['all_time', 'weekly', 'monthly'] as $period) {
            Cache::forget("leaderboard.{$period}.top-50");
        }
        Cache::forget('leaderboard.titles.all-time.top-three');
    }

    /** @return array<string, int|string|null> */
    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'prev_page_url' => $paginator->previousPageUrl(),
            'next_page_url' => $paginator->nextPageUrl(),
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\CommentReport;
use App\Models\Comment;
use App\Models\Post;
use App\Models\PostReport;
use App\Models\TeacherApplication;
use App\Models\TeacherVerificationDocument;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class AdminController extends Controller
{
    /**
     * List all users with basic info (newest first).
     */
    public function users()
    {
        $users = User::with('profile')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($u) => [
                'id'          => $u->id,
                'name'        => $u->name,
                'email'       => $u->email,
                'role'        => $u->role ?? 'student',
                'points'      => $u->points ?? 0,
                'is_blocked'  => (bool) $u->is_blocked,
                'is_verified' => (bool) $u->is_verified,
                'created_at'  => $u->created_at?->toDateString(),
            ]);

        return Inertia::render('admin/AdminUsers', compact('users'));
    }

    /**
     * List all comment and post reports (newest first).
     * Filters by 'pending' status if column exists (backward compat check).
     */
    public function reports()
    {
        // Fetch comment reports (pending only if status column exists)
        $commentReportsQuery = CommentReport::with(['user:id,name,email', 'comment.user:id,name'])
            ->orderBy('created_at', 'desc');

        if (Schema::hasColumn('comment_reports', 'status')) {
            $commentReportsQuery->where('status', 'pending');
        }

        $commentReports = $commentReportsQuery
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'report_type' => 'comment',
                'reason' => $r->reason,
                'reporter_name' => $r->user?->name,
                'reporter_email' => $r->user?->email,
                'target_id' => $r->comment_id,
                'target_body' => $r->comment?->content,
                'target_author' => $r->comment?->user?->name,
                'status' => $r->status ?? 'pending',
                'created_at' => $r->created_at?->toDateString(),
            ]);

        // Fetch post reports (if post_reports table exists; pending only if status column exists)
        $postReports = collect();
        if (Schema::hasTable('post_reports')) {
            $postReportsQuery = PostReport::with(['user:id,name,email', 'post.user:id,name'])
                ->orderBy('created_at', 'desc');

            if (Schema::hasColumn('post_reports', 'status')) {
                $postReportsQuery->where('status', 'pending');
            }

            $postReports = $postReportsQuery
                ->get()
                ->map(fn ($r) => [
                    'id' => $r->id,
                    'report_type' => 'post',
                    'reason' => $r->reason,
                    'reporter_name' => $r->user?->name,
                    'reporter_email' => $r->user?->email,
                    'target_id' => $r->post_id,
                    'target_body' => $r->post?->title,
                    'target_author' => $r->post?->user?->name,
                    'status' => $r->status ?? 'pending',
                    'created_at' => $r->created_at?->toDateString(),
                ]);
        }

        // Merge comment and post reports, sort newest first
        $reports = $commentReports
            ->concat($postReports)
            ->sortByDesc('created_at')
            ->values();

        return Inertia::render('admin/AdminReports', compact('reports'));
    }

    /**
     * Dismiss a comment report (mark as dismissed if status column exists, else delete).
     */
    public function deleteCommentReport(CommentReport $report)
    {
        if (Schema::hasColumn('comment_reports', 'status')) {
            $report->update(['status' => 'dismissed']);
        } else {
            $report->delete();
        }

        return back();
    }

    /**
     * Delete the reported comment (content removal).
     */
    public function deleteReportedComment(Comment $comment)
    {
        $comment->delete();

        return back();
    }

    /**
     * Dismiss a post report (mark as dismissed if status column exists, else delete).
     */
    public function deletePostReport(PostReport $report)
    {
        if (Schema::hasColumn('post_reports', 'status')) {
            $report->update(['status' => 'dismissed']);
        } else {
            $report->delete();
        }

        return back();
    }

    /**
     * Delete the reported post (content removal).
     */
    public function deleteReportedPost(Post $post)
    {
        $post->delete();

        return back();
    }

    /**
     * List all teacher applications with documents, sorted newest first.
     */
    public function teacherApplications()
    {
        $applications = TeacherApplication::with(['user:id,name,email,role,is_verified', 'documents'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($a) => [
                'id'            => $a->id,
                'user_id'       => $a->user_id,
                'user_name'     => $a->user?->name,
                'user_email'    => $a->user?->email,
                'user_role'     => $a->user?->role ?? 'student',
                'user_verified' => (bool) ($a->user?->is_verified ?? false),
                'status'        => $a->status,
                'admin_note'    => $a->admin_note,
                // Legacy single document (kept for backwards compatibility)
                'original_name' => $a->document_original_name,
                'document_url'  => $a->document_path ? Storage::url($a->document_path) : null,
                // New multi-document support (admin downloads via secure route)
                'documents'     => $a->documents->map(fn ($doc) => [
                    'id'            => $doc->id,
                    'original_name' => $doc->original_name,
                    'download_url'  => route('admin.verification-document.download', $doc->id),
                ])->values()->all(),
                'created_at'    => $a->created_at?->toDateString(),
            ]);

        return Inertia::render('admin/AdminTeacherApplications', compact('applications'));
    }

    /**
     * Approve a teacher application and promote the user to teacher role.
     */
    public function approveApplication(TeacherApplication $application)
    {
        if (($application->status ?? 'pending') !== 'pending') {
            return back()->with('error', 'Only pending applications can be approved.');
        }

        $application->update(['status' => 'approved']);
        $application->user?->update(['role' => 'teacher']);

        return back();
    }

    /**
     * Reject a teacher application with optional admin note.
     */
    public function rejectApplication(Request $request, TeacherApplication $application)
    {
        if (($application->status ?? 'pending') !== 'pending') {
            return back()->with('error', 'Only pending applications can be rejected.');
        }

        $application->update([
            'status'     => 'rejected',
            'admin_note' => $request->input('note'),
        ]);

        return back();
    }

    /**
     * Toggle a teacher's verification status (verify/unverify).
     * Only works on approved applications where user is a teacher.
     */
    public function toggleVerification(TeacherApplication $application)
    {
        $user = $application->user;

        if (! $user || $user->role !== 'teacher') {
            return back()->with('error', 'User must be an approved teacher to toggle verification.');
        }

        if (($application->status ?? 'pending') !== 'approved') {
            return back()->with('error', 'Only approved teacher applications can toggle verification.');
        }

        $user->update(['is_verified' => ! $user->is_verified]);
        $this->clearLeaderboardCache();

        return back();
    }

    /**
     * Download a teacher verification document securely.
     * Returns file with proper MIME type and inline disposition.
     */
    public function downloadVerificationDocument(TeacherVerificationDocument $document)
    {
        if (! Storage::disk('local')->exists($document->path)) {
            abort(404);
        }

        $mimeType = Storage::disk('local')->mimeType($document->path);
        $fullPath = Storage::disk('local')->path($document->path);

        return response()->file($fullPath, [
            'Content-Type'        => $mimeType,
            'Content-Disposition' => 'inline; filename="' . $document->original_name . '"',
        ]);
    }

    /**
     * Toggle user block status. Admins cannot be blocked.
     */
    public function toggleBlock(User $user)
    {
        if ($user->role === 'admin') {
            return back()->with('error', 'Cannot block an admin account.');
        }

        $user->update(['is_blocked' => ! $user->is_blocked]);

        return back();
    }

    /**
     * Update a user's role (student/teacher/admin).
     * Admins cannot change their own role. Removes verification if demoting from teacher.
     */
    public function updateUserRole(Request $request, User $user)
    {
        if ((int) $request->user()->id === (int) $user->id) {
            return back()->with('error', 'You cannot change your own role.');
        }

        $request->validate(['role' => 'required|in:student,teacher,admin']);

        $newRole = $request->string('role')->toString();
        $updates = ['role' => $newRole];

        // Remove verification if user is no longer a teacher
        if ($newRole !== 'teacher' && $user->is_verified) {
            $updates['is_verified'] = false;
        }

        $user->update($updates);
        $this->clearLeaderboardCache();

        return back();
    }

    /**
     * Clear all leaderboard cache keys.
     * Called when user roles or verification status changes.
     */
    private function clearLeaderboardCache(): void
    {
        Cache::forget('leaderboard.all_time.top-50');
        Cache::forget('leaderboard.weekly.top-50');
        Cache::forget('leaderboard.monthly.top-50');
        Cache::forget('leaderboard.titles.all-time.top-three');
    }
}

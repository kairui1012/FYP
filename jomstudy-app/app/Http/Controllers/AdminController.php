<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\CommentReport;
use App\Models\Post;
use App\Models\PostReport;
use App\Models\TeacherApplication;
use App\Models\TeacherVerificationDocument;
use App\Models\User;
use App\Services\AdminService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function __construct(private readonly AdminService $adminService) {}

    /**
     * List all users with basic info (newest first).
     */
    public function users()
    {
        return Inertia::render('admin/adminUsers', $this->adminService->users());
    }

    /**
     * List all comment and post reports (newest first).
     * Filters by 'pending' status if column exists (backward compat check).
     */
    public function reports()
    {
        return Inertia::render('admin/adminReports', $this->adminService->reports());
    }

    /**
     * Delete a comment report. Removing the row (rather than marking it
     * dismissed) clears the (user_id, comment_id) unique constraint so the user
     * can report the comment again if it becomes problematic later.
     */
    public function deleteCommentReport(CommentReport $report)
    {
        $this->adminService->delete($report);

        return back();
    }

    /**
     * Delete the reported comment (content removal).
     */
    public function deleteReportedComment(Comment $comment)
    {
        $this->adminService->delete($comment);

        return back();
    }

    /**
     * Delete a post report. Removing the row (rather than marking it dismissed)
     * clears the (user_id, post_id) unique constraint so the user can report the
     * post again if it becomes problematic later.
     */
    public function deletePostReport(PostReport $report)
    {
        $this->adminService->delete($report);

        return back();
    }

    /**
     * Delete the reported post (content removal).
     */
    public function deleteReportedPost(Post $post)
    {
        $this->adminService->delete($post);

        return back();
    }

    /**
     * List all teacher applications with documents, sorted newest first.
     */
    public function teacherApplications()
    {
        return Inertia::render('admin/adminTeacherApplications', $this->adminService->teacherApplications());
    }

    /**
     * Approve a teacher application and promote the user to teacher role.
     */
    public function approveApplication(TeacherApplication $application)
    {
        if (($application->status ?? 'pending') !== 'pending') {
            return back()->with('error', 'Only pending applications can be approved.');
        }

        $this->adminService->approve($application);

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

        $this->adminService->reject($application, $request->input('note'));

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

        $this->adminService->toggleVerification($user);

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
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="'.$document->original_name.'"',
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

        $this->adminService->toggleBlock($user);

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
        $this->adminService->updateRole($user, $newRole);

        return back();
    }
}

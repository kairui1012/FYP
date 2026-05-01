<?php

namespace App\Http\Controllers;

use App\Models\CommentReport;
use App\Models\TeacherApplication;
use App\Models\TeacherVerificationDocument;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AdminController extends Controller
{
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

    public function reports()
    {
        $reports = CommentReport::with(['user:id,name,email', 'comment.user:id,name'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($r) => [
                'id'             => $r->id,
                'reason'         => $r->reason,
                'reporter_name'  => $r->user?->name,
                'reporter_email' => $r->user?->email,
                'comment_id'     => $r->comment_id,
                'comment_body'   => $r->comment?->body,
                'comment_author' => $r->comment?->user?->name,
                'created_at'     => $r->created_at?->toDateString(),
            ]);

        return Inertia::render('admin/AdminReports', compact('reports'));
    }

    public function deleteReport(CommentReport $report)
    {
        $report->delete();

        return back();
    }

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

    public function approveApplication(TeacherApplication $application)
    {
        $application->update(['status' => 'approved']);
        $application->user?->update(['role' => 'teacher']);

        return back();
    }

    public function rejectApplication(Request $request, TeacherApplication $application)
    {
        $application->update([
            'status'     => 'rejected',
            'admin_note' => $request->input('note'),
        ]);

        return back();
    }

    public function toggleVerification(TeacherApplication $application)
    {
        $user = $application->user;

        if (! $user || $user->role !== 'teacher') {
            return back()->with('error', 'User must be an approved teacher to toggle verification.');
        }

        $user->update(['is_verified' => ! $user->is_verified]);

        return back();
    }

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

    public function toggleBlock(User $user)
    {
        if ($user->role === 'admin') {
            return back()->with('error', 'Cannot block an admin account.');
        }

        $user->update(['is_blocked' => ! $user->is_blocked]);

        return back();
    }

    public function updateUserRole(Request $request, User $user)
    {
        $request->validate(['role' => 'required|in:student,teacher,admin']);
        $user->update(['role' => $request->role]);

        return back();
    }
}

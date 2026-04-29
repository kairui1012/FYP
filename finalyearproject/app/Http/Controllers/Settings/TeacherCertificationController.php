<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\TeacherApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TeacherCertificationController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        $application = TeacherApplication::where('user_id', $user->id)
            ->latest()
            ->first();

        return Inertia::render('settings/teacher-certification', [
            'userRole'    => $user->role ?? 'student',
            'application' => $application ? [
                'id'            => $application->id,
                'status'        => $application->status,
                'admin_note'    => $application->admin_note,
                'original_name' => $application->document_original_name,
                'document_url'  => $application->document_path
                    ? Storage::url($application->document_path)
                    : null,
                'submitted_at'  => $application->created_at?->toDateString(),
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'document' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
        ]);

        $user = $request->user();

        // Delete old document if re-submitting
        $existing = TeacherApplication::where('user_id', $user->id)->latest()->first();
        if ($existing && $existing->document_path) {
            Storage::delete($existing->document_path);
        }

        $file     = $request->file('document');
        $path     = $file->store('teacher-certificates', 'public');
        $origName = $file->getClientOriginalName();

        if ($existing && in_array($existing->status, ['pending', 'rejected'], true)) {
            $existing->update([
                'document_path'          => $path,
                'document_original_name' => $origName,
                'status'                 => 'pending',
                'admin_note'             => null,
            ]);
        } else {
            TeacherApplication::create([
                'user_id'                => $user->id,
                'document_path'          => $path,
                'document_original_name' => $origName,
                'status'                 => 'pending',
            ]);
        }

        return back()->with('success', 'Application submitted successfully.');
    }
}

<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\TeacherApplication;
use Illuminate\Http\Request;
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
                'submitted_at'  => $application->created_at?->toDateString(),
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'agree_terms' => ['accepted'],
        ]);

        $user = $request->user();
        $existing = TeacherApplication::where('user_id', $user->id)->latest()->first();

        if ($existing && in_array($existing->status, ['pending', 'rejected'], true)) {
            $existing->update([
                'qualification'          => $existing->qualification ?? 'Policy acknowledgement submitted',
                'bio'                    => $existing->bio ?? 'Applicant agreed to teacher responsibilities and content guidelines.',
                'status'                 => 'pending',
                'admin_note'             => null,
            ]);
        } else {
            TeacherApplication::create([
                'user_id'                => $user->id,
                'qualification'          => 'Policy acknowledgement submitted',
                'bio'                    => 'Applicant agreed to teacher responsibilities and content guidelines.',
                'status'                 => 'pending',
            ]);
        }

        return back()->with('success', 'Application submitted successfully.');
    }
}

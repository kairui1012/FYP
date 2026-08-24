<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\TeacherVerificationDocument;
use App\Services\TeacherCertificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class TeacherCertificationController extends Controller
{
    public function __construct(private readonly TeacherCertificationService $certificationService) {}

    public function show(Request $request)
    {
        $user = $request->user();

        $application = $this->certificationService->latestApplication($user);

        return Inertia::render('settings/teacherCertification', [
            'userRole' => $user->role ?? 'student',
            'userIsVerified' => (bool) ($user->is_verified ?? false),
            'application' => $application ? [
                'id' => $application->id,
                'status' => $application->status,
                'admin_note' => $application->admin_note,
                'submitted_at' => $application->created_at?->toDateString(),
                'documents' => $application->documents->map(fn ($doc) => [
                    'id' => $doc->id,
                    'original_name' => $doc->original_name,
                    'view_url' => route('teacher-certification.document.view', $doc->id),
                ])->values()->all(),
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'agree_terms' => ['accepted'],
            'documents' => ['nullable', 'array', 'max:5'],
            'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:10240'],
        ]);

        $this->certificationService->submit($request->user(), $request->file('documents', []));

        return back()->with('success', 'Application submitted successfully.');
    }

    public function viewDocument(Request $request, TeacherVerificationDocument $document): BinaryFileResponse
    {
        $file = $this->certificationService->authorizedDocument($request->user(), $document);

        return response()->file($file['path'], [
            'Content-Type' => $file['mime_type'],
            'Content-Disposition' => 'inline; filename="'.$document->original_name.'"',
        ]);
    }
}

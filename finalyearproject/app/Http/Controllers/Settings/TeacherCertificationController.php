<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\TeacherApplication;
use App\Models\TeacherVerificationDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class TeacherCertificationController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        $application = TeacherApplication::with('documents')
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        return Inertia::render('settings/teacher-certification', [
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

        $user = $request->user();
        $existing = TeacherApplication::with('documents')
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        if ($existing && in_array($existing->status, ['pending', 'rejected'], true)) {
            $existing->update([
                'qualification' => $existing->qualification ?? 'Policy acknowledgement submitted',
                'bio' => $existing->bio ?? 'Applicant agreed to teacher responsibilities and content guidelines.',
                'status' => 'pending',
                'admin_note' => null,
            ]);
            $application = $existing;
        } else {
            $application = TeacherApplication::create([
                'user_id' => $user->id,
                'qualification' => 'Policy acknowledgement submitted',
                'bio' => 'Applicant agreed to teacher responsibilities and content guidelines.',
                'status' => 'pending',
            ]);
        }

        if ($request->hasFile('documents')) {
            // Remove old documents for this application before replacing
            foreach ($application->documents as $doc) {
                Storage::disk('local')->delete($doc->path);
                $doc->delete();
            }

            foreach ($request->file('documents') as $file) {
                $path = $file->store("teacher-verification/{$application->id}", 'local');
                $application->documents()->create([
                    'path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                ]);
            }
        }

        return back()->with('success', 'Application submitted successfully.');
    }

    public function viewDocument(Request $request, TeacherVerificationDocument $document): BinaryFileResponse
    {
        // Ensure the document belongs to the authenticated user's application
        $application = TeacherApplication::where('user_id', $request->user()->id)
            ->where('id', $document->teacher_application_id)
            ->firstOrFail();

        abort_unless(Storage::disk('local')->exists($document->path), 404);

        $fullPath = Storage::disk('local')->path($document->path);
        $mimeType = Storage::disk('local')->mimeType($document->path);

        // Fallback MIME detection from extension if finfo returns false
        if (! $mimeType) {
            $ext = strtolower(pathinfo($document->original_name, PATHINFO_EXTENSION));
            $mimeType = match ($ext) {
                'jpg', 'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'pdf' => 'application/pdf',
                default => 'application/octet-stream',
            };
        }

        return response()->file($fullPath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="'.$document->original_name.'"',
        ]);
    }
}

<?php

namespace App\Services;

use App\Models\TeacherApplication;
use App\Models\TeacherVerificationDocument;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class TeacherCertificationService
{
    public function latestApplication(User $user): ?TeacherApplication
    {
        return TeacherApplication::query()->with('documents')->where('user_id', $user->id)->latest()->first();
    }

    /** @param array<int, UploadedFile> $documents */
    public function submit(User $user, array $documents): TeacherApplication
    {
        $application = $this->latestApplication($user);

        if ($application && in_array($application->status, ['pending', 'rejected'], true)) {
            $application->update([
                'qualification' => $application->qualification ?? 'Policy acknowledgement submitted',
                'bio' => $application->bio ?? 'Applicant agreed to teacher responsibilities and content guidelines.',
                'status' => 'pending', 'admin_note' => null,
            ]);
        } else {
            $application = TeacherApplication::query()->create([
                'user_id' => $user->id,
                'qualification' => 'Policy acknowledgement submitted',
                'bio' => 'Applicant agreed to teacher responsibilities and content guidelines.',
                'status' => 'pending',
            ]);
        }

        if ($documents !== []) {
            foreach ($application->documents as $document) {
                Storage::disk('local')->delete($document->path);
                $document->delete();
            }

            foreach ($documents as $file) {
                $path = $file->store("teacher-verification/{$application->id}", 'local');
                $application->documents()->create(['path' => $path, 'original_name' => $file->getClientOriginalName()]);
            }
        }

        return $application->refresh()->load('documents');
    }

    /** @return array{path: string, mime_type: string} */
    public function authorizedDocument(User $user, TeacherVerificationDocument $document): array
    {
        TeacherApplication::query()->where('user_id', $user->id)
            ->where('id', $document->teacher_application_id)->firstOrFail();

        abort_unless(Storage::disk('local')->exists($document->path), 404);
        $mimeType = Storage::disk('local')->mimeType($document->path);

        if (! $mimeType) {
            $mimeType = match (strtolower(pathinfo($document->original_name, PATHINFO_EXTENSION))) {
                'jpg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'pdf' => 'application/pdf',
                default => 'application/octet-stream',
            };
        }

        return ['path' => Storage::disk('local')->path($document->path), 'mime_type' => $mimeType];
    }
}

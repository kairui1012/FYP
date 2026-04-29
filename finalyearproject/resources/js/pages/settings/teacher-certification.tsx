import { reactLang } from '@erag/lang-sync-inertia';
import { router } from '@inertiajs/react';
import { CheckCircle, Clock, FileText, Upload, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

type Application = {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    admin_note: string | null;
    original_name: string | null;
    document_url: string | null;
    submitted_at: string;
};

type Props = {
    userRole: string;
    application: Application | null;
};

export default function TeacherCertification({ userRole, application }: Props) {
    const { trans } = reactLang();
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAlreadyTeacher = userRole === 'teacher' || userRole === 'admin';
    const canSubmit =
        !application ||
        application.status === 'rejected';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const form = new FormData();
        form.append('document', file);

        setUploading(true);
        setError(null);

        router.post('/settings/teacher-certification', form, {
            forceFormData: true,
            onSuccess: () => {
                setFile(null);
                if (fileRef.current) fileRef.current.value = '';
            },
            onError: (errors) => {
                setError(errors.document ?? 'Upload failed. Please try again.');
            },
            onFinish: () => setUploading(false),
        });
    };

    return (
        <AppLayout>
            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title={trans('settings.teacher_cert_heading')}
                        description={trans('settings.teacher_cert_description')}
                    />

                    {/* Already a teacher */}
                    {isAlreadyTeacher && (
                        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                            <p className="text-sm font-medium text-green-800">
                                {trans('settings.teacher_cert_already_teacher')}
                            </p>
                        </div>
                    )}

                    {/* Status cards (only for non-teachers with an application) */}
                    {!isAlreadyTeacher && application && (
                        <div className="space-y-4">
                            {application.status === 'pending' && (
                                <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-yellow-800">
                                            {trans('settings.teacher_cert_pending_title')}
                                        </p>
                                        <p className="mt-1 text-sm text-yellow-700">
                                            {trans('settings.teacher_cert_pending_desc')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {application.status === 'approved' && (
                                <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-green-800">
                                            {trans('settings.teacher_cert_approved_title')}
                                        </p>
                                        <p className="mt-1 text-sm text-green-700">
                                            {trans('settings.teacher_cert_approved_desc')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {application.status === 'rejected' && (
                                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-800">
                                            {trans('settings.teacher_cert_rejected_title')}
                                        </p>
                                        {application.admin_note && (
                                            <p className="mt-1 text-sm text-red-700">
                                                <span className="font-medium">{trans('settings.teacher_cert_admin_note')}:</span>{' '}
                                                {application.admin_note}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Submitted file preview */}
                            {application.document_url && (
                                <div className="rounded-xl border border-border bg-muted/40 p-4">
                                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        {trans('settings.teacher_cert_submitted_file')}
                                    </p>
                                    <a
                                        href={application.document_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm font-medium text-[#e36a8b] hover:underline"
                                    >
                                        <FileText className="h-4 w-4 shrink-0" />
                                        {application.original_name ?? 'View document'}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upload form */}
                    {!isAlreadyTeacher && canSubmit && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="document">
                                    {trans('settings.teacher_cert_upload_label')}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {trans('settings.teacher_cert_upload_hint')}
                                </p>

                                {/* Drop zone */}
                                <label
                                    htmlFor="document"
                                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#f090aa]/50 bg-[#fff5f8] px-6 py-10 transition-colors hover:border-[#e36a8b] hover:bg-[#ffe8f0]"
                                >
                                    <Upload className="mb-3 h-8 w-8 text-[#e36a8b]" />
                                    {file ? (
                                        <span className="text-sm font-medium text-[#e36a8b]">{file.name}</span>
                                    ) : (
                                        <>
                                            <span className="text-sm font-medium text-foreground">
                                                Click to upload
                                            </span>
                                            <span className="mt-1 text-xs text-muted-foreground">
                                                JPG, PNG, PDF — max 10 MB
                                            </span>
                                        </>
                                    )}
                                    <input
                                        id="document"
                                        ref={fileRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        className="sr-only"
                                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                    />
                                </label>

                                {error && (
                                    <p className="text-sm text-red-600">{error}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={!file || uploading}
                                className="bg-[#e36a8b] text-white hover:bg-[#d05070]"
                            >
                                {uploading
                                    ? trans('settings.teacher_cert_uploading')
                                    : application?.status === 'rejected'
                                        ? trans('settings.teacher_cert_resubmit')
                                        : trans('settings.teacher_cert_submit')}
                            </Button>
                        </form>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

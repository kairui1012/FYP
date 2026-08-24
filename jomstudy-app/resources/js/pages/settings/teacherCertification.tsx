import { reactLang } from '@erag/lang-sync-inertia';
import { router } from '@inertiajs/react';
import {
    CheckCircle,
    Clock,
    Eye,
    FileText,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { AttachmentsSection } from '@/components/shared/attachments-section';
import Heading from '@/components/shared/settings-heading';
import {
    pillActionButton,
    pillIconButton,
} from '@/components/ts/features/create-post/create-post-config';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

const ACCEPTED_CERT_TYPES =
    'application/pdf,image/png,image/jpeg,image/jpg,.doc,.docx';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

type LocalAttachment = {
    file: File;
    preview: string | null;
    type: 'image' | 'document';
};

type SubmittedDocument = {
    id: number;
    original_name: string;
    view_url: string;
};

type Application = {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    admin_note: string | null;
    submitted_at: string;
    documents: SubmittedDocument[];
};

type Props = {
    userRole: string;
    userIsVerified: boolean;
    application: Application | null;
};

export default function TeacherCertification({
    userRole,
    userIsVerified,
    application,
}: Props) {
    const { trans } = reactLang();
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [previewDoc, setPreviewDoc] = useState<SubmittedDocument | null>(
        null,
    );
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const getDocType = (name: string): 'pdf' | 'image' | 'other' => {
        const ext = name.split('.').pop()?.toLowerCase() ?? '';
        if (ext === 'pdf') return 'pdf';
        if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image';
        return 'other';
    };

    const normalizedRole = (userRole ?? 'student')
        .toString()
        .trim()
        .toLowerCase();
    const isAlreadyVerifiedTeacher =
        normalizedRole === 'admin' ||
        (normalizedRole === 'teacher' && userIsVerified);
    const canSubmit =
        !isAlreadyVerifiedTeacher &&
        (!application ||
            application.status === 'rejected' ||
            (normalizedRole === 'teacher' &&
                application.status === 'approved'));

    const processFiles = (incoming: File[]) => {
        setFileError(null);
        const valid: File[] = [];

        for (const file of incoming) {
            if (file.size > MAX_FILE_SIZE) {
                setFileError(trans('settings.teacher_cert_file_too_large'));
                continue;
            }
            valid.push(file);
        }

        setAttachments((prev) => {
            const combined = [...prev];
            for (const file of valid) {
                if (combined.length >= MAX_FILES) {
                    setFileError(trans('settings.teacher_cert_max_files'));
                    break;
                }
                const key = `${file.name}-${file.size}-${file.lastModified}`;
                if (
                    combined.some(
                        (a) =>
                            `${a.file.name}-${a.file.size}-${a.file.lastModified}` ===
                            key,
                    )
                ) {
                    continue;
                }
                const isImage = file.type.startsWith('image/');
                combined.push({
                    file,
                    preview: isImage ? URL.createObjectURL(file) : null,
                    type: isImage ? 'image' : 'document',
                });
            }
            return combined;
        });
    };

    const onSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            processFiles(Array.from(event.target.files));
            event.target.value = '';
        }
    };

    const onDropFiles = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (event.dataTransfer.files) {
            processFiles(Array.from(event.dataTransfer.files));
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => {
            const next = [...prev];
            const removed = next.splice(index, 1)[0];
            if (removed.preview) URL.revokeObjectURL(removed.preview);
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreeTerms) return;

        setSubmitting(true);

        const formData = new FormData();
        formData.append('agree_terms', '1');
        attachments.forEach((a) => formData.append('documents[]', a.file));

        router.post('/settings/teacher-certification', formData, {
            forceFormData: true,
            onSuccess: () => {
                attachments.forEach((a) => {
                    if (a.preview) URL.revokeObjectURL(a.preview);
                });
                setAttachments([]);
                setAgreeTerms(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const previousDocs = application?.documents ?? [];

    return (
        <AppLayout>
            <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <Heading
                    variant="small"
                    title={trans('settings.teacher_cert_heading')}
                    description={trans('settings.teacher_cert_description')}
                />

                {isAlreadyVerifiedTeacher ? (
                    <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                        <p className="text-sm font-medium text-green-800">
                            {trans('settings.teacher_cert_already_teacher')}
                        </p>
                    </div>
                ) : null}

                {!isAlreadyVerifiedTeacher &&
                application?.status === 'pending' ? (
                    <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                        <div>
                            <p className="text-sm font-semibold text-yellow-800">
                                {trans('settings.teacher_cert_pending_title')}
                            </p>
                            <p className="mt-1 text-sm text-yellow-700">
                                {trans('settings.teacher_cert_pending_desc')}
                            </p>
                            {previousDocs.length > 0 ? (
                                <div className="mt-3 space-y-1">
                                    <p className="text-xs font-medium text-yellow-800">
                                        {trans(
                                            'settings.teacher_cert_submitted_files',
                                        )}
                                    </p>
                                    {previousDocs.map((doc) => (
                                        <button
                                            key={doc.id}
                                            type="button"
                                            onClick={() => setPreviewDoc(doc)}
                                            className="flex items-center gap-1.5 text-xs text-yellow-700 underline-offset-2 hover:underline"
                                        >
                                            <Eye className="h-3.5 w-3.5 shrink-0" />
                                            {doc.original_name}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {isAlreadyVerifiedTeacher &&
                application?.status === 'approved' ? (
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
                ) : null}

                {!isAlreadyVerifiedTeacher &&
                application?.status === 'rejected' ? (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        <div>
                            <p className="text-sm font-semibold text-red-800">
                                {trans('settings.teacher_cert_rejected_title')}
                            </p>
                            {application.admin_note ? (
                                <p className="mt-1 text-sm text-red-700">
                                    <span className="font-medium">
                                        {trans(
                                            'settings.teacher_cert_admin_note',
                                        )}
                                        :
                                    </span>{' '}
                                    {application.admin_note}
                                </p>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {canSubmit ? (
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5 rounded-xl border border-border bg-muted/40 p-5"
                    >
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <ShieldCheck className="h-4 w-4 text-[#e36a8b]" />
                                {trans('settings.teacher_cert_rules_title')}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {trans(
                                    'settings.teacher_cert_rules_description',
                                )}
                            </p>
                        </div>

                        {/* Optional verification documents upload */}
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">
                                {trans('settings.teacher_cert_upload_label')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {trans('settings.teacher_cert_upload_hint')}
                            </p>
                            <AttachmentsSection
                                fileInputRef={fileInputRef}
                                acceptedFileTypes={ACCEPTED_CERT_TYPES}
                                attachments={attachments}
                                fileError={fileError}
                                isDragging={isDragging}
                                onSelectFiles={onSelectFiles}
                                onSetDragging={setIsDragging}
                                onDropFiles={onDropFiles}
                                onRemoveAttachment={removeAttachment}
                                pillActionButton={pillActionButton}
                                pillIconButton={pillIconButton}
                                text={{
                                    mediaLabel: '',
                                    addFiles: trans(
                                        'settings.teacher_cert_add_files',
                                    ),
                                    dragDropTitle: trans(
                                        'settings.teacher_cert_drag_title',
                                    ),
                                    dragDropSubtitle: trans(
                                        'settings.teacher_cert_drag_subtitle',
                                    ),
                                    supportedFormat: trans(
                                        'settings.teacher_cert_supported_format',
                                    ),
                                    previewAlt: trans(
                                        'settings.teacher_cert_preview_alt',
                                    ),
                                }}
                            />
                        </div>

                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="agree-terms"
                                checked={agreeTerms}
                                onCheckedChange={(checked) =>
                                    setAgreeTerms(checked === true)
                                }
                            />
                            <Label
                                htmlFor="agree-terms"
                                className="cursor-pointer text-sm leading-5"
                            >
                                {trans('settings.teacher_cert_rules_agree')}
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            disabled={!agreeTerms || submitting}
                            className="bg-[#e36a8b] text-white hover:bg-[#d05070]"
                        >
                            {submitting
                                ? trans('settings.teacher_cert_uploading')
                                : application?.status === 'rejected'
                                  ? trans('settings.teacher_cert_resubmit')
                                  : trans('settings.teacher_cert_submit')}
                        </Button>
                    </form>
                ) : null}
            </div>

            {/* Document preview modal */}
            <Dialog
                open={previewDoc !== null}
                onOpenChange={(open) => {
                    if (!open) setPreviewDoc(null);
                }}
            >
                <DialogContent className="flex h-[92vh] w-[92vw] max-w-6xl flex-col gap-0 p-0">
                    <DialogHeader className="shrink-0 border-b px-5 py-3">
                        <DialogTitle className="flex items-center gap-2 text-sm font-medium">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {previewDoc?.original_name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 overflow-auto">
                        {previewDoc &&
                            getDocType(previewDoc.original_name) === 'pdf' && (
                                <iframe
                                    src={previewDoc.view_url}
                                    className="h-full w-full border-0"
                                    title={previewDoc.original_name}
                                />
                            )}
                        {previewDoc &&
                            getDocType(previewDoc.original_name) ===
                                'image' && (
                                <div className="flex h-full items-center justify-center p-4">
                                    <img
                                        src={previewDoc.view_url}
                                        alt={previewDoc.original_name}
                                        className="max-h-full max-w-full rounded object-contain"
                                    />
                                </div>
                            )}
                        {previewDoc &&
                            getDocType(previewDoc.original_name) ===
                                'other' && (
                                <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                                    <FileText className="h-10 w-10" />
                                    <p className="text-sm">
                                        {trans(
                                            'settings.teacher_cert_no_preview',
                                        )}
                                    </p>
                                    <a
                                        href={previewDoc.view_url}
                                        download={previewDoc.original_name}
                                        className="text-sm font-medium text-[#e36a8b] hover:underline"
                                    >
                                        {trans(
                                            'settings.teacher_cert_download_instead',
                                        )}
                                    </a>
                                </div>
                            )}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

import { reactLang } from '@erag/lang-sync-inertia';
import { router } from '@inertiajs/react';
import { BadgeCheck, Check, Eye, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin/admin-layout';

type VerificationDocument = {
    id: number;
    original_name: string;
    download_url: string;
};

type Application = {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    user_role: string;
    user_verified: boolean;
    status: 'pending' | 'approved' | 'rejected';
    admin_note: string | null;
    // Legacy single document
    original_name: string | null;
    document_url: string | null;
    // New multi-document
    documents: VerificationDocument[];
    created_at: string;
};

const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

type PreviewDoc = { url: string; name: string };

function getDocType(name: string): 'pdf' | 'image' | 'other' {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image';
    return 'other';
}

function DocPreviewModal({ doc, onClose }: { doc: PreviewDoc | null; onClose: () => void }) {
    const type = doc ? getDocType(doc.name) : null;
    return (
        <Dialog open={doc !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="flex h-[92vh] w-[92vw] max-w-6xl flex-col gap-0 p-0">
                <DialogHeader className="shrink-0 border-b px-5 py-3">
                    <DialogTitle className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc?.name}
                    </DialogTitle>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-auto">
                    {type === 'pdf' && (
                        <iframe
                            src={doc!.url}
                            className="h-full w-full border-0"
                            title={doc!.name}
                        />
                    )}
                    {type === 'image' && (
                        <div className="flex h-full items-center justify-center p-4">
                            <img
                                src={doc!.url}
                                alt={doc!.name}
                                className="max-h-full max-w-full rounded object-contain"
                            />
                        </div>
                    )}
                    {type === 'other' && (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                            <FileText className="h-10 w-10" />
                            <p className="text-sm">This file type cannot be previewed.</p>
                            <a
                                href={doc!.url}
                                download={doc!.name}
                                className="text-sm font-medium text-[#e36a8b] hover:underline"
                            >
                                Download instead
                            </a>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DocumentList({
    documents,
    legacyUrl,
    legacyName,
    viewLabel,
}: {
    documents: VerificationDocument[];
    legacyUrl: string | null;
    legacyName: string | null;
    viewLabel: string;
}) {
    const [previewDoc, setPreviewDoc] = useState<PreviewDoc | null>(null);

    if (documents.length > 0) {
        return (
            <>
                <div className="flex flex-col gap-1.5">
                    {documents.map((doc) => (
                        <button
                            key={doc.id}
                            type="button"
                            onClick={() => setPreviewDoc({ url: doc.download_url, name: doc.original_name })}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#f090aa]/40 bg-[#fff5f8] px-3 py-1.5 text-sm font-medium text-[#e36a8b] transition-colors hover:bg-[#ffe8f0]"
                        >
                            <Eye className="h-3.5 w-3.5 shrink-0" />
                            <span className="max-w-45 truncate">{doc.original_name}</span>
                        </button>
                    ))}
                </div>
                <DocPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
            </>
        );
    }

    if (legacyUrl) {
        return (
            <>
                <button
                    type="button"
                    onClick={() => setPreviewDoc({ url: legacyUrl, name: legacyName ?? viewLabel })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#f090aa]/40 bg-[#fff5f8] px-3 py-1.5 text-sm font-medium text-[#e36a8b] transition-colors hover:bg-[#ffe8f0]"
                >
                    <Eye className="h-3.5 w-3.5 shrink-0" />
                    <span className="max-w-45 truncate">{legacyName ?? viewLabel}</span>
                </button>
                <DocPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
            </>
        );
    }

    return <span className="text-sm text-muted-foreground">—</span>;
}

export default function AdminTeacherApplications({ applications }: { applications: Application[] }) {
    const { trans } = reactLang();
    const [rejectTarget, setRejectTarget] = useState<number | null>(null);
    const [note, setNote] = useState('');

    const approve = (id: number) => {
        router.patch(`/admin/teacher-applications/${id}/approve`, {}, { preserveScroll: true });
    };

    const submitReject = () => {
        if (rejectTarget === null) return;
        router.patch(
            `/admin/teacher-applications/${rejectTarget}/reject`,
            { note },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRejectTarget(null);
                    setNote('');
                },
            },
        );
    };

    const toggleVerification = (id: number) => {
        router.patch(`/admin/teacher-applications/${id}/toggle-verification`, {}, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">{trans('admin.applications_title')}</h1>
                <p className="text-sm text-muted-foreground">
                    {trans('admin.applications_total').replace(':count', String(applications.length))}
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>{trans('admin.col_applicant')}</TableHead>
                            <TableHead>{trans('admin.col_certificate')}</TableHead>
                            <TableHead>{trans('admin.col_status')}</TableHead>
                            <TableHead>{trans('admin.col_verification')}</TableHead>
                            <TableHead>{trans('admin.col_date')}</TableHead>
                            <TableHead className="text-right">{trans('admin.col_actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.map((app, i) => (
                            <TableRow key={app.id}>
                                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{app.user_name}</div>
                                    <div className="text-xs text-muted-foreground">{app.user_email}</div>
                                </TableCell>
                                <TableCell>
                                    <DocumentList
                                        documents={app.documents}
                                        legacyUrl={app.document_url}
                                        legacyName={app.original_name}
                                        viewLabel={trans('admin.view_document')}
                                    />
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[app.status]}`}
                                    >
                                        {trans(`admin.status_${app.status}`)}
                                    </span>
                                    {app.admin_note && (
                                        <p className="mt-1 text-xs italic text-muted-foreground">
                                            {trans('admin.admin_note_prefix')} {app.admin_note}
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {app.status === 'approved' ? (
                                        <Button
                                            size="sm"
                                            variant={app.user_verified ? 'default' : 'outline'}
                                            className={
                                                app.user_verified
                                                    ? 'gap-1.5 border-blue-500 bg-blue-500 text-white hover:bg-blue-600'
                                                    : 'gap-1.5 border-zinc-300 text-zinc-600 hover:border-blue-400 hover:text-blue-600'
                                            }
                                            onClick={() => toggleVerification(app.id)}
                                        >
                                            <BadgeCheck className="h-3.5 w-3.5" />
                                            {app.user_verified
                                                ? trans('admin.btn_verified')
                                                : trans('admin.btn_mark_verified')}
                                        </Button>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{app.created_at}</TableCell>
                                <TableCell className="text-right">
                                    {app.status === 'pending' ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 text-white hover:bg-green-700"
                                                onClick={() => approve(app.id)}
                                            >
                                                <Check className="mr-1 h-3.5 w-3.5" />
                                                {trans('admin.btn_approve')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-300 text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    setRejectTarget(app.id);
                                                    setNote('');
                                                }}
                                            >
                                                <X className="mr-1 h-3.5 w-3.5" />
                                                {trans('admin.btn_reject')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {applications.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                    {trans('admin.no_applications')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Reject dialog */}
            <Dialog open={rejectTarget !== null} onOpenChange={(open) => !open && setRejectTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{trans('admin.dialog_reject_title')}</DialogTitle>
                    </DialogHeader>
                    <Textarea
                        placeholder={trans('admin.dialog_reject_placeholder')}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={4}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectTarget(null)}>
                            {trans('admin.btn_cancel')}
                        </Button>
                        <Button className="bg-red-600 text-white hover:bg-red-700" onClick={submitReject}>
                            {trans('admin.btn_confirm_reject')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

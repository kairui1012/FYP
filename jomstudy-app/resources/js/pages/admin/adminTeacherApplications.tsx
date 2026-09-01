import { reactLang } from '@erag/lang-sync-inertia';
import { router } from '@inertiajs/react';
import { BadgeCheck, Check, X } from 'lucide-react';
import { useState } from 'react';
import { ApplicationDocumentList } from '@/components/adminTeacherApplicationsPageComponent/application-document-list';
import type { VerificationDocument } from '@/components/adminTeacherApplicationsPageComponent/application-document-list';
import { PaginationControls } from '@/components/shared/pagination-controls';
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
import type { PaginationMeta } from '@/types';

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

export default function AdminTeacherApplications({
    applications,
    pagination,
}: {
    applications: Application[];
    pagination: PaginationMeta;
}) {
    const { trans } = reactLang();
    const [rejectTarget, setRejectTarget] = useState<number | null>(null);
    const [note, setNote] = useState('');

    const approve = (id: number) => {
        router.patch(
            `/admin/teacher-applications/${id}/approve`,
            {},
            { preserveScroll: true },
        );
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
        router.patch(
            `/admin/teacher-applications/${id}/toggle-verification`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">
                    {trans('admin.applications_title')}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {trans('admin.applications_total').replace(
                        ':count',
                        String(pagination.total),
                    )}
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>
                                {trans('admin.col_applicant')}
                            </TableHead>
                            <TableHead>
                                {trans('admin.col_certificate')}
                            </TableHead>
                            <TableHead>{trans('admin.col_status')}</TableHead>
                            <TableHead>
                                {trans('admin.col_verification')}
                            </TableHead>
                            <TableHead>{trans('admin.col_date')}</TableHead>
                            <TableHead className="text-right">
                                {trans('admin.col_actions')}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.map((app, i) => (
                            <TableRow key={app.id}>
                                <TableCell className="text-muted-foreground">
                                    {(pagination.from ?? 1) + i}
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">
                                        {app.user_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {app.user_email}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <ApplicationDocumentList
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
                                        <p className="mt-1 text-xs text-muted-foreground italic">
                                            {trans('admin.admin_note_prefix')}{' '}
                                            {app.admin_note}
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {app.status === 'approved' ? (
                                        <Button
                                            size="sm"
                                            variant={
                                                app.user_verified
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className={
                                                app.user_verified
                                                    ? 'gap-1.5 border-blue-500 bg-blue-500 text-white hover:bg-blue-600'
                                                    : 'gap-1.5 border-zinc-300 text-zinc-600 hover:border-blue-400 hover:text-blue-600'
                                            }
                                            onClick={() =>
                                                toggleVerification(app.id)
                                            }
                                        >
                                            <BadgeCheck className="h-3.5 w-3.5" />
                                            {app.user_verified
                                                ? trans('admin.btn_verified')
                                                : trans(
                                                      'admin.btn_mark_verified',
                                                  )}
                                        </Button>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            —
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {app.created_at}
                                </TableCell>
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
                                        <span className="text-sm text-muted-foreground">
                                            —
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {applications.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    {trans('admin.no_applications')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <PaginationControls pagination={pagination} />

            {/* Reject dialog */}
            <Dialog
                open={rejectTarget !== null}
                onOpenChange={(open) => !open && setRejectTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {trans('admin.dialog_reject_title')}
                        </DialogTitle>
                    </DialogHeader>
                    <Textarea
                        placeholder={trans('admin.dialog_reject_placeholder')}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={4}
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectTarget(null)}
                        >
                            {trans('admin.btn_cancel')}
                        </Button>
                        <Button
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={submitReject}
                        >
                            {trans('admin.btn_confirm_reject')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

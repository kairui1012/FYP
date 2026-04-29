import { router } from '@inertiajs/react';
import { Check, ExternalLink, FileText, ImageIcon, X } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type Application = {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    user_role: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_note: string | null;
    original_name: string | null;
    document_url: string | null;
    created_at: string;
};

const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

function isPdf(url: string | null) {
    return url?.toLowerCase().endsWith('.pdf');
}

function DocumentPreview({ url, name }: { url: string | null; name: string | null }) {
    if (!url) return <span className="text-muted-foreground text-sm">—</span>;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#f090aa]/40 bg-[#fff5f8] px-3 py-1.5 text-sm font-medium text-[#e36a8b] transition-colors hover:bg-[#ffe8f0]"
        >
            {isPdf(url) ? (
                <FileText className="h-4 w-4 shrink-0" />
            ) : (
                <ImageIcon className="h-4 w-4 shrink-0" />
            )}
            <span className="max-w-35 truncate">{name ?? 'View document'}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
        </a>
    );
}

export default function AdminTeacherApplications({ applications }: { applications: Application[] }) {
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

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Teacher Applications</h1>
                <p className="text-sm text-muted-foreground">{applications.length} total applications</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>Applicant</TableHead>
                            <TableHead>Certificate</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                                    <DocumentPreview url={app.document_url} name={app.original_name} />
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[app.status]}`}
                                    >
                                        {app.status}
                                    </span>
                                    {app.admin_note && (
                                        <p className="mt-1 text-xs italic text-muted-foreground">
                                            Note: {app.admin_note}
                                        </p>
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
                                                Approve
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
                                                Reject
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
                                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                    No applications found.
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
                        <DialogTitle>Reject Application</DialogTitle>
                    </DialogHeader>
                    <Textarea
                        placeholder="Optional note to the applicant..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={4}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectTarget(null)}>
                            Cancel
                        </Button>
                        <Button className="bg-red-600 text-white hover:bg-red-700" onClick={submitReject}>
                            Confirm Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

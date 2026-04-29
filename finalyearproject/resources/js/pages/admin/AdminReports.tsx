import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type Report = {
    id: number;
    reason: string;
    reporter_name: string;
    reporter_email: string;
    comment_id: number;
    comment_body: string;
    comment_author: string;
    created_at: string;
};

export default function AdminReports({ reports }: { reports: Report[] }) {
    const deleteReport = (id: number) => {
        router.delete(`/admin/reports/${id}`, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Report Records</h1>
                <p className="text-sm text-muted-foreground">{reports.length} total reports</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>Reporter</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Comment</TableHead>
                            <TableHead>Comment Author</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map((report, i) => (
                            <TableRow key={report.id}>
                                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{report.reporter_name}</div>
                                    <div className="text-xs text-muted-foreground">{report.reporter_email}</div>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                                        {report.reason}
                                    </span>
                                </TableCell>
                                <TableCell className="max-w-xs">
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {report.comment_body ?? '—'}
                                    </p>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{report.comment_author ?? '—'}</TableCell>
                                <TableCell className="text-muted-foreground">{report.created_at}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                        onClick={() => deleteReport(report.id)}
                                        title="Dismiss report"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {reports.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                    No reports found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}

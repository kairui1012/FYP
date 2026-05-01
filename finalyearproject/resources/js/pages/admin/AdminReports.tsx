import { router } from '@inertiajs/react';
import { reactLang } from '@erag/lang-sync-inertia';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/admin/admin-layout';

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
    const { trans } = reactLang();

    const deleteReport = (id: number) => {
        router.delete(`/admin/reports/${id}`, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">{trans('admin.reports_title')}</h1>
                <p className="text-sm text-muted-foreground">
                    {trans('admin.reports_total').replace(':count', String(reports.length))}
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>{trans('admin.col_reporter')}</TableHead>
                            <TableHead>{trans('admin.col_reason')}</TableHead>
                            <TableHead>{trans('admin.col_comment')}</TableHead>
                            <TableHead>{trans('admin.col_comment_author')}</TableHead>
                            <TableHead>{trans('admin.col_date')}</TableHead>
                            <TableHead className="text-right">{trans('admin.col_actions')}</TableHead>
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
                                        title={trans('admin.dismiss_report')}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {reports.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                    {trans('admin.no_reports')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}

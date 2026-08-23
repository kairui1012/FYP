import { reactLang } from '@erag/lang-sync-inertia';
import { router } from '@inertiajs/react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/component-new/button/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/component-new/ui/table';
import AdminLayout from '@/layouts/admin/admin-layout';

type Report = {
    id: number;
    report_type: 'comment' | 'post';
    reason: string;
    reporter_name: string;
    reporter_email: string;
    target_id: number;
    target_body: string | null;
    target_author: string | null;
    created_at: string;
};

export default function AdminReports({ reports }: { reports: Report[] }) {
    const { trans } = reactLang();
    const t = (key: string, fallbackKey?: string) => {
        const primary = trans(key);
        if (primary !== key) {
            return primary;
        }

        if (!fallbackKey) {
            return primary;
        }

        const fallback = trans(fallbackKey);
        return fallback !== fallbackKey ? fallback : primary;
    };
    const [armedDeleteCommentId, setArmedDeleteCommentId] = useState<
        number | null
    >(null);
    const [armedDeletePostId, setArmedDeletePostId] = useState<number | null>(
        null,
    );
    const clearArmTimerRef = useRef<number | null>(null);

    const deleteReport = (id: number, reportType: Report['report_type']) => {
        const basePath =
            reportType === 'post'
                ? '/admin/reports/posts'
                : '/admin/reports/comments';
        router.delete(`${basePath}/${id}`, { preserveScroll: true });
    };

    const deletePost = (postId: number) => {
        if (armedDeletePostId !== postId) {
            setArmedDeletePostId(postId);
            toast(trans('admin.tap_again_delete_post'));
            if (clearArmTimerRef.current) {
                window.clearTimeout(clearArmTimerRef.current);
            }
            clearArmTimerRef.current = window.setTimeout(() => {
                setArmedDeletePostId(null);
            }, 4000);
            return;
        }

        router.delete(`/admin/reports/posts/${postId}/content`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(trans('admin.delete_reported_post'));
            },
            onError: () => {
                toast.error(
                    trans('errors.generic') || 'Failed to delete post.',
                );
            },
            onFinish: () => {
                setArmedDeletePostId(null);
            },
        });
    };

    const deleteComment = (commentId: number) => {
        if (armedDeleteCommentId !== commentId) {
            setArmedDeleteCommentId(commentId);
            toast(trans('admin.tap_again_delete_comment'));
            if (clearArmTimerRef.current) {
                window.clearTimeout(clearArmTimerRef.current);
            }
            clearArmTimerRef.current = window.setTimeout(() => {
                setArmedDeleteCommentId(null);
            }, 4000);
            return;
        }

        router.delete(`/admin/reports/comments/${commentId}/content`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(trans('admin.delete_reported_comment'));
            },
            onError: () => {
                toast.error(
                    trans('errors.generic') || 'Failed to delete comment.',
                );
            },
            onFinish: () => {
                setArmedDeleteCommentId(null);
            },
        });
    };

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">
                    {trans('admin.reports_title')}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {trans('admin.reports_total').replace(
                        ':count',
                        String(reports.length),
                    )}
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>{t('admin.col_reporter')}</TableHead>
                            <TableHead>{t('admin.col_reason')}</TableHead>
                            <TableHead>
                                {t(
                                    'admin.col_report_target',
                                    'admin.col_comment',
                                )}
                            </TableHead>
                            <TableHead>
                                {t(
                                    'admin.col_target_author',
                                    'admin.col_comment_author',
                                )}
                            </TableHead>
                            <TableHead>{t('admin.col_date')}</TableHead>
                            <TableHead className="text-right">
                                {t('admin.col_actions')}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map((report, i) => (
                            <TableRow key={report.id}>
                                <TableCell className="text-muted-foreground">
                                    {i + 1}
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">
                                        {report.reporter_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {report.reporter_email}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                                        {report.reason}
                                    </span>
                                </TableCell>
                                <TableCell className="max-w-xs">
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {report.target_body ?? '—'}
                                    </p>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {report.target_author ?? '—'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {report.created_at}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        {report.report_type === 'post' ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                onClick={() =>
                                                    deletePost(report.target_id)
                                                }
                                                title={trans(
                                                    'admin.delete_reported_post',
                                                )}
                                            >
                                                <AlertTriangle className="h-4 w-4" />
                                            </Button>
                                        ) : null}
                                        {report.report_type === 'comment' ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                                onClick={() =>
                                                    deleteComment(
                                                        report.target_id,
                                                    )
                                                }
                                                title={trans(
                                                    'admin.delete_reported_comment',
                                                )}
                                            >
                                                <AlertTriangle className="h-4 w-4" />
                                            </Button>
                                        ) : null}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                            onClick={() =>
                                                deleteReport(
                                                    report.id,
                                                    report.report_type,
                                                )
                                            }
                                            title={trans(
                                                'admin.dismiss_report',
                                            )}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {reports.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="py-10 text-center text-muted-foreground"
                                >
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

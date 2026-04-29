import { reactLang } from '@erag/lang-sync-inertia';
import { router } from '@inertiajs/react';
import { CheckCircle, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

type Application = {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    admin_note: string | null;
    submitted_at: string;
};

type Props = {
    userRole: string;
    application: Application | null;
};

export default function TeacherCertification({ userRole, application }: Props) {
    const { trans } = reactLang();
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const normalizedRole = (userRole ?? 'student').toString().trim().toLowerCase();
    const isAlreadyTeacher = ['teacher', 'admin'].includes(normalizedRole);
    const canSubmit = !application || application.status === 'rejected';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!agreeTerms) return;

        setSubmitting(true);
        router.post(
            '/settings/teacher-certification',
            { agree_terms: true },
            {
                onSuccess: () => setAgreeTerms(false),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <AppLayout>
            <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <Heading
                    variant="small"
                    title={trans('settings.teacher_cert_heading')}
                    description={trans('settings.teacher_cert_description')}
                />

                {isAlreadyTeacher ? (
                    <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                        <p className="text-sm font-medium text-green-800">
                            {trans('settings.teacher_cert_already_teacher')}
                        </p>
                    </div>
                ) : null}

                {!isAlreadyTeacher && application?.status === 'pending' ? (
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
                ) : null}

                {!isAlreadyTeacher && application?.status === 'approved' ? (
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

                {!isAlreadyTeacher && application?.status === 'rejected' ? (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        <div>
                            <p className="text-sm font-semibold text-red-800">
                                {trans('settings.teacher_cert_rejected_title')}
                            </p>
                            {application.admin_note ? (
                                <p className="mt-1 text-sm text-red-700">
                                    <span className="font-medium">{trans('settings.teacher_cert_admin_note')}:</span>{' '}
                                    {application.admin_note}
                                </p>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {!isAlreadyTeacher && canSubmit ? (
                    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-muted/40 p-5">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <ShieldCheck className="h-4 w-4 text-[#e36a8b]" />
                                {trans('settings.teacher_cert_rules_title')}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {trans('settings.teacher_cert_rules_description')}
                            </p>
                        </div>

                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="agree-terms"
                                checked={agreeTerms}
                                onCheckedChange={(checked) =>
                                    setAgreeTerms(checked === true)
                                }
                            />
                            <Label htmlFor="agree-terms" className="cursor-pointer text-sm leading-5">
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
        </AppLayout>
    );
}

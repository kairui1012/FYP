// Components
import { reactLang } from '@erag/lang-sync-inertia';
import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/shared/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    const { trans } = reactLang();

    return (
        <AuthLayout
            title={trans('auth.verify_email_title')}
            description={trans('auth.verify_email_description')}
        >
            <Head title={trans('auth.verify_email_title')} />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {trans('auth.verification_link_sent')}
                </div>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            {trans('auth.resend_verification_email')}
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            {trans('auth.logout')}
                        </TextLink>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}

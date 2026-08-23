import { reactLang } from '@erag/lang-sync-inertia';
import { Form, Head } from '@inertiajs/react';
import InputError from '@/component-new/shared/input-error';
import { Button } from '@/component-new/button/button';
import { Input } from '@/component-new/ui/input';
import { Label } from '@/component-new/ui/label';
import { Spinner } from '@/component-new/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    const { trans } = reactLang();

    return (
        <AuthLayout
            title={trans('auth.confirm_password_title')}
            description={trans('auth.confirm_password_description')}
        >
            <Head title={trans('auth.confirm_password_title')} />

            <Form {...store.form()} resetOnSuccess={['password']}>
                {({ processing, errors }) => (
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="password">{trans('auth.password')}</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Password"
                                autoComplete="current-password"
                                autoFocus
                            />

                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center">
                            <Button
                                className="w-full"
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing && <Spinner />}
                                {trans('auth.confirm_password_button')}
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}

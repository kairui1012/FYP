import { reactLang } from '@erag/lang-sync-inertia';
import { Form, Head, Link } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { AppHeaderForUnlogin } from '@/component-new/header/header-for-unlogin';
import GoogleLoginBtn from '@/component-new/button/btn-google-login';
import InputError from '@/component-new/shared/input-error';
import TextLink from '@/component-new/shared/text-link';
import { Button } from '@/component-new/button/button';
import { Card } from '@/component-new/ui/card';
import { Checkbox } from '@/component-new/ui/checkbox';
import { Input } from '@/component-new/ui/input';
import { Label } from '@/component-new/ui/label';
import { Spinner } from '@/component-new/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const { trans } = reactLang();

    return (
        <>
            <Head title={trans('auth.login_title')}>
                <meta
                    name="robots"
                    content="noindex, nofollow, noarchive"
                    head-key="robots"
                />
                <meta
                    name="description"
                    head-key="description"
                    content="Sign in to access your learning dashboard, saved materials, and discussions."
                />
                <link rel="canonical" href="/login" head-key="canonical" />
            </Head>

            <AppHeaderForUnlogin />

            <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-muted px-3 py-5 sm:px-4 sm:py-6 lg:px-6">
                <Card className="w-full max-w-[clamp(19rem,86vw,52rem)] overflow-hidden rounded-3xl border-0 p-0 shadow-2xl lg:rounded-4xl">
                    <div className="grid lg:grid-cols-2">
                        <div className="bg-background p-3.5 sm:p-5 md:p-6 lg:p-6 xl:p-7">
                            <div className="mb-6 space-y-2 text-left">
                                <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                                    {trans('auth.login_heading')}
                                </h1>
                                <p className="text-xs text-muted-foreground sm:text-sm">
                                    {trans('auth.login_subtitle')}
                                </p>
                            </div>

                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="flex flex-col gap-5"
                            >
                                {({ processing, errors }) => {
                                    const invalidCredentials =
                                        errors.email === trans('auth.failed') ||
                                        errors.password ===
                                            trans('auth.failed');

                                    return (
                                        <>
                                            <div className="h-10 w-full">
                                                {invalidCredentials && (
                                                    <div className="flex h-full w-full items-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white">
                                                        {trans(
                                                            'auth.login_failed_notice',
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid gap-5">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="email">
                                                        {trans(
                                                            'auth.email_address',
                                                        )}
                                                    </Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        required
                                                        autoFocus
                                                        tabIndex={1}
                                                        autoComplete="email"
                                                        placeholder="email@example.com"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.email ===
                                                            trans('auth.failed')
                                                                ? undefined
                                                                : errors.email
                                                        }
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <div className="flex items-center">
                                                        <Label htmlFor="password">
                                                            {trans(
                                                                'auth.password',
                                                            )}
                                                        </Label>
                                                    </div>
                                                    <div className="relative">
                                                        <Input
                                                            id="password"
                                                            type={
                                                                showPassword
                                                                    ? 'text'
                                                                    : 'password'
                                                            }
                                                            name="password"
                                                            required
                                                            tabIndex={2}
                                                            autoComplete="current-password"
                                                            placeholder="Password"
                                                            className="pr-9"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setShowPassword(
                                                                    (prev) =>
                                                                        !prev,
                                                                )
                                                            }
                                                            className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground transition-colors hover:text-foreground"
                                                            aria-label={
                                                                showPassword
                                                                    ? trans(
                                                                          'auth.hide_password',
                                                                      )
                                                                    : trans(
                                                                          'auth.show_password',
                                                                      )
                                                            }
                                                        >
                                                            {showPassword ? (
                                                                <EyeOff
                                                                    className="size-3.5"
                                                                    aria-hidden="true"
                                                                />
                                                            ) : (
                                                                <Eye
                                                                    className="size-3.5"
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <InputError
                                                        message={
                                                            errors.password ===
                                                            'These credentials do not match our records.'
                                                                ? undefined
                                                                : errors.password
                                                        }
                                                    />
                                                </div>

                                                <div className="flex items-center space-x-2.5">
                                                    <Checkbox
                                                        id="remember"
                                                        name="remember"
                                                        tabIndex={3}
                                                    />
                                                    <Label htmlFor="remember">
                                                        {trans(
                                                            'auth.remember_me',
                                                        )}
                                                    </Label>
                                                    {canResetPassword && (
                                                        <TextLink
                                                            href={request()}
                                                            className="ml-auto flex items-center gap-1 text-xs font-medium no-underline transition-all duration-200 ease-out hover:gap-1.5 hover:text-red-600"
                                                            tabIndex={5}
                                                        >
                                                            {trans(
                                                                'auth.forgot_password',
                                                            )}
                                                        </TextLink>
                                                    )}
                                                </div>

                                                <Button
                                                    type="submit"
                                                    className="mt-1.5 h-10 w-full"
                                                    tabIndex={4}
                                                    disabled={processing}
                                                    data-test="login-button"
                                                >
                                                    {processing && <Spinner />}
                                                    <span className="font-semibold">
                                                        {trans('auth.login')}
                                                    </span>
                                                </Button>

                                                <GoogleLoginBtn />
                                            </div>

                                            {canRegister && (
                                                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                                    <span>
                                                        {trans(
                                                            'auth.no_account',
                                                        )}
                                                    </span>

                                                    <Button
                                                        asChild
                                                        className="h-7 rounded-lg bg-black px-2.5 text-xs font-medium text-white transition-all duration-200 hover:bg-zinc-800 hover:shadow-md"
                                                    >
                                                        <Link
                                                            href={register()}
                                                            tabIndex={5}
                                                        >
                                                            {trans(
                                                                'auth.sign_up',
                                                            )}
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}

                                            {status && (
                                                <div className="text-center text-sm font-medium text-green-600">
                                                    {status}
                                                </div>
                                            )}
                                        </>
                                    );
                                }}
                            </Form>
                        </div>

                        <div className="relative hidden bg-slate-100 lg:block">
                            <img
                                src="/images/login-visual.png"
                                alt="Login illustration"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}

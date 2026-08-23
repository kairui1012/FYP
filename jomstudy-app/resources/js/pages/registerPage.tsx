import { reactLang } from '@erag/lang-sync-inertia';
import { Form, Head, Link } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { AppHeaderForUnlogin } from '@/component-new/header/header-for-unlogin';
import { Button } from '@/component-new/button/button';
import { Input } from '@/component-new/ui/input';
import { Label } from '@/component-new/ui/label';
import { Spinner } from '@/component-new/ui/spinner';
import { Card } from '@/component-new/ui/card';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { trans } = reactLang();

    return (
        <>
            <Head title={trans('auth.register_title')}>
                <meta
                    name="robots"
                    content="noindex, nofollow, noarchive"
                    head-key="robots"
                />
                <meta
                    name="description"
                    head-key="description"
                    content="Create your account to join discussions, share study materials, and track your progress."
                />
                <link rel="canonical" href="/register" head-key="canonical" />
            </Head>
            <AppHeaderForUnlogin />

            <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-muted px-3 py-5 sm:px-4 sm:py-6 lg:px-6">
                <Card className="w-full max-w-[clamp(19rem,86vw,52rem)] overflow-hidden rounded-3xl border-0 p-0 shadow-2xl lg:rounded-4xl">
                    <div className="grid lg:grid-cols-2">
                        <div className="bg-background p-3.5 sm:p-5 md:p-6 lg:p-6 xl:p-7">
                            <div className="mb-6 space-y-2 text-left">
                                <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                                    {trans('auth.register_heading')}
                                </h1>
                                <p className="text-xs text-muted-foreground sm:text-sm">
                                    {trans('auth.register_subtitle')}
                                </p>
                            </div>

                            <Form
                                {...store.form()}
                                resetOnSuccess={[
                                    'password',
                                    'password_confirmation',
                                ]}
                                disableWhileProcessing
                                className="flex flex-col gap-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="h-10 w-full">
                                            {Object.values(errors).find(
                                                Boolean,
                                            ) && (
                                                <div className="flex h-full w-full items-center rounded-lg bg-red-600 px-3 text-xs font-medium text-white sm:text-sm">
                                                    {Object.values(errors).find(
                                                        Boolean,
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">
                                                    {trans('auth.name')}
                                                </Label>
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="name"
                                                    name="name"
                                                    placeholder="Full name"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="email">
                                                    {trans(
                                                        'auth.email_address',
                                                    )}
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="email"
                                                    name="email"
                                                    placeholder="email@example.com"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="password">
                                                    {trans('auth.password')}
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="password"
                                                        type={
                                                            showPassword
                                                                ? 'text'
                                                                : 'password'
                                                        }
                                                        required
                                                        tabIndex={3}
                                                        autoComplete="new-password"
                                                        name="password"
                                                        placeholder="Password"
                                                        className="pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowPassword(
                                                                (prev) => !prev,
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
                                                                className="size-4"
                                                                aria-hidden="true"
                                                            />
                                                        ) : (
                                                            <Eye
                                                                className="size-4"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="password_confirmation">
                                                    {trans(
                                                        'auth.confirm_password',
                                                    )}
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="password_confirmation"
                                                        type={
                                                            showConfirmPassword
                                                                ? 'text'
                                                                : 'password'
                                                        }
                                                        required
                                                        tabIndex={4}
                                                        autoComplete="new-password"
                                                        name="password_confirmation"
                                                        placeholder="Confirm password"
                                                        className="pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowConfirmPassword(
                                                                (prev) => !prev,
                                                            )
                                                        }
                                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                                                        aria-label={
                                                            showConfirmPassword
                                                                ? trans(
                                                                      'auth.hide_confirm_password',
                                                                  )
                                                                : trans(
                                                                      'auth.show_confirm_password',
                                                                  )
                                                        }
                                                    >
                                                        {showConfirmPassword ? (
                                                            <EyeOff
                                                                className="size-4"
                                                                aria-hidden="true"
                                                            />
                                                        ) : (
                                                            <Eye
                                                                className="size-4"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="mt-2 h-11 w-full"
                                                tabIndex={5}
                                                data-test="register-user-button"
                                            >
                                                {processing && <Spinner />}
                                                {trans('auth.create_account')}
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                                            {trans('auth.already_have_account')}{' '}
                                            <Button
                                                asChild
                                                className="h-7 rounded-lg bg-black px-2.5 text-xs font-medium text-white transition-all duration-200 hover:bg-zinc-800 hover:shadow-md"
                                            >
                                                <Link
                                                    href={login()}
                                                    tabIndex={6}
                                                >
                                                    {trans('auth.login')}
                                                </Link>
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </div>

                        <div className="relative hidden bg-slate-100 lg:block">
                            <img
                                src="/images/login-visual.png"
                                alt="Registration illustration"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}

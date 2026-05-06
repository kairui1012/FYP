import { reactLang } from '@erag/lang-sync-inertia';
import { Form, Head, Link } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { AppHeaderForUnlogin } from '@/components/app-header-for-unlogin';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthCardLayout from '@/layouts/auth/auth-card-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { trans } = reactLang();

    return (
        <>
            <Head title={trans('auth.register_title')}>
                <meta name="robots" content="noindex, nofollow, noarchive" head-key="robots" />
                <meta
                    name="description"
                    head-key="description"
                    content="Create your account to join discussions, share study materials, and track your progress."
                />
                <link rel="canonical" href="/register" head-key="canonical" />
            </Head>
            <AppHeaderForUnlogin />

            <AuthCardLayout
                title={trans('auth.register_heading')}
                description={trans('auth.register_subtitle')}
            >
                <Form
                    {...store.form()}
                    resetOnSuccess={['password', 'password_confirmation']}
                    disableWhileProcessing
                    className="flex flex-col gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="h-10 w-full">
                                {Object.values(errors).find(Boolean) && (
                                    <div className="flex h-full w-full items-center rounded-lg bg-red-600 px-3 text-xs font-medium text-white sm:text-sm">
                                        {Object.values(errors).find(Boolean)}
                                    </div>
                                )}
                            </div>

                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">{trans('auth.name')}</Label>
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
                                <Label htmlFor="email">{trans('auth.email_address')}</Label>
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
                                <Label htmlFor="password">{trans('auth.password')}</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
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
                                            setShowPassword((prev) => !prev)
                                        }
                                        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground transition-colors hover:text-foreground"
                                        aria-label={
                                            showPassword
                                                ? trans('auth.hide_password')
                                                : trans('auth.show_password')
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-4" aria-hidden="true" />
                                        ) : (
                                            <Eye className="size-4" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    {trans('auth.confirm_password')}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
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
                                            setShowConfirmPassword((prev) => !prev)
                                        }
                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                                        aria-label={
                                            showConfirmPassword
                                                ? trans('auth.hide_confirm_password')
                                                : trans('auth.show_confirm_password')
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="size-4" aria-hidden="true" />
                                        ) : (
                                            <Eye className="size-4" aria-hidden="true" />
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
                                className="h-7 rounded-lg bg-black px-2.5 text-xs font-medium text-white transition-all duration-200 hover:bg-zinc-800 hover:shadow-md">
                                <Link href={login()} tabIndex={6}>
                                    {trans('auth.login')}
                                </Link>
                            </Button>
                        </div>
                        </>
                    )}
                </Form>
            </AuthCardLayout>
        </>
    );
}

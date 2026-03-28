import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import GoogleLoginBtn from '@/components/google-login-btn';
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
    return (
        <div className="flex min-h-svh items-start justify-center bg-muted px-4 pt-10 pb-8 sm:px-6">
            <Head title="Log in" />

            <Card className="w-full max-w-4xl overflow-hidden border-0 p-0 shadow-2xl rounded-4xl">
                <div className="grid md:grid-cols-2">
                    <div className="bg-background p-6 sm:p-10">
                        <div className="mb-8 space-y-2 text-left">
                            <h1 className="text-3xl font-semibold tracking-tight">
                                Login Page
                            </h1>
                            <p className="text-sm text-muted-foreground sm:text-base">
                                Welcome to this website
                            </p>
                        </div>

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="flex flex-col gap-6"
                        >
                            {({ processing, errors }) => {
                                const invalidCredentials =
                                    errors.email ===
                                        'These credentials do not match our records.' ||
                                    errors.password ===
                                        'These credentials do not match our records.';

                                return (
                                <>
                                    <div className="h-11 w-full">
                                        {invalidCredentials && (
                                            <div className="flex h-full w-full items-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white">
                                                Incorrect email or password. Unable to log in.
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid gap-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email address</Label>
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
                                                    'These credentials do not match our records.'
                                                        ? undefined
                                                        : errors.email
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <div className="flex items-center">
                                                <Label htmlFor="password">Password</Label>
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Password"
                                            />
                                            <InputError
                                                message={
                                                    errors.password ===
                                                    'These credentials do not match our records.'
                                                        ? undefined
                                                        : errors.password
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                tabIndex={3}
                                            />
                                            <Label htmlFor="remember">Remember me</Label>
                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="ml-auto flex items-center gap-1 text-sm font-medium no-underline transition-all duration-200 ease-out hover:text-red-600 hover:gap-2"
                                                    tabIndex={5}
                                                >
                                                    Forgot password?
                                                    
                                                </TextLink>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            className="mt-2 h-11 w-full"
                                            tabIndex={4}
                                            disabled={processing}
                                            data-test="login-button"
                                        >
                                            {processing && <Spinner />}
                                            <span className="font-semibold">Login</span>
                                        </Button>

                                        <GoogleLoginBtn />
                                    </div>

                                    {canRegister && (
                                        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                                            <span>Don't have an account?</span>

                                            <Button
                                                asChild
                                                className="h-8 rounded-lg bg-black px-3 text-sm font-medium text-white transition-all duration-200 hover:bg-zinc-800 hover:shadow-md"
                                            >
                                                <Link href={register()} tabIndex={5}>
                                                    Sign up
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

                    <div className="relative hidden bg-slate-100 md:block">
                        <img
                            src="/images/login-visual.svg"
                            alt="Login illustration"
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}
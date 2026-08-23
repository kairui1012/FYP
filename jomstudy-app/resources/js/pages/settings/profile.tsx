import { reactLang } from '@erag/lang-sync-inertia';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/component-new/header/header-for-setting';
import InputError from '@/component-new/shared/input-error';
import { Button } from '@/component-new/button/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/component-new/ui/dialog';
import { Input } from '@/component-new/ui/input';
import { Label } from '@/component-new/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { BreadcrumbItem } from '@/types';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { trans } = reactLang();
    const { auth } = usePage().props;
    const passwordInput = useRef<HTMLInputElement>(null);
    const deleteAccountButton = trans('settings.delete_account_button');
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: trans('settings.profile_breadcrumb'),
            href: edit(),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={trans('settings.profile_breadcrumb')} />

            <h1 className="sr-only">{trans('settings.profile_breadcrumb')}</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title={trans('settings.profile_heading')}
                        description={trans('settings.profile_description')}
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">
                                        {trans('settings.name_label')}
                                    </Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder={trans(
                                            'settings.name_placeholder',
                                        )}
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">
                                        {trans('settings.email_label')}
                                    </Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder={trans(
                                            'settings.email_placeholder',
                                        )}
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                {trans(
                                                    'settings.email_unverified',
                                                )}{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    {trans(
                                                        'settings.resend_verification',
                                                    )}
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    {trans(
                                                        'settings.verification_sent',
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                        className="cursor-pointer"
                                    >
                                        {trans('settings.save')}
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            {trans('settings.saved')}
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title={trans('settings.delete_account_title')}
                        description={trans(
                            'settings.delete_account_description',
                        )}
                    />
                    <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">
                                {trans('settings.delete_warning_title')}
                            </p>
                            <p className="text-sm">
                                {trans('settings.delete_warning_description')}
                            </p>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    data-test="delete-user-button"
                                    className="cursor-pointer"
                                >
                                    {deleteAccountButton}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    {trans('settings.delete_modal_title')}
                                </DialogTitle>
                                <DialogDescription>
                                    {trans('settings.delete_modal_description')}
                                </DialogDescription>
                                <Form
                                    {...ProfileController.destroy.form()}
                                    options={{ preserveScroll: true }}
                                    onError={() =>
                                        passwordInput.current?.focus()
                                    }
                                    resetOnSuccess
                                    className="space-y-6"
                                >
                                    {({
                                        resetAndClearErrors,
                                        processing,
                                        errors,
                                    }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="password"
                                                    className="sr-only"
                                                >
                                                    {trans(
                                                        'settings.current_password_label',
                                                    )}
                                                </Label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    name="password"
                                                    ref={passwordInput}
                                                    placeholder={trans(
                                                        'settings.current_password_placeholder',
                                                    )}
                                                    autoComplete="current-password"
                                                />
                                                <InputError
                                                    message={errors.password}
                                                />
                                            </div>
                                            <DialogFooter className="gap-2">
                                                <DialogClose asChild>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() =>
                                                            resetAndClearErrors()
                                                        }
                                                    >
                                                        {trans(
                                                            'settings.cancel',
                                                        )}
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    variant="destructive"
                                                    disabled={processing}
                                                    asChild
                                                >
                                                    <button
                                                        type="submit"
                                                        data-test="confirm-delete-user-button"
                                                        className="cursor-pointer"
                                                    >
                                                        {deleteAccountButton}
                                                    </button>
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

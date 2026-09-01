import { reactLang } from '@erag/lang-sync-inertia';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, House, RefreshCw } from 'lucide-react';
import AppLogoIcon from '@/components/shared/app-logo-icon';
import { Button } from '@/components/ui/button';

type ErrorPageProps = {
    status: 404 | 500;
};

export default function ErrorPage({ status }: ErrorPageProps) {
    const { trans } = reactLang();
    const isNotFound = status === 404;
    const title = trans(
        isNotFound ? 'errors.not_found_title' : 'errors.server_error_title',
    );
    const description = trans(
        isNotFound
            ? 'errors.not_found_description'
            : 'errors.server_error_description',
    );

    return (
        <main className="flex min-h-dvh items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950">
            <Head title={title} />

            <section className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40">
                    <AppLogoIcon className="h-10 w-10" />
                </div>

                <p className="text-sm font-semibold tracking-widest text-rose-500">
                    {status}
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
                    {title}
                </h1>
                <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {description}
                </p>
                <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    {trans('errors.support_hint')}
                </p>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button asChild>
                        <Link href="/">
                            <House />
                            {trans('errors.home_button')}
                        </Link>
                    </Button>

                    {isNotFound ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft />
                            {trans('errors.back_button')}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCw />
                            {trans('errors.refresh_button')}
                        </Button>
                    )}
                </div>
            </section>
        </main>
    );
}

import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';
import { reactLang } from '@erag/lang-sync-inertia';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Home,
    RefreshCw,
    SearchX,
} from 'lucide-react';
import { lazy, Suspense } from 'react';

const BtnChangeLang = lazy(() =>
    import('@/components/ui/btn-change-lang').then((module) => ({
        default: module.BtnChangeLang,
    })),
);

type ErrorPageProps = {
    status: 404 | 500;
};

export default function ErrorPage({ status }: ErrorPageProps) {
    const { trans } = reactLang();
    const isNotFound = status === 404;
    const Icon = isNotFound ? SearchX : AlertTriangle;
    const title = isNotFound
        ? trans('errors.not_found_title')
        : trans('errors.server_error_title');
    const description = isNotFound
        ? trans('errors.not_found_description')
        : trans('errors.server_error_description');

    const goBack = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        router.visit(home().url);
    };

    const refreshPage = () => {
        window.location.reload();
    };

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Head title={`${status} - ${title}`} />

            <header className="border-b border-sidebar-border/80 bg-background">
                <div className="flex h-16 w-full items-center px-3 md:px-8">
                    <Link
                        href={home()}
                        prefetch
                        className="flex min-w-0 items-center gap-2"
                    >
                        <AppLogo />
                    </Link>

                    <div className="ml-auto">
                        <Suspense
                            fallback={
                                <div
                                    className="h-9 w-20 rounded-full"
                                    aria-hidden="true"
                                />
                            }
                        >
                            <BtnChangeLang />
                        </Suspense>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
                <Card className="w-full max-w-3xl overflow-hidden border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <CardHeader className="gap-6 px-6 pt-8 text-center sm:px-10">
                        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-[#f090aa]/30 bg-[#f090aa]/10 text-[#d95e7e] dark:border-[#F0838F]/40 dark:bg-[#F0838F]/15 dark:text-[#F0838F]">
                            <Icon className="size-8" aria-hidden="true" />
                        </div>

                        <div>
                            <p className="text-7xl leading-none font-bold text-zinc-900 sm:text-8xl dark:text-zinc-100">
                                {status}
                            </p>
                            <CardTitle className="mt-5 text-2xl font-semibold text-zinc-900 sm:text-3xl dark:text-zinc-100">
                                {title}
                            </CardTitle>
                            <CardDescription className="mx-auto mt-3 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
                                {description}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-8 sm:px-10">
                        <div className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
                            <Button
                                asChild
                                size="lg"
                                className="bg-[#de6b89] hover:bg-[#c95c78]"
                            >
                                <Link href={home()}>
                                    <Home
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    {trans('errors.home_button')}
                                </Link>
                            </Button>

                            {isNotFound ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    onClick={goBack}
                                >
                                    <ArrowLeft
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    {trans('errors.back_button')}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    onClick={refreshPage}
                                >
                                    <RefreshCw
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    {trans('errors.refresh_button')}
                                </Button>
                            )}
                        </div>

                        <p className="mx-auto mt-6 max-w-lg text-center text-sm leading-6 text-muted-foreground">
                            {trans('errors.support_hint')}
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

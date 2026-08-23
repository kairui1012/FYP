import { reactLang } from '@erag/lang-sync-inertia';
import { Link, usePage } from '@inertiajs/react';
import {
    Menu,
} from 'lucide-react';
import { lazy, Suspense } from 'react';
import AppLogo from '@/component-new/app/app-logo';
import AppLogoIcon from '@/component-new/app/app-logo-icon';
import { Button } from '@/component-new/button/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/component-new/ui/sheet';
import { home, login, register } from '@/routes';

const BtnChangeLang = lazy(() => import('@/component-new/button/btn-change-lang').then((module) => ({ default: module.BtnChangeLang })));

export function AppHeaderForUnlogin() {
    const page = usePage();
    const { trans } = reactLang();
    const auth = page.props.auth as { user?: { name?: string } | null } | undefined;
    const isLoggedIn = Boolean(auth?.user);

    return (
        <>
            <div className="border-b border-sidebar-border/80">
                <div className="flex h-16 w-full items-center px-2 md:px-8">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 h-8.5 w-8.5"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar"
                            >
                                <SheetTitle className="sr-only">
                                    {trans('navigation.navigation_menu')}
                                </SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            <Link href={home()} className="font-medium">
                                                {trans('navigation.home')}
                                            </Link>
                                        </div>

                                        <div className="flex flex-col space-y-3">
                                            <Link href={login()} className="font-medium">
                                                {trans('navigation.login')}
                                            </Link>
                                            <Link href={register()} className="font-medium">
                                                {trans('navigation.register')}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link
                        href={home()}
                        prefetch
                        className="flex min-w-0 items-center gap-2"
                    >
                        <AppLogo />
                    </Link>


                    {/* Desktop Navigation */}

                    <div className="ml-auto flex items-center space-x-5">
                        <Suspense fallback={<div className="hidden h-9 w-20 rounded-full md:inline-flex" aria-hidden="true" />}>
                            <BtnChangeLang className="bg-white" />
                        </Suspense>

                        {!isLoggedIn && (
                            <>
                                <Button asChild className="hidden md:inline-flex bg-[#de6b89]">
                                    <Link href={login()}>{trans('navigation.login')}</Link>
                                </Button>
                                <Button asChild className="hidden md:inline-flex bg-[#de6b89]">
                                    <Link href={register()}>{trans('navigation.register')}</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

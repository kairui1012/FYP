import { reactLang } from '@erag/lang-sync-inertia';
import { Link, router, usePage } from '@inertiajs/react';
import { House, LogOut, ShieldCheck } from 'lucide-react';
import { lazy, Suspense } from 'react';
import AppLogo from '@/components/shared/app-logo';
import { UserInfo } from '@/components/shared/user-info';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNameInitials } from '@/hooks/use-name-initials';
import { logout } from '@/routes';

const BtnChangeLang = lazy(() =>
    import('@/components/shared/change-language-button').then((module) => ({
        default: module.BtnChangeLang,
    })),
);

export function AppHeaderAdmin() {
    const page = usePage();
    const { auth } = page.props as typeof page.props & { locale?: string };
    const getInitials = useNameInitials();
    const { trans } = reactLang();

    const handleLogout = () => {
        router.flushAll();
    };

    return (
        <div className="border-b border-sidebar-border/80">
            <div className="flex h-16 w-full items-center px-4 md:px-8">
                <Link
                    href="/admin/users"
                    className="flex min-w-0 items-center gap-2"
                >
                    <AppLogo />
                </Link>

                {/* Admin badge */}
                <div className="ml-4 hidden items-center gap-1.5 rounded-full bg-[#e36a8b]/10 px-3 py-1 md:flex">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#e36a8b]" />
                    <span className="text-xs font-semibold text-[#e36a8b]">
                        {trans('admin.admin_panel')}
                    </span>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <Suspense
                        fallback={
                            <div
                                className="hidden h-9 w-20 rounded-full md:inline-flex"
                                aria-hidden="true"
                            />
                        }
                    >
                        <div className="hidden md:block">
                            <BtnChangeLang />
                        </div>
                    </Suspense>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="size-10 rounded-full p-1"
                            >
                                <Avatar className="size-8 overflow-hidden rounded-full">
                                    <AvatarImage
                                        src={auth.user.avatar}
                                        alt={auth.user.name}
                                    />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            sideOffset={10}
                            className="w-56 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm"
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <UserInfo
                                        user={auth.user}
                                        showEmail={true}
                                    />
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuGroup>
                                <DropdownMenuItem asChild>
                                    <Link
                                        className="my-0.5 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-900 transition-colors outline-none focus:bg-neutral-100"
                                        href="/homePage"
                                        prefetch
                                    >
                                        <House className="mr-2 h-4 w-4" />
                                        {trans('admin.enter_website')}
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    className="my-0.5 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-900 transition-colors outline-none focus:bg-neutral-100"
                                    href={logout()}
                                    as="button"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {trans('admin.log_out')}
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}

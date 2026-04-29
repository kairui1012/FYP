import { Link, router, usePage } from '@inertiajs/react';
import { lazy, Suspense } from 'react';
import { LogOut, Settings, ShieldCheck } from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
import { UserInfo } from '@/components/user-info';
import { useInitials } from '@/hooks/use-initials';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';

const BtnChangeLang = lazy(() =>
    import('@/components/ui/btn-change-lang').then((module) => ({
        default: module.BtnChangeLang,
    })),
);

export function AppHeaderAdmin() {
    const page = usePage();
    const { auth } = page.props as typeof page.props & { locale?: string };
    const getInitials = useInitials();

    const handleLogout = () => {
        router.flushAll();
    };

    return (
        <div className="border-b border-sidebar-border/80">
            <div className="flex h-16 w-full items-center px-4 md:px-8">
                <Link href="/admin/users" className="flex min-w-0 items-center gap-2">
                    <AppLogo />
                </Link>

                {/* Admin badge */}
                <div className="ml-4 hidden items-center gap-1.5 rounded-full bg-[#e36a8b]/10 px-3 py-1 md:flex">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#e36a8b]" />
                    <span className="text-xs font-semibold text-[#e36a8b]">Admin Panel</span>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <Suspense fallback={<div className="hidden h-9 w-20 rounded-full md:inline-flex" aria-hidden="true" />}>
                        <div className="hidden md:block">
                            <BtnChangeLang />
                        </div>
                    </Suspense>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-10 rounded-full p-1">
                                <Avatar className="size-8 overflow-hidden rounded-full">
                                    <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
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
                                    <UserInfo user={auth.user} showEmail={true} />
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuGroup>
                                <DropdownMenuItem asChild>
                                    <Link
                                        className="my-0.5 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-900 outline-none transition-colors focus:bg-neutral-100"
                                        href={edit()}
                                        prefetch
                                    >
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    className="my-0.5 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-900 outline-none transition-colors focus:bg-neutral-100"
                                    href={logout()}
                                    as="button"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log Out
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}

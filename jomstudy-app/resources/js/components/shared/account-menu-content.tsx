import { reactLang } from '@erag/lang-sync-inertia';
import { Link, router } from '@inertiajs/react';
import {
    GraduationCap,
    LogOut,
    Settings,
    Shield,
    User as UserIcon,
} from 'lucide-react';
import { UserInfo } from '@/components/shared/user-info';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useMobileNavigationCleanup } from '@/hooks/use-mobile-navigation-cleanup';
import { logout, profilePage } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function AccountMenuContent({ user }: Props) {
    const { trans } = reactLang();
    const cleanup = useMobileNavigationCleanup();
    const normalizedUserRole = (user.role ?? 'student')
        .toString()
        .trim()
        .toLowerCase();
    const isAdmin = normalizedUserRole === 'admin';
    const isVerifiedTeacher =
        normalizedUserRole === 'teacher' && Boolean(user.is_verified);
    const canApplyTeacher = !isAdmin && !isVerifiedTeacher;

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="my-0.5 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-900 transition-colors outline-none focus:bg-neutral-100 focus:text-neutral-900 data-[state=open]:bg-neutral-100"
                        href={profilePage()}
                        prefetch
                        onClick={cleanup}
                    >
                        <UserIcon className="mr-2" />
                        {trans('navigation.profile')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="my-0.5 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-900 transition-colors outline-none focus:bg-neutral-100 focus:text-neutral-900 data-[state=open]:bg-neutral-100"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" />
                        {trans('navigation.settings')}
                    </Link>
                </DropdownMenuItem>
                {canApplyTeacher ? (
                    <DropdownMenuItem asChild>
                        <Link
                            className="my-0.5 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-900 transition-colors outline-none focus:bg-neutral-100 focus:text-neutral-900 data-[state=open]:bg-neutral-100"
                            href="/settings/teacher-certification"
                            prefetch
                            onClick={cleanup}
                        >
                            <GraduationCap className="mr-2" />
                            {trans('settings.teacher_cert_heading')}
                        </Link>
                    </DropdownMenuItem>
                ) : null}
                {isAdmin ? (
                    <DropdownMenuItem asChild>
                        <Link
                            className="my-0.5 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-900 transition-colors outline-none focus:bg-neutral-100 focus:text-neutral-900 data-[state=open]:bg-neutral-100"
                            href="/admin/users"
                            prefetch
                            onClick={cleanup}
                        >
                            <Shield className="mr-2" />
                            {trans('navigation.admin_panel')}
                        </Link>
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="my-0.5 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-900 transition-colors outline-none focus:bg-neutral-100 focus:text-neutral-900 data-[state=open]:bg-neutral-100"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    {trans('navigation.log_out')}
                </Link>
            </DropdownMenuItem>
        </>
    );
}

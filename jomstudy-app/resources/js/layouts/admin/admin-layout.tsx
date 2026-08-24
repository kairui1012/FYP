import { reactLang } from '@erag/lang-sync-inertia';
import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { LayoutDashboard, ShieldAlert, UserCheck, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppHeaderAdmin } from '@/components/shared/admin-header';
import { AppShell } from '@/components/shared/app-shell';
import { cn } from '@/lib/common-helpers';

export default function AdminLayout({ children }: { children: ReactNode }) {
    const page = usePage();
    const { url } = page;
    const locale = (page.props as { locale?: string }).locale ?? 'en';
    const { trans } = reactLang();

    const navItems = [
        { title: trans('admin.nav_all_users'), href: '/admin/users', icon: Users },
        { title: trans('admin.nav_report_records'), href: '/admin/reports', icon: ShieldAlert },
        { title: trans('admin.nav_teacher_applications'), href: '/admin/teacher-applications', icon: UserCheck },
    ];

    return (
        <AppShell variant="header">
            <div className="flex min-h-dvh w-full flex-col pt-16">
                <div className="fixed inset-x-0 top-0 z-50 h-16 w-full bg-background">
                    <AppHeaderAdmin key={`admin-header-${locale}`} />
                </div>
                <div className="flex min-h-0 flex-1">
                    {/* Admin Sidebar */}
                    <aside className="hidden w-56 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
                        <div className="sticky top-16 p-3">
                            <div className="mb-4 flex items-center gap-2 px-2 py-3">
                                <LayoutDashboard className="h-5 w-5 text-[#e27193]" />
                                <span className="text-sm font-semibold text-foreground">{trans('admin.admin_panel')}</span>
                            </div>
                            <nav className="flex flex-col gap-1">
                                {navItems.map((item) => {
                                    const isActive = url.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                                isActive
                                                    ? 'bg-[#e36a8b] text-white'
                                                    : 'text-muted-foreground hover:bg-[#e36a8b]/10 hover:text-foreground',
                                            )}
                                        >
                                            <item.icon className="h-4 w-4 shrink-0" />
                                            {item.title}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="min-w-0 flex-1 p-6 md:p-8">{children}</main>
                </div>
            </div>
        </AppShell>
    );
}

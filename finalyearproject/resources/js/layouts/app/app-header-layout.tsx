import { AppContent } from '@/components/app-content';
import { usePage } from '@inertiajs/react';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    const locale = (usePage().props as { locale?: string }).locale ?? 'en';

    return (
        <AppShell variant="sidebar">
            <div className="flex min-h-screen w-full flex-col ">
                <div className="fixed inset-x-0 top-0 z-50 w-full bg-background">
                    <AppHeader key={`header-${locale}`} breadcrumbs={breadcrumbs} />
                </div>
                <div className="flex min-h-0 flex-1 pt-16">
                    <AppSidebar key={`sidebar-${locale}`} className="top-16" />
                    <AppContent
                        variant="sidebar"
                        className="min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain md:mt-0"
                    >
                        {children}
                    </AppContent>
                </div>
            </div>
        </AppShell>
    );
}

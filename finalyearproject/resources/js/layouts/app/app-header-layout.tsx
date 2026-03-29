import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <div className="flex min-h-screen w-full flex-col">
                <div className="fixed inset-x-0 top-0 z-50 w-full bg-background">
                    <AppHeader breadcrumbs={breadcrumbs} />
                </div>
                <div className="flex flex-1 overflow-hidden pt-16">
                    <AppSidebar className="top-16" />
                    <AppContent
                        variant="sidebar"
                        className="overflow-x-hidden md:mt-0 md:ml-[3%]"
                    >
                        {children}
                    </AppContent>
                </div>
            </div>
        </AppShell>
    );
}

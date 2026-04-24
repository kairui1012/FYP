import { AppContent } from '@/components/app-content';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({
    children,
}: AppLayoutProps) {
    const page = usePage();
    const locale = (page.props as { locale?: string }).locale ?? 'en';
    const pageUrl = page.url;

    useEffect(() => {
        const resetScroll = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

            const sidebarContent = document.querySelector<HTMLElement>(
                '[data-slot="sidebar-content"]',
            );

            if (sidebarContent) {
                sidebarContent.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }

            const sidebarInset = document.querySelector<HTMLElement>(
                '[data-slot="sidebar-inset"]',
            );

            if (sidebarInset) {
                sidebarInset.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }
        };

        const frame = window.requestAnimationFrame(resetScroll);

        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, [pageUrl]);

    return (
        <AppShell variant="sidebar">
            <div className="flex h-screen w-full flex-col overflow-hidden">
                <div className="fixed inset-x-0 top-0 z-50 w-full bg-background">
                    <AppHeader key={`header-${locale}`} />
                </div>
                <div className="flex min-h-0 flex-1 pt-16">
                    <AppSidebar key={`sidebar-${locale}`} className="top-16" />
                    <AppContent
                        key={pageUrl}
                        variant="sidebar"
                        className="min-h-0 flex-1 overflow-y-auto"
                    >
                        {children}
                    </AppContent>
                </div>
            </div>
        </AppShell>
    );
}

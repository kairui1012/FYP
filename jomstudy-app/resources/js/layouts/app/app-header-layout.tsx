import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { AppContent } from '@/component-new/app/app-content';
import { AppHeader } from '@/component-new/header/header';
import { AppShell } from '@/component-new/app/app-shell';
import { AppSidebar } from '@/component-new/app/app-sidebar';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({ children }: AppLayoutProps) {
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
        };

        const frame = window.requestAnimationFrame(resetScroll);

        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, [pageUrl]);

    return (
        <AppShell variant="sidebar">
            <div className="flex min-h-dvh w-full flex-col pt-16">
                <div className="fixed inset-x-0 top-0 z-50 h-16 w-full bg-background">
                    <AppHeader key={`header-${locale}`} />
                </div>
                <div className="flex min-h-0 flex-1">
                    <AppSidebar key={`sidebar-${locale}`} className="top-16" />
                    <AppContent
                        key={pageUrl}
                        variant="sidebar"
                        className="min-h-0 flex-1"
                    >
                        {children}
                    </AppContent>
                </div>
            </div>
        </AppShell>
    );
}

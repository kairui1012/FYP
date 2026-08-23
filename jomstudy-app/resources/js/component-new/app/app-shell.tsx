import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/component-new/ui/sidebar';

type Props = {
    children: ReactNode;
    variant?: 'header' | 'sidebar';
};

export function AppShell({ children, variant = 'header' }: Props) {
    const sidebarOpen = usePage().props.sidebarOpen;

    const defaultSidebarOpen = (() => {
        if (typeof window === 'undefined') {
            return sidebarOpen;
        }

        const pinnedOpen = window.localStorage.getItem('layout.sidebar.pinned-open') === 'true';
        const hoverOpen = window.sessionStorage.getItem('layout.sidebar.hover-open') === 'true';

        return pinnedOpen || hoverOpen || sidebarOpen;
    })();

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">{children}</div>
        );
    }

    return <SidebarProvider defaultOpen={defaultSidebarOpen}>{children}</SidebarProvider>;
}

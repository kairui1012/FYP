import { BookOpen, ChevronLeft, ChevronRight, Flame, FolderGit2, HomeIcon, Settings, Settings2Icon, SettingsIcon, Users } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { homePage } from '@/routes';
import { popularPage } from '@/routes';
import profile from '@/routes/profile';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Home',
        href: homePage(),
        icon: HomeIcon,
    },
    {
        title: 'Popular',
        href: popularPage(),
        icon: Flame,
    },
    {
        title: 'Following',
        href: popularPage(),
        icon: Users,
    },
];


const footerNavItems: NavItem[] = [
    {
        title: 'Setting',
        href: profile.edit(),
        icon: Settings,
    },
    //   {
    //     title: 'Language',
    //     href: ,
    //     icon: Icon,
    // },
];

type AppSidebarProps = {
    className?: string;
};

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_PINNED_STORAGE_KEY = 'layout.sidebar.pinned-open';
const SIDEBAR_HOVER_STORAGE_KEY = 'layout.sidebar.hover-open';

type SidebarBoundaryToggleProps = {
    isCollapsed: boolean;
    isPinnedOpen: boolean;
    onToggle: () => void;
    onHoverOpen: () => void;
};

function SidebarBoundaryToggle({
    isCollapsed,
    isPinnedOpen,
    onToggle,
    onHoverOpen,
}: SidebarBoundaryToggleProps) {
    return (
        <div className="pointer-events-none absolute inset-y-0 right-(--sidebar-toggle-edge-offset) z-40 hidden md:block">
            <div
                className="pointer-events-auto absolute inset-y-0 right-0 w-2"
                onMouseEnter={onHoverOpen}
                aria-hidden="true"
            />

            <button
                type="button"
                aria-label="Toggle sidebar"
                onClick={onToggle}
                className={cn(
                    'pointer-events-auto absolute -right-2 top-(--sidebar-toggle-top) z-50 flex size-10 translate-x-1/2 items-center justify-center rounded-full border-2 shadow-lg ring-2 ring-background transition-all hover:scale-105',
                    isPinnedOpen
                        ? 'border-[#e36a8b] bg-[#e36a8b] text-white'
                        : 'border-sidebar-border bg-background text-foreground hover:border-[#e36a8b] hover:bg-sidebar-accent'
                )}
            >
                {isCollapsed ? (
                    <ChevronRight className="size-4" />
                ) : (
                    <ChevronLeft className="size-4" />
                )}
            </button>
        </div>
    );
}

export function AppSidebar({ className }: AppSidebarProps) {
    const { state, setOpen } = useSidebar();
    const [isPinnedOpen, setIsPinnedOpen] = useState<boolean>(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.localStorage.getItem(SIDEBAR_PINNED_STORAGE_KEY) === 'true';
    });
    const [isHoverOpen, setIsHoverOpen] = useState<boolean>(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.sessionStorage.getItem(SIDEBAR_HOVER_STORAGE_KEY) === 'true';
    });
    const hoverOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );
    const isCollapsed = state === 'collapsed';

    const writePinnedCookie = (value: boolean) => {
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    };

    const writePinnedStorage = (value: boolean) => {
        window.localStorage.setItem(SIDEBAR_PINNED_STORAGE_KEY, String(value));
    };

    const writeHoverStorage = (value: boolean) => {
        window.sessionStorage.setItem(SIDEBAR_HOVER_STORAGE_KEY, String(value));
    };

    const handleToggle = () => {
        if (!isPinnedOpen) {
            setIsPinnedOpen(true);
            setIsHoverOpen(false);
            setOpen(true);
            writePinnedStorage(true);
            writeHoverStorage(false);
            writePinnedCookie(true);
            return;
        }

        setIsPinnedOpen(false);
        setIsHoverOpen(false);
        setOpen(false);
        writePinnedStorage(false);
        writeHoverStorage(false);
        writePinnedCookie(false);
    };

    const handleHoverOpen = () => {
        if (isPinnedOpen) {
            return;
        }

        if (hoverOpenTimeoutRef.current) {
            clearTimeout(hoverOpenTimeoutRef.current);
        }

        hoverOpenTimeoutRef.current = setTimeout(() => {
            setOpen(true);
            setIsHoverOpen(true);
            writeHoverStorage(true);
            // Hover-open is temporary: keep persisted state bound to pin status.
            writePinnedCookie(false);
        }, 180);
    };

    const handleHoverClose = () => {
        if (hoverOpenTimeoutRef.current) {
            clearTimeout(hoverOpenTimeoutRef.current);
            hoverOpenTimeoutRef.current = null;
        }

        if (!isPinnedOpen) {
            setOpen(false);
            setIsHoverOpen(false);
            writeHoverStorage(false);
            writePinnedCookie(false);
        }
    };

    useLayoutEffect(() => {
        // Restore pinned-open or in-progress hover-open state after navigation.
        const shouldBeOpen = isPinnedOpen || isHoverOpen;
        setOpen(shouldBeOpen);
        writePinnedCookie(isPinnedOpen);
    }, [isPinnedOpen, isHoverOpen, setOpen]);

    useEffect(() => {
        return () => {
            if (hoverOpenTimeoutRef.current) {
                clearTimeout(hoverOpenTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            <Sidebar
                collapsible="offcanvas"
                variant="inset"
                className={cn(
                    'group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1+var(--sidebar-peek-width))]',
                    className
                )}
                style={
                    {
                        '--sidebar-width': '20vw',
                        '--sidebar-peek-width': 'clamp(2rem, 2.8vw, 2.75rem)',
                        '--sidebar-toggle-edge-offset': '0.5rem',
                        '--sidebar-toggle-top': '5rem',
                    } as React.CSSProperties
                }
                onMouseLeave={handleHoverClose}
                boundaryControl={
                    <SidebarBoundaryToggle
                        isCollapsed={isCollapsed}
                        isPinnedOpen={isPinnedOpen}
                        onToggle={handleToggle}
                        onHoverOpen={handleHoverOpen}
                    />
                }
            >
                <SidebarContent>
                    <NavMain items={mainNavItems} />
                </SidebarContent>

                <SidebarFooter>
                    <NavFooter items={footerNavItems} className="mt-auto pb-[6%]" />
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        </>
    );
}

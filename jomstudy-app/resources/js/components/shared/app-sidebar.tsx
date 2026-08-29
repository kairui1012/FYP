import { reactLang } from '@erag/lang-sync-inertia';
import { Link, router, usePage } from '@inertiajs/react';
import {
    BarChart2,
    Bookmark,
    ChevronLeft,
    ChevronRight,
    Flame,
    Folder,
    HomeIcon,
    ScrollText,
    Star,
    Trophy,
    Users,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentRoute } from '@/hooks/use-current-route';
import { cn, toUrl } from '@/lib/common-helpers';
import { index as homePage } from '@/routes/feed';
import { index as popularPage } from '@/routes/popular';
import type { NavItem } from '@/types';

type AppSidebarProps = {
    className?: string;
};

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_PINNED_STORAGE_KEY = 'layout.sidebar.pinned-open';
const SIDEBAR_HOVER_STORAGE_KEY = 'layout.sidebar.hover-open';

const isExternalUrl = (href: string) =>
    href.startsWith('http://') || href.startsWith('https://');

type SidebarBoundaryToggleProps = {
    isCollapsed: boolean;
    isPinnedOpen: boolean;
    onToggle: () => void;
    onHoverOpen: () => void;
};

// 粉红小球切换sidebar区域的
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
                    'pointer-events-auto absolute top-(--sidebar-toggle-top) -right-2 z-50 flex size-10 translate-x-1/2 items-center justify-center rounded-full border-2 shadow-lg ring-2 ring-background transition-all hover:scale-105',
                    isPinnedOpen
                        ? 'border-[#e27193] bg-linear-to-r from-[#ef99b0] to-[#e27193] text-white'
                        : 'border-sidebar-border bg-background text-foreground hover:border-[#e27193] hover:bg-linear-to-r hover:from-[#fff3f7] hover:to-[#ffe8f0]',
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
    const { trans } = reactLang();
    const { isCurrentUrl } = useCurrentRoute();

    const currentUserRole =
        (usePage().props as { auth?: { user?: { role?: string } } }).auth?.user
            ?.role ?? 'student';

    const normalizedUserRole = currentUserRole.toString().trim().toLowerCase();

    const mainNavItems: NavItem[] = [
        {
            title: trans('navigation.home'),
            href: homePage(),
            icon: HomeIcon,
        },
        {
            title: trans('navigation.categories'),
            href: '/categories',
            icon: Folder,
        },
        {
            title: trans('navigation.popular'),
            href: popularPage(),
            icon: Flame,
        },
        {
            title: trans('navigation.following'),
            href: '/following',
            icon: Users,
            onClick: (e) => {
                e.preventDefault();
                router.visit('/following', { preserveState: false });
            },
        },
        {
            title: trans('navigation.bookmarks'),
            href: '/bookmarks',
            icon: Bookmark,
        },
        {
            title: trans('navigation.achievements'),
            href: '/achievements',
            icon: Star,
        },
        {
            title: trans('navigation.leaderboard'),
            href: '/leaderboard',
            icon: Trophy,
        },
        {
            title: trans('navigation.rules'),
            href: '/rules',
            icon: ScrollText,
        },
        ...(normalizedUserRole === 'teacher'
            ? [
                  {
                      title: trans('navigation.teacher_material_insights'),
                      href: '/teacher/material-insights',
                      icon: BarChart2,
                  },
              ]
            : []),
    ];
    const footerNavItems: NavItem[] = [];
    const { state, setOpen } = useSidebar();
    const [isPinnedOpen, setIsPinnedOpen] = useState<boolean>(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return (
            window.localStorage.getItem(SIDEBAR_PINNED_STORAGE_KEY) === 'true'
        );
    });
    const [isHoverOpen, setIsHoverOpen] = useState<boolean>(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return (
            window.sessionStorage.getItem(SIDEBAR_HOVER_STORAGE_KEY) === 'true'
        );
    });
    const hoverOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
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
                    className,
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
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>
                            {trans('navigation.navigation_menu')}
                        </SidebarGroupLabel>
                        <SidebarMenu>
                            {mainNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isCurrentUrl(item.href)}
                                        className="mr-auto ml-0 h-10 w-[87.5%] text-[15px] data-[active=true]:bg-[#e36a8b] data-[active=true]:text-white"
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link
                                            href={toUrl(item.href)}
                                            prefetch
                                            onClick={item.onClick}
                                        >
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter className="mt-auto pt-0">
                    <SidebarGroup className="group-data-[collapsible=icon]:p-0">
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {footerNavItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isCurrentUrl(item.href)}
                                            className="h-10 text-[15px] data-[active=true]:bg-[#e36a8b] data-[active=true]:text-white"
                                            tooltip={{ children: item.title }}
                                        >
                                            {isExternalUrl(toUrl(item.href)) ? (
                                                <a
                                                    href={toUrl(item.href)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {item.icon && <item.icon />}
                                                    <span>{item.title}</span>
                                                </a>
                                            ) : (
                                                <Link
                                                    href={toUrl(item.href)}
                                                    prefetch
                                                >
                                                    {item.icon && <item.icon />}
                                                    <span>{item.title}</span>
                                                </Link>
                                            )}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarFooter>
            </Sidebar>
        </>
    );
}

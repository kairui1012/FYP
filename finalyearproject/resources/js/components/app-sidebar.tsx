import { BookOpen, ChevronLeft, ChevronRight, Flame, FolderGit2, HomeIcon, Settings, Settings2Icon, SettingsIcon, Users } from 'lucide-react';
import { useRef, useState } from 'react';
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
        <div className="pointer-events-none absolute inset-y-0 right-0 z-40 hidden md:block">
            <div
                className="pointer-events-auto absolute inset-y-0 right-0 w-[clamp(0.5rem,0.8vw,0.75rem)]"
                onMouseEnter={onHoverOpen}
                aria-hidden="true"
            />

            <button
                type="button"
                aria-label="Toggle sidebar"
                onClick={onToggle}
                className={cn(
                    'pointer-events-auto absolute right-0 top-[clamp(3rem,9vh,5.25rem)] z-50 flex size-[clamp(2.25rem,2.4vw,2.75rem)] translate-x-1/2 items-center justify-center rounded-full border-2 shadow-lg ring-2 ring-background transition-all hover:scale-105',
                    isPinnedOpen
                        ? 'border-[#e36a8b] bg-[#e36a8b] text-white'
                        : 'border-sidebar-border bg-background text-foreground hover:border-[#e36a8b] hover:bg-sidebar-accent'
                )}
            >
                {isCollapsed ? (
                    <ChevronRight className="size-[clamp(0.95rem,1.1vw,1.15rem)]" />
                ) : (
                    <ChevronLeft className="size-[clamp(0.95rem,1.1vw,1.15rem)]" />
                )}
            </button>
        </div>
    );
}

export function AppSidebar({ className }: AppSidebarProps) {
    const { state, setOpen } = useSidebar();
    const [isPinnedOpen, setIsPinnedOpen] = useState(false);
    const hoverOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );
    const isCollapsed = state === 'collapsed';

    const handleToggle = () => {
        if (isPinnedOpen) {
            setIsPinnedOpen(false);
            setOpen(false);
            return;
        }

        setIsPinnedOpen(true);
        setOpen(true);
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
        }, 180);
    };

    const handleHoverClose = () => {
        if (hoverOpenTimeoutRef.current) {
            clearTimeout(hoverOpenTimeoutRef.current);
            hoverOpenTimeoutRef.current = null;
        }

        if (!isPinnedOpen) {
            setOpen(false);
        }
    };

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
                        '--sidebar-peek-width': 'clamp(2rem, 2.8vw, 2.75rem)',
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

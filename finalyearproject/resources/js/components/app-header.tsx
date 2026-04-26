import { Link, router, usePage } from '@inertiajs/react';
import { reactLang } from '@erag/lang-sync-inertia';
import {
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    Bell,
    BookOpen,
    FileText,
    Folder,
    LayoutGrid,
    Menu,
    Search,
    User,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { LeaderboardTitleBadge } from '@/components/LeaderboardTitleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BtnCreatePost } from '@/components/ui/btn-create-post';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { toUrl } from '@/lib/utils';
import { homePage } from '@/routes';
import type { NavItem } from '@/types';

const BtnChangeLang = lazy(() =>
    import('@/components/ui/btn-change-lang').then((module) => ({
        default: module.BtnChangeLang,
    })),
);

const mainNavItems: NavItem[] = [
    {
        title: 'home',
        href: homePage(),
        icon: LayoutGrid,
    },
];

const rightNavItems: NavItem[] = [
    {
        title: 'repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

type SearchUser = {
    id: number;
    name: string;
    avatar: string | null;
    leaderboard_title?: string | null;
    type: 'user';
};
type SearchPost = {
    id: number;
    title: string;
    post_type: string;
    author: string | null;
    author_leaderboard_title?: string | null;
    type: 'post';
};
type SearchResults = { users: SearchUser[]; posts: SearchPost[] };

export function AppHeader() {
    const page = usePage();
    const { trans } = reactLang();
    const { auth } = page.props as typeof page.props & { locale?: string };
    const getInitials = useInitials();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchResults = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setResults(null);
            setIsOpen(false);
            return;
        }
        try {
            const res = await fetch(
                `/search?q=${encodeURIComponent(q.trim())}`,
            );
            const data: SearchResults = await res.json();
            setResults(data);
            setIsOpen(true);
        } catch {
            setResults(null);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchResults(query), 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, fetchResults]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            )
                setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const go = (url: string) => {
        setIsOpen(false);
        setQuery('');
        router.visit(url);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter' || !results) return;
        if (results.users.length > 0) go(`/profilePage/${results.users[0].id}`);
        else if (results.posts.length > 0) go(`/posts/${results.posts[0].id}`);
    };

    const hasResults =
        results && (results.users.length > 0 || results.posts.length > 0);
    const showEmpty = results && !hasResults && query.trim().length >= 2;

    return (
        <>
            <div className="border-b border-sidebar-border/80">
                <div className="flex h-16 w-full items-center px-2 md:px-8">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 h-8.5 w-8.5"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar"
                            >
                                <SheetTitle className="sr-only">
                                    {trans('navigation.navigation_menu')}
                                </SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {mainNavItems.map((item) => (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className="flex items-center space-x-2 font-medium"
                                                >
                                                    {item.icon && (
                                                        <item.icon className="h-5 w-5" />
                                                    )}
                                                    <span>
                                                        {trans(
                                                            `navigation.${item.title}`,
                                                        )}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>

                                        <div className="flex flex-col space-y-4">
                                            {rightNavItems.map((item) => (
                                                <a
                                                    key={item.title}
                                                    href={toUrl(item.href)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-2 font-medium"
                                                >
                                                    {item.icon && (
                                                        <item.icon className="h-5 w-5" />
                                                    )}
                                                    <span>
                                                        {trans(
                                                            `navigation.${item.title}`,
                                                        )}
                                                    </span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link
                        href={homePage()}
                        prefetch
                        className="flex min-w-0 items-center gap-2"
                    >
                        <AppLogo />
                    </Link>

                    <div className="hidden w-full max-w-md flex-1 md:mr-2 md:ml-[10%] md:block">
                        <div ref={containerRef} className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => results && setIsOpen(true)}
                                placeholder={trans(
                                    'navigation.search_placeholder',
                                )}
                                className="h-10 rounded-full border-2 border-[#f090aa] pl-9 focus-visible:border-[#ef97ad] focus-visible:ring-2 focus-visible:ring-[#e36a8b]/35 dark:border-[#F0838F] dark:focus-visible:border-[#F0838F] dark:focus-visible:ring-[#F0838F]/30"
                                aria-label={trans(
                                    'navigation.search_placeholder',
                                )}
                            />
                            {isOpen && (
                                <div className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900">
                                    {showEmpty && (
                                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                                            {trans(
                                                'navigation.search_no_results',
                                            )}
                                        </p>
                                    )}
                                    {hasResults && (
                                        <>
                                            {results!.users.length > 0 && (
                                                <div>
                                                    <p className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                        {trans(
                                                            'navigation.search_users',
                                                        )}
                                                    </p>
                                                    {results!.users.map((u) => (
                                                        <button
                                                            key={u.id}
                                                            onClick={() =>
                                                                go(
                                                                    `/profilePage/${u.id}`,
                                                                )
                                                            }
                                                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-[#f090aa]/10"
                                                        >
                                                            {u.avatar ? (
                                                                <img
                                                                    src={
                                                                        u.avatar
                                                                    }
                                                                    alt={u.name}
                                                                    className="h-7 w-7 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f090aa]/20">
                                                                    <User className="h-4 w-4 text-[#f090aa]" />
                                                                </div>
                                                            )}
                                                            <span className="flex min-w-0 items-center gap-1.5">
                                                                <span className="truncate font-medium">
                                                                    {u.name}
                                                                </span>
                                                                <LeaderboardTitleBadge
                                                                    title={
                                                                        u.leaderboard_title
                                                                    }
                                                                />
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {results!.posts.length > 0 && (
                                                <div
                                                    className={
                                                        results!.users.length >
                                                        0
                                                            ? 'border-t border-neutral-100 dark:border-neutral-800'
                                                            : ''
                                                    }
                                                >
                                                    <p className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                        {trans(
                                                            'navigation.search_posts',
                                                        )}
                                                    </p>
                                                    {results!.posts.map((p) => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() =>
                                                                go(
                                                                    `/posts/${p.id}`,
                                                                )
                                                            }
                                                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-[#f090aa]/10"
                                                        >
                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f090aa]/20">
                                                                <FileText className="h-4 w-4 text-[#f090aa]" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="truncate font-medium">
                                                                    {p.title}
                                                                </div>
                                                                {p.author && (
                                                                    <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                                                                        <span className="truncate">
                                                                            {
                                                                                p.author
                                                                            }
                                                                        </span>
                                                                        <LeaderboardTitleBadge
                                                                            title={
                                                                                p.author_leaderboard_title
                                                                            }
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="ml-auto flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden size-9 md:inline-flex"
                            aria-label={trans('navigation.notifications')}
                        >
                            <Bell className="h-4 w-4" />
                        </Button>

                        <Suspense
                            fallback={
                                <div
                                    className="hidden h-9 w-20 rounded-full md:inline-flex"
                                    aria-hidden="true"
                                />
                            }
                        >
                            <BtnChangeLang />
                        </Suspense>

                        <BtnCreatePost />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="size-10 rounded-full p-1"
                                >
                                    <Avatar className="size-8 overflow-hidden rounded-full">
                                        <AvatarImage
                                            src={auth.user.avatar}
                                            alt={auth.user.name}
                                        />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                sideOffset={10}
                                className="w-56 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm"
                            >
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </>
    );
}

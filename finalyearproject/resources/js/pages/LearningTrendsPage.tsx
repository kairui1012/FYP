import { reactLang } from '@erag/lang-sync-inertia';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    CalendarDays,
    CalendarRange,
    Check,
    ChevronDown,
    Flame,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { LeaderboardTitleBadge } from '@/components/LeaderboardTitleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BtnComment } from '@/components/ui/btn-comment';
import { BtnFollow } from '@/components/ui/btn-follow';
import { BtnLike } from '@/components/ui/btn-like';
import { BtnSave } from '@/components/ui/btn-save';
import { BtnShare } from '@/components/ui/btn-share';
import AppLayout from '@/layouts/app-layout';
import { formatFormulaText } from '@/lib/formula-display';
import { formatTimeAgo, getLanguageLabel } from '@/lib/post-utils';
import { popularPage } from '@/routes';
import like from '@/routes/like';
import type { BreadcrumbItem, PostItem } from '@/types';

const PostAttachments = lazy(() =>
    import('@/components/post-attachments').then((m) => ({
        default: m.PostAttachments,
    })),
);

type PopularRange = 'today' | 'week' | 'month' | 'all';

type LearningTrendsPageProps = {
    posts?: PostItem[];
    activeRange?: PopularRange;
    activeSort?: 'newest' | 'hottest';
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Popular',
        href: popularPage(),
    },
];

type PostFooterProps = {
    likes: number;
    liked: boolean;
    loading?: boolean;
    saves: number;
    saved: boolean;
    saveLoading?: boolean;
    comments: number;
    postId: number;
    onLike: (postId: number) => void;
    onComment: (postId: number) => void;
    onSave: (postId: number) => void;
};

function PostFooter({
    likes,
    liked,
    loading = false,
    saves,
    saved,
    saveLoading = false,
    comments,
    postId,
    onLike,
    onComment,
    onSave,
}: PostFooterProps) {
    return (
        <div className="mt-2 flex items-center gap-3 text-sm text-zinc-900">
            <BtnLike
                count={likes}
                liked={liked}
                loading={loading}
                className="mb-2"
                onClick={() => onLike(postId)}
            />
            <BtnComment
                count={comments}
                className="mb-2"
                onClick={() => onComment(postId)}
            />
            <BtnSave
                count={saves}
                saved={saved}
                loading={saveLoading}
                className="mb-2"
                onClick={() => onSave(postId)}
            />
            <BtnShare className="mb-2" />
        </div>
    );
}

function getLangBadgeProps(code: string) {
    if (code === 'en') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (code === 'zh') return { bg: 'bg-red-100', text: 'text-red-700' };
    if (code === 'bm' || code === 'my')
        return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-gray-200', text: 'text-gray-700' };
}

function getPostTypeBadgeProps(type: string) {
    if (type === 'quiz') return { bg: 'bg-amber-100', text: 'text-amber-700' };
    if (type === 'question')
        return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    return { bg: 'bg-violet-100', text: 'text-violet-700' };
}

function getSubjectBadgeProps() {
    return { bg: 'bg-slate-100', text: 'text-slate-700' };
}

export default function LearningTrendsPage() {
    const { trans } = reactLang();
    const page = usePage<LearningTrendsPageProps>();
    const { props } = page;
    const currentUserId = (page.props as { auth?: { user?: { id?: number } } })
        .auth?.user?.id;

    const [posts, setPosts] = useState<PostItem[]>(props.posts ?? []);
    const [activeRange, setActiveRange] = useState<PopularRange>(
        props.activeRange ?? 'week',
    );
    const [activeSort, setActiveSort] = useState<'newest' | 'hottest'>(
        props.activeSort ?? 'hottest',
    );
    const [isRangeOpen, setIsRangeOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const rangeRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const [likingPostIds, setLikingPostIds] = useState<number[]>([]);
    const [savingPostIds, setSavingPostIds] = useState<number[]>([]);
    const [likeStateByPost, setLikeStateByPost] = useState<
        Record<number, { liked: boolean; likesCount: number }>
    >({});
    const [saveStateByPost, setSaveStateByPost] = useState<
        Record<number, { saved: boolean; savesCount: number }>
    >({});
    const [followStateByUser, setFollowStateByUser] = useState<
        Record<number, boolean>
    >({});
    const [followingUserIds, setFollowingUserIds] = useState<number[]>([]);

    const syncStateFromPosts = (nextPosts: PostItem[]) => {
        setPosts(nextPosts);

        setLikeStateByPost(
            Object.fromEntries(
                nextPosts.map((post) => [
                    post.id,
                    {
                        liked: Boolean(post.is_liked),
                        likesCount: post.likes_count ?? 0,
                    },
                ]),
            ),
        );

        setSaveStateByPost(
            Object.fromEntries(
                nextPosts.map((post) => [
                    post.id,
                    {
                        saved: Boolean(post.is_saved),
                        savesCount: post.saves_count ?? 0,
                    },
                ]),
            ),
        );

        const nextFollowState: Record<number, boolean> = {};
        nextPosts.forEach((post) => {
            if (post.user?.id) {
                nextFollowState[post.user.id] = Boolean(post.user.is_following);
            }
        });
        setFollowStateByUser(nextFollowState);
    };

    useEffect(() => {
        syncStateFromPosts(props.posts ?? []);
    }, [props.posts]);

    useEffect(() => {
        setActiveRange(props.activeRange ?? 'week');
    }, [props.activeRange]);

    useEffect(() => {
        setActiveSort(props.activeSort ?? 'hottest');
    }, [props.activeSort]);

    useEffect(() => {
        setIsRangeOpen(false);
    }, [props.activeRange]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                rangeRef.current &&
                !rangeRef.current.contains(e.target as Node)
            ) {
                setIsRangeOpen(false);
            }
            if (
                sortRef.current &&
                !sortRef.current.contains(e.target as Node)
            ) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const rangeOptions = useMemo(
        () => [
            { value: 'today' as const, label: 'Today', icon: CalendarClock },
            { value: 'week' as const, label: 'This Week', icon: CalendarRange },
            {
                value: 'month' as const,
                label: 'This Month',
                icon: CalendarDays,
            },
            { value: 'all' as const, label: 'All Time', icon: Flame },
        ],
        [],
    );

    const sortOptions = useMemo(
        () => [
            {
                value: 'hottest' as const,
                label: 'Hottest',
                icon: 'fire' as const,
            },
            {
                value: 'newest' as const,
                label: 'Newest',
                icon: 'sparkles' as const,
            },
        ],
        [],
    );

    const activeRangeOption =
        rangeOptions.find((option) => option.value === activeRange) ??
        rangeOptions[0];
    const ActiveRangeIcon = activeRangeOption.icon;

    const goToPost = (postId: number) => {
        router.get(`/posts/${postId}`);
    };

    const goToPostComments = (postId: number) => {
        router.visit(`/posts/${postId}?focus=comments`);
    };

    const loadPosts = (range: PopularRange, sort: 'newest' | 'hottest') => {
        router.get(
            popularPage.url({
                query: { range, sort },
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleLike = async (postId: number) => {
        if (likingPostIds.includes(postId)) {
            return;
        }

        const previous = likeStateByPost[postId] ?? {
            liked: false,
            likesCount: 0,
        };
        const optimisticLiked = !previous.liked;
        const optimisticLikesCount = Math.max(
            0,
            previous.likesCount + (optimisticLiked ? 1 : -1),
        );

        setLikingPostIds((prev) => [...prev, postId]);
        setLikeStateByPost((prev) => ({
            ...prev,
            [postId]: {
                liked: optimisticLiked,
                likesCount: optimisticLikesCount,
            },
        }));

        router.post(
            like.toggle.url({ posts: postId }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    setLikeStateByPost((prev) => ({
                        ...prev,
                        [postId]: previous,
                    }));
                },
                onSuccess: (pageResponse) => {
                    const nextPosts =
                        (pageResponse.props as { posts?: PostItem[] }).posts ??
                        [];
                    syncStateFromPosts(nextPosts);
                },
                onFinish: () => {
                    setLikingPostIds((prev) =>
                        prev.filter((id) => id !== postId),
                    );
                },
            },
        );
    };

    const handleSave = async (postId: number) => {
        if (savingPostIds.includes(postId)) {
            return;
        }

        const previous = saveStateByPost[postId] ?? {
            saved: false,
            savesCount: 0,
        };
        const optimisticSaved = !previous.saved;
        const optimisticSavesCount = Math.max(
            0,
            previous.savesCount + (optimisticSaved ? 1 : -1),
        );

        setSavingPostIds((prev) => [...prev, postId]);
        setSaveStateByPost((prev) => ({
            ...prev,
            [postId]: {
                saved: optimisticSaved,
                savesCount: optimisticSavesCount,
            },
        }));

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';

        try {
            const response = await fetch(`/posts/${postId}/save`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to toggle save.');
            }

            const payload = (await response.json()) as {
                saved: boolean;
                saves_count: number;
            };

            setSaveStateByPost((prev) => ({
                ...prev,
                [postId]: {
                    saved: payload.saved,
                    savesCount: payload.saves_count,
                },
            }));
        } catch {
            setSaveStateByPost((prev) => ({
                ...prev,
                [postId]: previous,
            }));
        } finally {
            setSavingPostIds((prev) => prev.filter((id) => id !== postId));
        }
    };

    const handleFollowToggle = async (userId: number) => {
        if (followingUserIds.includes(userId)) {
            return;
        }

        const previous = followStateByUser[userId] ?? false;
        const optimistic = !previous;

        setFollowingUserIds((prev) => [...prev, userId]);
        setFollowStateByUser((prev) => ({
            ...prev,
            [userId]: optimistic,
        }));

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';

        try {
            const response = await fetch(`/users/${userId}/follow`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Follow toggle failed.');
            }

            const payload = (await response.json()) as {
                is_following: boolean;
            };
            setFollowStateByUser((prev) => ({
                ...prev,
                [userId]: payload.is_following,
            }));
        } catch {
            setFollowStateByUser((prev) => ({
                ...prev,
                [userId]: previous,
            }));
        } finally {
            setFollowingUserIds((prev) => prev.filter((id) => id !== userId));
        }
    };

    return (
        <>
            <Head title={trans('navigation.popular')} />
            <div className="pb-8">
                <div className="mx-auto w-full max-w-3xl space-y-2 p-4 md:p-6 md:pb-10">
                    {/* Filter toolbar */}
                    <div className="flex items-center justify-between gap-3">
                        {/* Time Range dropdown */}
                        <div className="relative" ref={rangeRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRangeOpen((v) => !v);
                                    setIsSortOpen(false);
                                }}
                                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                            >
                                <ActiveRangeIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                {activeRangeOption.label}
                                <ChevronDown
                                    className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isRangeOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {isRangeOpen && (
                                <div className="absolute top-full left-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                                    {rangeOptions.map((option) => {
                                        const Icon = option.icon;
                                        const isActive =
                                            activeRange === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    setActiveRange(
                                                        option.value,
                                                    );
                                                    setIsRangeOpen(false);
                                                    loadPosts(
                                                        option.value,
                                                        activeSort,
                                                    );
                                                }}
                                                className={`my-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                                                    isActive
                                                        ? 'bg-neutral-100 font-medium text-neutral-900'
                                                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                                                }`}
                                            >
                                                <Icon className="h-4 w-4 shrink-0" />
                                                <span className="flex-1 text-left text-sm font-medium text-neutral-900">
                                                    {option.label}
                                                </span>
                                                {isActive ? (
                                                    <span className="flex size-5 items-center justify-center rounded-full bg-[#de6b89]/12 text-[#de6b89]">
                                                        <Check className="size-3.5" />
                                                    </span>
                                                ) : (
                                                    <span className="size-5 rounded-full border border-transparent" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Sort By dropdown */}
                        <div className="relative" ref={sortRef}>
                            {(() => {
                                const activeSortOption =
                                    sortOptions.find(
                                        (o) => o.value === activeSort,
                                    ) ?? sortOptions[0];
                                return (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsSortOpen((v) => !v);
                                                setIsRangeOpen(false);
                                            }}
                                            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                        >
                                            {activeSortOption.icon ===
                                            'fire' ? (
                                                <TrendingUp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                            ) : (
                                                <Sparkles className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                            )}
                                            {activeSortOption.label}
                                            <ChevronDown
                                                className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        {isSortOpen && (
                                            <div className="absolute top-full right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                                                {sortOptions.map((option) => {
                                                    const isActive =
                                                        activeSort ===
                                                        option.value;
                                                    return (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveSort(
                                                                    option.value,
                                                                );
                                                                setIsSortOpen(
                                                                    false,
                                                                );
                                                                loadPosts(
                                                                    activeRange,
                                                                    option.value,
                                                                );
                                                            }}
                                                            className={`my-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                                                                isActive
                                                                    ? 'bg-neutral-100 font-medium text-neutral-900'
                                                                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                                                            }`}
                                                        >
                                                            {option.icon ===
                                                            'fire' ? (
                                                                <TrendingUp className="h-4 w-4 shrink-0" />
                                                            ) : (
                                                                <Sparkles className="h-4 w-4 shrink-0" />
                                                            )}
                                                            <span className="flex-1 text-left text-sm font-medium text-neutral-900">
                                                                {option.label}
                                                            </span>
                                                            {isActive ? (
                                                                <span className="flex size-5 items-center justify-center rounded-full bg-[#de6b89]/12 text-[#de6b89]">
                                                                    <Check className="size-3.5" />
                                                                </span>
                                                            ) : (
                                                                <span className="size-5 rounded-full border border-transparent" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {posts.length === 0 ? (
                        <div className="border border-dashed border-zinc-300 bg-white px-6 py-16 text-center text-3xl text-zinc-500">
                            <p>{trans('popular.no_posts')}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {posts.map((post) => {
                                return (
                                    <div key={post.id}>
                                        <article
                                            className="mb-2 cursor-pointer rounded-xl p-5 transition-colors hover:bg-[#F2F4F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                                            onClick={() => goToPost(post.id)}
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === 'Enter' ||
                                                    event.key === ' '
                                                ) {
                                                    event.preventDefault();
                                                    goToPost(post.id);
                                                }
                                            }}
                                            role="link"
                                            tabIndex={0}
                                        >
                                            <header className="mb-2 flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Link
                                                        href={
                                                            post.user?.id
                                                                ? `/profilePage/${post.user.id}`
                                                                : '/profilePage'
                                                        }
                                                        className="peer group/avatar cursor-pointer"
                                                        onClick={(event) =>
                                                            event.stopPropagation()
                                                        }
                                                    >
                                                        <Avatar className="h-10 w-10 ring-2 ring-transparent transition-colors group-hover/avatar:ring-[#ef99b0]">
                                                            {post.user
                                                                ?.avatar ? (
                                                                <AvatarImage
                                                                    src={
                                                                        post
                                                                            .user
                                                                            .avatar
                                                                    }
                                                                    alt={
                                                                        post
                                                                            .user
                                                                            ?.name ??
                                                                        'User avatar'
                                                                    }
                                                                />
                                                            ) : null}
                                                            <AvatarFallback className="bg-zinc-200 text-sm font-semibold text-zinc-700">
                                                                {(
                                                                    post.user
                                                                        ?.name ??
                                                                    'U'
                                                                )
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </Link>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-3 flex items-center gap-1.5 text-base">
                                                            <Link
                                                                href={
                                                                    post.user
                                                                        ?.id
                                                                        ? `/profilePage/${post.user.id}`
                                                                        : '/profilePage'
                                                                }
                                                                className="cursor-pointer font-semibold text-zinc-900 transition-colors peer-hover:text-[#de6b89] hover:text-[#de6b89]"
                                                                onClick={(
                                                                    event,
                                                                ) =>
                                                                    event.stopPropagation()
                                                                }
                                                            >
                                                                {post.user
                                                                    ?.name ??
                                                                    'Unknown User'}
                                                            </Link>
                                                            <LeaderboardTitleBadge
                                                                title={
                                                                    post.user
                                                                        ?.leaderboard_title
                                                                }
                                                            />
                                                            {post.user?.id &&
                                                            currentUserId &&
                                                            post.user.id !==
                                                                currentUserId ? (
                                                                <BtnFollow
                                                                    following={
                                                                        followStateByUser[
                                                                            post
                                                                                .user
                                                                                .id
                                                                        ] ??
                                                                        Boolean(
                                                                            post
                                                                                .user
                                                                                .is_following,
                                                                        )
                                                                    }
                                                                    loading={followingUserIds.includes(
                                                                        post
                                                                            .user
                                                                            .id,
                                                                    )}
                                                                    onClick={() =>
                                                                        handleFollowToggle(
                                                                            post
                                                                                .user!
                                                                                .id,
                                                                        )
                                                                    }
                                                                />
                                                            ) : null}
                                                            <span className="text-zinc-400">
                                                                •
                                                            </span>
                                                            <span className="text-sm text-zinc-500">
                                                                {formatTimeAgo(
                                                                    post.created_at,
                                                                )}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                                                            {(() => {
                                                                const type =
                                                                    post.post_type ===
                                                                    'quiz'
                                                                        ? 'quiz'
                                                                        : post.post_type ===
                                                                            'question'
                                                                          ? 'question'
                                                                          : 'material';
                                                                const {
                                                                    bg,
                                                                    text,
                                                                } =
                                                                    getPostTypeBadgeProps(
                                                                        type,
                                                                    );
                                                                const label =
                                                                    type ===
                                                                    'quiz'
                                                                        ? trans(
                                                                              'createPost.create_quiz',
                                                                          )
                                                                        : type ===
                                                                            'question'
                                                                          ? trans(
                                                                                'createPost.ask_question',
                                                                            )
                                                                          : trans(
                                                                                'createPost.share_material',
                                                                            );

                                                                return (
                                                                    <span
                                                                        className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}
                                                                    >
                                                                        {label}
                                                                    </span>
                                                                );
                                                            })()}
                                                            {(() => {
                                                                const code =
                                                                    post
                                                                        .language
                                                                        ?.code ||
                                                                    'en';
                                                                const {
                                                                    bg,
                                                                    text,
                                                                } =
                                                                    getLangBadgeProps(
                                                                        code,
                                                                    );
                                                                const label =
                                                                    post
                                                                        .language
                                                                        ?.name ??
                                                                    getLanguageLabel(
                                                                        code,
                                                                    );
                                                                return (
                                                                    <span
                                                                        className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}
                                                                    >
                                                                        {label}
                                                                    </span>
                                                                );
                                                            })()}
                                                            {post.subject?.name
                                                                ? (() => {
                                                                      const {
                                                                          bg,
                                                                          text,
                                                                      } =
                                                                          getSubjectBadgeProps();
                                                                      return (
                                                                          <span
                                                                              className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}
                                                                          >
                                                                              {
                                                                                  post
                                                                                      .subject
                                                                                      .name
                                                                              }
                                                                          </span>
                                                                      );
                                                                  })()
                                                                : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            </header>

                                            <h2 className="mb-2 text-lg font-bold text-zinc-900">
                                                {post.title}
                                            </h2>
                                            <p className="mb-2 text-base leading-6 font-medium whitespace-pre-wrap text-zinc-700">
                                                {formatFormulaText(
                                                    post.content ?? '',
                                                )}
                                            </p>

                                            <Suspense
                                                fallback={
                                                    <div className="h-48 rounded-xl bg-zinc-100" />
                                                }
                                            >
                                                <PostAttachments
                                                    files={post.image}
                                                    compact
                                                />
                                            </Suspense>
                                        </article>

                                        {(() => {
                                            const likeState = likeStateByPost[
                                                post.id
                                            ] ?? {
                                                liked: Boolean(post.is_liked),
                                                likesCount:
                                                    post.likes_count ?? 0,
                                            };
                                            const saveState = saveStateByPost[
                                                post.id
                                            ] ?? {
                                                saved: Boolean(post.is_saved),
                                                savesCount:
                                                    post.saves_count ?? 0,
                                            };

                                            return (
                                                <PostFooter
                                                    postId={post.id}
                                                    likes={likeState.likesCount}
                                                    liked={likeState.liked}
                                                    loading={likingPostIds.includes(
                                                        post.id,
                                                    )}
                                                    saves={saveState.savesCount}
                                                    saved={saveState.saved}
                                                    saveLoading={savingPostIds.includes(
                                                        post.id,
                                                    )}
                                                    comments={
                                                        post.comments_count ?? 0
                                                    }
                                                    onLike={handleLike}
                                                    onComment={goToPostComments}
                                                    onSave={handleSave}
                                                />
                                            );
                                        })()}
                                        <div className="mt-1 w-full border-t border-zinc-200"></div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

LearningTrendsPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

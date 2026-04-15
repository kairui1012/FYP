import { Head, Link, router } from '@inertiajs/react';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
const PostAttachments = lazy(() => import('@/components/post-attachments').then(m => ({ default: m.PostAttachments })));
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BtnComment } from '@/components/ui/btn-comment';
import { BtnFollow } from '@/components/ui/btn-follow';
import { BtnLike } from '@/components/ui/btn-like';
import { BtnShare } from '@/components/ui/btn-share';
import { BtnSave } from '@/components/ui/btn-save';
import { formatTimeAgo } from '@/lib/post-utils';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem, PostItem } from '@/types';
import { usePage } from '@inertiajs/react';
import like from '@/routes/like';
import { formatFormulaText } from '@/lib/formula-display';

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
                onClick={() => onSave(postId)}
            />
            <BtnShare className="mb-2" />
        </div>
    );
}

type HomePageProps = {
    posts?: PostItem[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Home',
        href: homePage(),
    },
];

function getLangBadgeProps(code: string) {
    if (code === 'en') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (code === 'zh') return { bg: 'bg-red-100', text: 'text-red-700' };
    if (code === 'bm' || code === 'my') return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-gray-200', text: 'text-gray-700' };
}

function getPostTypeBadgeProps(type: string) {
    if (type === 'quiz') return { bg: 'bg-amber-100', text: 'text-amber-700' };
    if (type === 'question') return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    return { bg: 'bg-violet-100', text: 'text-violet-700' };
}

function getSubjectBadgeProps() {
    return { bg: 'bg-slate-100', text: 'text-slate-700' };
}

function trans(key: string, page: any) {
    const parts = key.split('.');
    let obj = page.props?.lang;
    for (const part of parts) {
        if (obj && typeof obj === 'object' && part in obj) {
            obj = obj[part];
        } else {
            return key;
        }
    }
    return typeof obj === 'string' ? obj : key;
}

export default function HomePage({ posts = [] }: HomePageProps) {
    const page = usePage();
    const currentUserId = (page.props as { auth?: { user?: { id?: number } } }).auth?.user?.id;
    const [likeStateByPost, setLikeStateByPost] = useState<Record<number, { liked: boolean; likesCount: number }>>(
        () => Object.fromEntries(
            posts.map((post) => [
                post.id,
                {
                    liked: Boolean(post.is_liked),
                    likesCount: post.likes_count ?? 0,
                },
            ])
        )
    );
    const [likingPostIds, setLikingPostIds] = useState<number[]>([]);
    const [saveStateByPost, setSaveStateByPost] = useState<Record<number, { saved: boolean; savesCount: number }>>(
        () => Object.fromEntries(
            posts.map((post) => [
                post.id,
                {
                    saved: Boolean(post.is_saved),
                    savesCount: post.saves_count ?? 0,
                },
            ])
        )
    );
    const [savingPostIds, setSavingPostIds] = useState<number[]>([]);
    const [followStateByUser, setFollowStateByUser] = useState<Record<number, boolean>>(() => {
        const states: Record<number, boolean> = {};
        posts.forEach((post) => {
            if (post.user?.id) {
                states[post.user.id] = Boolean(post.user.is_following);
            }
        });
        return states;
    });
    const [followingUserIds, setFollowingUserIds] = useState<number[]>([]);

    const goToPost = (postId: number) => {
        router.get(`/posts/${postId}`);
    };

    const goToPostComments = (postId: number) => {
        router.visit(`/posts/${postId}?focus=comments`);
    };

    const handleLike = async (postId: number) => {
        if (likingPostIds.includes(postId)) {
            return;
        }

        const previous = likeStateByPost[postId] ?? { liked: false, likesCount: 0 };
        const optimisticLiked = !previous.liked;
        const optimisticLikesCount = Math.max(
            0,
            previous.likesCount + (optimisticLiked ? 1 : -1)
        );

        setLikingPostIds((prev) => [...prev, postId]);
        setLikeStateByPost((prev) => ({
            ...prev,
            [postId]: {
                liked: optimisticLiked,
                likesCount: optimisticLikesCount,
            },
        }));

        router.post(like.toggle.url({ posts: postId }), {}, {
            preserveScroll: true,
            preserveState: true,
            onError: () => {
                setLikeStateByPost((prev) => ({
                    ...prev,
                    [postId]: previous,
                }));
            },
            onSuccess: (page) => {
                const nextPosts = ((page.props as { posts?: PostItem[] }).posts ?? []);

                setLikeStateByPost(
                    Object.fromEntries(
                        nextPosts.map((post) => [
                            post.id,
                            {
                                liked: Boolean(post.is_liked),
                                likesCount: post.likes_count ?? 0,
                            },
                        ])
                    )
                );
            },
            onFinish: () => {
                setLikingPostIds((prev) => prev.filter((id) => id !== postId));
            },
        });
    };

    const handleSave = async (postId: number) => {
        if (savingPostIds.includes(postId)) {
            return;
        }

        const previous = saveStateByPost[postId] ?? { saved: false, savesCount: 0 };
        const optimisticSaved = !previous.saved;
        const optimisticSavesCount = Math.max(
            0,
            previous.savesCount + (optimisticSaved ? 1 : -1)
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

            const payload = (await response.json()) as { is_following: boolean };
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

    useEffect(() => {
        // Guard against a stale Inertia progress state that can leave cursor styles behind.
        document.documentElement.classList.remove('nprogress-busy');
        document.body.classList.remove('nprogress-busy');
        document.documentElement.style.cursor = '';
        document.body.style.cursor = '';
    }, []);

    return (
        <>
            <Head title="Home" />
            <div className="pb-8">
                <div className="mx-auto w-full max-w-3xl space-y-2 p-4 md:p-6 md:pb-10">
                    {posts.length === 0 ? (
                        <div className="rounded-3xl border border-zinc-600 bg-white p-10 text-center text-zinc-500">
                            No posts yet. Be the first to post!
                        </div>
                    ) : (
                        posts.map((post) => (
                            <div key={post.id}>
                                <article
                                    className="cursor-pointer rounded-xl p-5 transition-colors hover:bg-[#F2F4F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 mb-2"
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
                                    <header className=" flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={post.user?.id ? `/profilePage/${post.user.id}` : '/profilePage'}
                                                className="peer group/avatar cursor-pointer"
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                <Avatar className="h-10 w-10 ring-2 ring-transparent transition-colors group-hover/avatar:ring-[#ef99b0]">
                                                    {post.user?.avatar ? (
                                                        <AvatarImage
                                                            src={post.user.avatar}
                                                            alt={post.user?.name ?? 'User avatar'}
                                                        />
                                                    ) : null}
                                                    <AvatarFallback className="bg-zinc-200 text-sm font-semibold text-zinc-700">
                                                        {(post.user?.name ?? 'U')
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Link>
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-3 flex items-center gap-1.5 text-base">
                                                    <Link
                                                        href={post.user?.id ? `/profilePage/${post.user.id}` : '/profilePage'}
                                                        className="cursor-pointer font-semibold text-zinc-900 transition-colors hover:text-[#de6b89] peer-hover:text-[#de6b89]"
                                                        onClick={(event) => event.stopPropagation()}
                                                    >
                                                        {post.user?.name ?? 'Unknown User'}
                                                    </Link>
                                                    {post.user?.id && currentUserId && post.user.id !== currentUserId ? (
                                                        <BtnFollow
                                                            following={followStateByUser[post.user.id] ?? Boolean(post.user.is_following)}
                                                            loading={followingUserIds.includes(post.user.id)}
                                                            onClick={() => handleFollowToggle(post.user!.id)}
                                                        />
                                                    ) : null}
                                                    <span className="text-zinc-400">•</span>
                                                    <span className="text-zinc-500 text-sm">
                                                        {formatTimeAgo(post.created_at)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                                                    {(() => {
                                                        const type = post.post_type === 'quiz'
                                                            ? 'quiz'
                                                            : post.post_type === 'question'
                                                                ? 'question'
                                                                : 'material';
                                                        const { bg, text } = getPostTypeBadgeProps(type);
                                                        const label = type === 'quiz'
                                                            ? trans('createPost.create_quiz', page)
                                                            : type === 'question'
                                                                ? trans('createPost.ask_question', page)
                                                                : trans('createPost.share_material', page);

                                                        return (
                                                            <span className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}>
                                                                {label}
                                                            </span>
                                                        );
                                                    })()}
                                                    {(() => {
                                                        const code = post.language?.code || 'en';
                                                        const { bg, text } = getLangBadgeProps(code);
                                                        const label = trans(`language_label.${code}`, page);
                                                        return (
                                                            <span className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}>
                                                                {label}
                                                            </span>
                                                        );
                                                    })()}
                                                    {post.subject?.name ? (() => {
                                                        const { bg, text } = getSubjectBadgeProps();
                                                        return (
                                                            <span className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}>
                                                                {post.subject.name}
                                                            </span>
                                                        );
                                                    })() : null}
                                                </div>
                                            </div>
                                        </div>
                                    </header>

                                    <h2 className="mb-2 text-lg font-bold text-zinc-900">
                                        {post.title}
                                    </h2>
                                    <p className="mb-2 text-base font-medium leading-6 whitespace-pre-wrap text-zinc-700">
                                        {formatFormulaText(post.content ?? '')}
                                    </p>

                                    <Suspense fallback={<div className="h-48 rounded-xl bg-zinc-100" />}>
                                        <PostAttachments files={post.image} compact />
                                    </Suspense>
                                </article>
                                {(() => {
                                    const likeState = likeStateByPost[post.id] ?? {
                                        liked: Boolean(post.is_liked),
                                        likesCount: post.likes_count ?? 0,
                                    };
                                    const saveState = saveStateByPost[post.id] ?? {
                                        saved: Boolean(post.is_saved),
                                        savesCount: post.saves_count ?? 0,
                                    };

                                    return (
                                <PostFooter
                                    postId={post.id}
                                    likes={likeState.likesCount}
                                    liked={likeState.liked}
                                    loading={likingPostIds.includes(post.id)}
                                    saves={saveState.savesCount}
                                    saved={saveState.saved}
                                    saveLoading={savingPostIds.includes(post.id)}
                                    comments={post.comments_count ?? 0}
                                    onLike={handleLike}
                                    onComment={goToPostComments}
                                    onSave={handleSave}
                                />
                                    );
                                })()}
                                <div className=" w-full border-t border-zinc-200 mt-1"></div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

HomePage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

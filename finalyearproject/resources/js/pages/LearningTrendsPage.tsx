import { reactLang } from '@erag/lang-sync-inertia';
import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { LearningTrendsEmptyState } from '@/components/learning-trends/learning-trends-empty-state';
import { LearningTrendsPostCard } from '@/components/learning-trends/learning-trends-post-card';
import { LearningTrendsToolbar } from '@/components/learning-trends/learning-trends-toolbar';
import type {
    LearningTrendsPageProps,
    PopularRange,
    PopularSort,
} from '@/components/learning-trends/types';
import AppLayout from '@/layouts/app-layout';
import { popularPage } from '@/routes';
import like from '@/routes/like';
import type { BreadcrumbItem, PostItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Popular',
        href: popularPage(),
    },
];

function csrfHeaders() {
    const csrfToken =
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? '';

    return {
        Accept: 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
    };
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
    const [activeSort, setActiveSort] = useState<PopularSort>(
        props.activeSort ?? 'hottest',
    );
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

    const syncStateFromPosts = useCallback((nextPosts: PostItem[]) => {
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
    }, []);

    useEffect(() => {
        syncStateFromPosts(props.posts ?? []);
    }, [props.posts, syncStateFromPosts]);

    useEffect(() => {
        setActiveRange(props.activeRange ?? 'week');
    }, [props.activeRange]);

    useEffect(() => {
        setActiveSort(props.activeSort ?? 'hottest');
    }, [props.activeSort]);

    const goToPost = (postId: number) => {
        router.get(`/posts/${postId}`);
    };

    const goToPostComments = (postId: number) => {
        router.visit(`/posts/${postId}?focus=comments`);
    };

    const loadPosts = (range: PopularRange, sort: PopularSort) => {
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

    const handleRangeChange = (range: PopularRange) => {
        setActiveRange(range);
        loadPosts(range, activeSort);
    };

    const handleSortChange = (sort: PopularSort) => {
        setActiveSort(sort);
        loadPosts(activeRange, sort);
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

        try {
            const response = await fetch(`/posts/${postId}/save`, {
                method: 'POST',
                headers: csrfHeaders(),
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

        try {
            const response = await fetch(`/users/${userId}/follow`, {
                method: 'POST',
                headers: csrfHeaders(),
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
                    <LearningTrendsToolbar
                        activeRange={activeRange}
                        activeSort={activeSort}
                        onRangeChange={handleRangeChange}
                        onSortChange={handleSortChange}
                        trans={trans}
                    />

                    {posts.length === 0 ? (
                        <LearningTrendsEmptyState
                            message={trans('popular.no_posts')}
                        />
                    ) : (
                        <div className="space-y-2">
                            {posts.map((post) => {
                                const likeState = likeStateByPost[post.id] ?? {
                                    liked: Boolean(post.is_liked),
                                    likesCount: post.likes_count ?? 0,
                                };
                                const saveState = saveStateByPost[post.id] ?? {
                                    saved: Boolean(post.is_saved),
                                    savesCount: post.saves_count ?? 0,
                                };
                                const userId = post.user?.id;

                                return (
                                    <LearningTrendsPostCard
                                        key={post.id}
                                        post={post}
                                        currentUserId={currentUserId}
                                        liked={likeState.liked}
                                        likesCount={likeState.likesCount}
                                        saved={saveState.saved}
                                        savesCount={saveState.savesCount}
                                        likeLoading={likingPostIds.includes(
                                            post.id,
                                        )}
                                        saveLoading={savingPostIds.includes(
                                            post.id,
                                        )}
                                        following={
                                            userId
                                                ? (followStateByUser[userId] ??
                                                  Boolean(
                                                      post.user?.is_following,
                                                  ))
                                                : false
                                        }
                                        followLoading={
                                            userId
                                                ? followingUserIds.includes(
                                                      userId,
                                                  )
                                                : false
                                        }
                                        trans={trans}
                                        onLike={handleLike}
                                        onComment={goToPostComments}
                                        onSave={handleSave}
                                        onFollowToggle={handleFollowToggle}
                                        onOpenPost={goToPost}
                                    />
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

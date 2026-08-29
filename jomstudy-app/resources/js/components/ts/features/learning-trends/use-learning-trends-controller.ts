import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { index as popularPage } from '@/routes/popular';
import postsLikes from '@/routes/posts/likes';
import type { PostItem } from '@/types';
import type { PopularRange, PopularSort } from './learning-trends-types';

type UseLearningTrendsControllerParams = {
    posts: PostItem[];
    activeRange: PopularRange;
    activeSort: PopularSort;
};

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

export function useLearningTrendsController({
    posts: incomingPosts,
    activeRange: incomingRange,
    activeSort: incomingSort,
}: UseLearningTrendsControllerParams) {
    const [posts, setPosts] = useState<PostItem[]>(incomingPosts ?? []);
    const [activeRange, setActiveRange] = useState<PopularRange>(
        incomingRange ?? 'week',
    );
    const [activeSort, setActiveSort] = useState<PopularSort>(
        incomingSort ?? 'hottest',
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

    // Refs mirror the in-flight id lists so syncStateFromPosts (a stable
    // useCallback) can read the latest values without being re-created.
    const likingPostIdsRef = useRef<number[]>(likingPostIds);
    const savingPostIdsRef = useRef<number[]>(savingPostIds);
    const followingUserIdsRef = useRef<number[]>(followingUserIds);
    likingPostIdsRef.current = likingPostIds;
    savingPostIdsRef.current = savingPostIds;
    followingUserIdsRef.current = followingUserIds;

    const syncStateFromPosts = useCallback((nextPosts: PostItem[]) => {
        setPosts(nextPosts);

        // Re-seed from server data, but keep any post/user that currently has an
        // in-flight optimistic action so a props update doesn't clobber it.
        setLikeStateByPost((prev) => {
            const next: Record<number, { liked: boolean; likesCount: number }> =
                {};
            nextPosts.forEach((post) => {
                next[post.id] = likingPostIdsRef.current.includes(post.id)
                    ? (prev[post.id] ?? {
                          liked: Boolean(post.is_liked),
                          likesCount: post.likes_count ?? 0,
                      })
                    : {
                          liked: Boolean(post.is_liked),
                          likesCount: post.likes_count ?? 0,
                      };
            });
            return next;
        });

        setSaveStateByPost((prev) => {
            const next: Record<number, { saved: boolean; savesCount: number }> =
                {};
            nextPosts.forEach((post) => {
                next[post.id] = savingPostIdsRef.current.includes(post.id)
                    ? (prev[post.id] ?? {
                          saved: Boolean(post.is_saved),
                          savesCount: post.saves_count ?? 0,
                      })
                    : {
                          saved: Boolean(post.is_saved),
                          savesCount: post.saves_count ?? 0,
                      };
            });
            return next;
        });

        setFollowStateByUser((prev) => {
            const next: Record<number, boolean> = {};
            nextPosts.forEach((post) => {
                const userId = post.user?.id;
                if (!userId) return;
                next[userId] = followingUserIdsRef.current.includes(userId)
                    ? (prev[userId] ?? Boolean(post.user?.is_following))
                    : Boolean(post.user?.is_following);
            });
            return next;
        });
    }, []);

    useEffect(() => {
        syncStateFromPosts(incomingPosts ?? []);
    }, [incomingPosts, syncStateFromPosts]);

    useEffect(() => {
        setActiveRange(incomingRange ?? 'week');
    }, [incomingRange]);

    useEffect(() => {
        setActiveSort(incomingSort ?? 'hottest');
    }, [incomingSort]);

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

    const handleLike = (postId: number) => {
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
            postsLikes.toggle.url({ posts: postId }),
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
            const response = await fetch(`/posts/${postId}/bookmark`, {
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
            sessionStorage.setItem('followingPageDirty', '1');
        } catch {
            setFollowStateByUser((prev) => ({
                ...prev,
                [userId]: previous,
            }));
        } finally {
            setFollowingUserIds((prev) => prev.filter((id) => id !== userId));
        }
    };

    return {
        posts,
        activeRange,
        activeSort,
        likingPostIds,
        savingPostIds,
        likeStateByPost,
        saveStateByPost,
        followStateByUser,
        followingUserIds,
        handleRangeChange,
        handleSortChange,
        handleLike,
        handleSave,
        handleFollowToggle,
    };
}

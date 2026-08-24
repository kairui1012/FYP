import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import like from '@/routes/like';
import type { PostItem } from '@/types';

type LikeState = Record<number, { liked: boolean; likesCount: number }>;
type SaveState = Record<number, { saved: boolean; savesCount: number }>;
type FollowState = Record<number, boolean>;
type UsePostActionControlsOptions = {
    refreshFollowingPage?: boolean;
};

function buildFollowState(posts: PostItem[]) {
    const states: FollowState = {};
    posts.forEach((post) => {
        if (post.user?.id)
            states[post.user.id] = Boolean(post.user.is_following);
    });
    return states;
}

export function usePostActionControls(
    posts: PostItem[],
    options: UsePostActionControlsOptions = {},
) {
    const [likeStateByPost, setLikeStateByPost] = useState<LikeState>(() =>
        Object.fromEntries(
            posts.map((post) => [
                post.id,
                {
                    liked: Boolean(post.is_liked),
                    likesCount: post.likes_count ?? 0,
                },
            ]),
        ),
    );
    const [likingPostIds, setLikingPostIds] = useState<number[]>([]);

    const [saveStateByPost, setSaveStateByPost] = useState<SaveState>(() =>
        Object.fromEntries(
            posts.map((post) => [
                post.id,
                {
                    saved: Boolean(post.is_saved),
                    savesCount: post.saves_count ?? 0,
                },
            ]),
        ),
    );
    const [savingPostIds, setSavingPostIds] = useState<number[]>([]);

    const [followStateByUser, setFollowStateByUser] = useState<FollowState>(
        () => buildFollowState(posts),
    );
    const [followingUserIds, setFollowingUserIds] = useState<number[]>([]);

    const postStateKey = useMemo(
        () =>
            posts
                .map(
                    (post) =>
                        `${post.id}:${post.is_liked ? 1 : 0}:${post.likes_count ?? 0}:${post.is_saved ? 1 : 0}:${post.saves_count ?? 0}:${post.user?.id ?? 'anonymous'}:${post.user?.is_following ? 1 : 0}`,
                )
                .join('|'),
        [posts],
    );

    // Re-seed like/save/follow state when Inertia updates props (e.g. a reload
    // on focus) without remounting this page. Without this, counts and toggled
    // states stay stale until a full page refresh.
    useEffect(() => {
        setLikeStateByPost(
            Object.fromEntries(
                posts.map((post) => [
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
                posts.map((post) => [
                    post.id,
                    {
                        saved: Boolean(post.is_saved),
                        savesCount: post.saves_count ?? 0,
                    },
                ]),
            ),
        );
        setFollowStateByUser(buildFollowState(posts));
        setLikingPostIds([]);
        setSavingPostIds([]);
        setFollowingUserIds([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postStateKey]);

    const handleLike = (postId: number) => {
        if (likingPostIds.includes(postId)) return;

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
                onSuccess: (nextPage) => {
                    const nextPosts =
                        (nextPage.props as { posts?: PostItem[] }).posts ?? [];
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
        if (savingPostIds.includes(postId)) return;

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
            const response = await fetch(`/posts/${postId}/bookmark`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) throw new Error('Failed to toggle save.');

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
            setSaveStateByPost((prev) => ({ ...prev, [postId]: previous }));
        } finally {
            setSavingPostIds((prev) => prev.filter((id) => id !== postId));
        }
    };

    const handleFollowToggle = async (userId: number) => {
        if (followingUserIds.includes(userId)) return;

        const previous = followStateByUser[userId] ?? false;
        const optimistic = !previous;

        setFollowingUserIds((prev) => [...prev, userId]);
        setFollowStateByUser((prev) => ({ ...prev, [userId]: optimistic }));

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

            if (!response.ok) throw new Error('Follow toggle failed.');

            const payload = (await response.json()) as {
                is_following: boolean;
            };
            setFollowStateByUser((prev) => ({
                ...prev,
                [userId]: payload.is_following,
            }));
            sessionStorage.setItem('followingPageDirty', '1');
            if (options.refreshFollowingPage) {
                sessionStorage.removeItem('followingPageDirty');
                router.reload({
                    only: ['posts', 'pagination'],
                });
            }
        } catch {
            setFollowStateByUser((prev) => ({ ...prev, [userId]: previous }));
        } finally {
            setFollowingUserIds((prev) => prev.filter((id) => id !== userId));
        }
    };

    return {
        likeStateByPost,
        likingPostIds,
        saveStateByPost,
        savingPostIds,
        followStateByUser,
        followingUserIds,
        handleLike,
        handleSave,
        handleFollowToggle,
    };
}

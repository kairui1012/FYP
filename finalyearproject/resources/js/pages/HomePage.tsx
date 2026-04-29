import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { HomeFeedSection } from '@/components/home/home-feed-section';
import { HomeHeroSection } from '@/components/home/home-hero-section';
import { buildHomeText } from '@/components/home/home-page-text';
import { StudyHomeDashboard } from '@/components/home/study-home-dashboard';
import type { StudyHomeOverview } from '@/components/home/study-home-dashboard';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import like from '@/routes/like';
import type { BreadcrumbItem, PostItem } from '@/types';

type HomePageProps = {
    posts?: PostItem[];
    learningOverview?: StudyHomeOverview;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Home',
        href: homePage(),
    },
];

export default function HomePage({
    posts = [],
    learningOverview,
}: HomePageProps) {
    const page = usePage();
    const currentUserId = (page.props as { auth?: { user?: { id?: number } } })
        .auth?.user?.id;
    const pageContext =
        (page.props as { pageContext?: 'home' | 'following' }).pageContext ??
        'home';
    const isHomePage = pageContext === 'home';
    const isFollowingPage = pageContext === 'following';
    const [activeTab, setActiveTab] = useState<'learn' | 'feed'>(
        isHomePage ? 'learn' : 'feed',
    );

    const [likeStateByPost, setLikeStateByPost] = useState<
        Record<number, { liked: boolean; likesCount: number }>
    >(() =>
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

    const [saveStateByPost, setSaveStateByPost] = useState<
        Record<number, { saved: boolean; savesCount: number }>
    >(() =>
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

    const [followStateByUser, setFollowStateByUser] = useState<
        Record<number, boolean>
    >(() => {
        const states: Record<number, boolean> = {};
        posts.forEach((post) => {
            if (post.user?.id) {
                states[post.user.id] = Boolean(post.user.is_following);
            }
        });
        return states;
    });
    const [followingUserIds, setFollowingUserIds] = useState<number[]>([]);
    const homeText = buildHomeText(page as any);

    // posts prop changes on Inertia navigation (home ↔ following) without remount —
    // re-seed followStateByUser so the toggle handler reads the correct initial state.
    const postIdsKey = posts.map((p) => p.id).join(',');
    useEffect(() => {
        const states: Record<number, boolean> = {};
        posts.forEach((post) => {
            if (post.user?.id) {
                states[post.user.id] = Boolean(post.user.is_following);
            }
        });
        setFollowStateByUser(states);
        setFollowingUserIds([]);
        // postIdsKey is a stable string derived from posts — intentionally omitting
        // the full `posts` array to avoid re-running on every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postIdsKey]);

    useEffect(() => {
        if (!isHomePage) {
            setActiveTab('feed');
        }
    }, [isHomePage]);

    useEffect(() => {
        if (isFollowingPage && sessionStorage.getItem('followingPageDirty')) {
            sessionStorage.removeItem('followingPageDirty');
            router.reload({ only: ['posts'] });
        }
    }, [isFollowingPage]);

    useEffect(() => {
        document.documentElement.classList.remove('nprogress-busy');
        document.body.classList.remove('nprogress-busy');
        document.documentElement.style.cursor = '';
        document.body.style.cursor = '';
    }, []);

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

    return (
        <>
            <Head
                title={
                    isFollowingPage
                        ? homeText.followingTitle
                        : homeText.pageTitle
                }
            />
            <div className="pb-8">
                <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-6 md:pb-10">
                    <HomeHeroSection
                        isHomePage={isHomePage}
                        isFollowingPage={isFollowingPage}
                        activeTab={activeTab}
                        onChangeTab={setActiveTab}
                        text={{
                            heroTitle: homeText.heroTitle,
                            heroSubtitle: homeText.heroSubtitle,
                            followingTitle: homeText.followingTitle,
                            followingSubtitle: homeText.followingSubtitle,
                            learnTab: homeText.learnTab,
                            feedTab: homeText.feedTab,
                        }}
                    />

                    {isHomePage && activeTab === 'learn' ? (
                        <StudyHomeDashboard
                            overview={learningOverview}
                            text={homeText}
                            onOpenPost={goToPost}
                        />
                    ) : (
                        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 md:p-5">
                            <HomeFeedSection
                                posts={posts}
                                emptyStateVariant={
                                    isFollowingPage ? 'following' : 'home'
                                }
                                currentUserId={currentUserId}
                                likeStateByPost={likeStateByPost}
                                saveStateByPost={saveStateByPost}
                                followStateByUser={followStateByUser}
                                likingPostIds={likingPostIds}
                                savingPostIds={savingPostIds}
                                followingUserIds={followingUserIds}
                                onOpenPost={goToPost}
                                onOpenComments={goToPostComments}
                                onToggleLike={handleLike}
                                onToggleSave={handleSave}
                                onToggleFollow={handleFollowToggle}
                                text={{
                                    emptyFeed:
                                        homeText.emptyFeed === 'home.empty_feed'
                                            ? 'No posts yet.'
                                            : homeText.emptyFeed,
                                    emptyFeedTitle:
                                        homeText.emptyFeedTitle ===
                                        'home.empty_feed_title'
                                            ? 'No posts yet'
                                            : homeText.emptyFeedTitle,
                                    emptyFeedSubtitle:
                                        homeText.emptyFeedSubtitle ===
                                        'home.empty_feed_subtitle'
                                            ? 'Fresh posts from the community will appear here.'
                                            : homeText.emptyFeedSubtitle,
                                    emptyFeedAction:
                                        homeText.emptyFeedAction ===
                                        'home.empty_feed_action'
                                            ? 'Browse categories'
                                            : homeText.emptyFeedAction,
                                    followingEmptyTitle:
                                        homeText.followingEmptyTitle ===
                                        'home.following_empty_title'
                                            ? 'No following updates yet'
                                            : homeText.followingEmptyTitle,
                                    followingEmptySubtitle:
                                        homeText.followingEmptySubtitle ===
                                        'home.following_empty_subtitle'
                                            ? 'Follow classmates from community posts, then their newest posts will appear here.'
                                            : homeText.followingEmptySubtitle,
                                    followingEmptyAction:
                                        homeText.followingEmptyAction ===
                                        'home.following_empty_action'
                                            ? 'Explore posts'
                                            : homeText.followingEmptyAction,
                                    followingEmptySecondaryAction:
                                        homeText.followingEmptySecondaryAction ===
                                        'home.following_empty_secondary_action'
                                            ? 'View trends'
                                            : homeText.followingEmptySecondaryAction,
                                    createQuiz: homeText.createQuiz,
                                    createDiscussion:
                                        homeText.createDiscussion,
                                    askQuestion: homeText.askQuestion,
                                    shareMaterial: homeText.shareMaterial,
                                    unknownUser:
                                        homeText.unknownUser ===
                                        'home.unknown_user'
                                            ? 'Unknown User'
                                            : homeText.unknownUser,
                                    userAvatarAlt:
                                        homeText.userAvatarAlt ===
                                        'home.user_avatar_alt'
                                            ? 'User avatar'
                                            : homeText.userAvatarAlt,
                                    langEn:
                                        homeText.langEn === 'language_label.en'
                                            ? 'English'
                                            : homeText.langEn,
                                    langZh:
                                        homeText.langZh === 'language_label.zh'
                                            ? '中文'
                                            : homeText.langZh,
                                    langBm:
                                        homeText.langBm === 'language_label.bm'
                                            ? 'Bahasa Malaysia'
                                            : homeText.langBm,
                                }}
                            />
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}

HomePage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

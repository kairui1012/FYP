import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { HomeFeedSection } from '@/components/home/home-feed-section';
import { HomeHeroSection } from '@/components/home/home-hero-section';
import { PaginationControls } from '@/components/pagination-controls';
import {
    buildFeedSectionText,
    buildHomeText,
} from '@/components/home/home-page-text';
import { StudyHomeDashboard } from '@/components/home/study-home-dashboard';
import type { StudyHomeOverview } from '@/components/home/study-home-dashboard';
import { useHomePageState } from '@/hooks/use-home-page-state';
import { usePostInteractions } from '@/hooks/use-post-interactions';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem, PaginationMeta, PostItem } from '@/types';

type HomePageProps = {
    posts?: PostItem[];
    pagination?: PaginationMeta;
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
    pagination,
    learningOverview,
}: HomePageProps) {
    const page = usePage();
    const currentUserId = (page.props as { auth?: { user?: { id?: number } } })
        .auth?.user?.id;
    const pageContext =
        (page.props as { pageContext?: 'home' | 'following' }).pageContext ??
        'home';

    const { isHomePage, isFollowingPage, activeTab, setActiveTab } =
        useHomePageState(pageContext, posts);
    const {
        likeStateByPost,
        likingPostIds,
        saveStateByPost,
        savingPostIds,
        followStateByUser,
        followingUserIds,
        handleLike,
        handleSave,
        handleFollowToggle,
    } = usePostInteractions(posts);

    const homeText = buildHomeText(page as any);

    const buildPostUrl = (postId: number, focus?: 'comments') => {
        const params = new URLSearchParams();

        if (isHomePage) {
            params.set('tab', activeTab);
        }

        if (isFollowingPage) {
            params.set('source', 'following');
        }

        if (focus) {
            params.set('focus', focus);
        }

        const query = params.toString();
        return query ? `/posts/${postId}?${query}` : `/posts/${postId}`;
    };

    const goToPost = (postId: number) => router.get(buildPostUrl(postId));
    const goToPostComments = (postId: number) =>
        router.visit(buildPostUrl(postId, 'comments'));

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
                                text={buildFeedSectionText(homeText)}
                            />
                            <PaginationControls
                                pagination={pagination}
                                appendQuery={
                                    isHomePage
                                        ? { tab: activeTab }
                                        : undefined
                                }
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

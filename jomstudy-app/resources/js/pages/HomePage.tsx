import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { PostFeedSection } from '@/component-new/section/post-feed-section';
import { FeedHeroSection } from '@/component-new/section/feed-hero-section';
import {
    buildFeedSectionText,
    buildHomeText,
} from '@/component-new/config/home-page-config';
import { StudyHomeDashboard } from '@/component-new/dashboard/study-home-dashboard';
import type { StudyHomeOverview } from '@/component-new/dashboard/study-home-dashboard';
import { PaginationControls } from '@/component-new/shared/pagination-controls';
import {
    useHomePageState,
    type HomePageContext,
} from '@/hooks/use-home-page-state';
import { usePostInteractions } from '@/hooks/use-post-interactions';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
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
        (page.props as { pageContext?: HomePageContext }).pageContext ?? 'home';

    const { isHomePage, activeTab, setActiveTab } =
        useHomePageState(pageContext);
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

    // Only re-fetch the feed on focus (not the whole page) so the learn/feed
    // tab stays put while like/save/follow counts and states stay current.
    useRefreshOnFocus(['posts', 'pagination']);

    const homeText = buildHomeText(page as any);

    const buildPostUrl = (postId: number, focus?: 'comments') => {
        const params = new URLSearchParams();

        if (isHomePage) {
            params.set('tab', activeTab);
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
            <Head title={homeText.pageTitle} />
            <div className="pb-8">
                <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-6 md:pb-10">
                    <FeedHeroSection
                        isHomePage={isHomePage}
                        isFollowingPage={false}
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
                            <PostFeedSection
                                posts={posts}
                                emptyStateVariant="home"
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
                                    isHomePage ? { tab: activeTab } : undefined
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

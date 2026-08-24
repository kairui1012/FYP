import { Head, router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { HomeLearningDashboard } from '@/components/homePageComponent/home-learning-dashboard';
import { FeedHeroSection } from '@/components/shared/feed-hero-section';
import { FeedPostsPanel } from '@/components/shared/feed-posts-panel';
import {
    buildFeedHeroText,
    buildFeedSectionText,
    buildHomeText,
} from '@/components/ts/features/home-page/home-page-text';
import type {
    HomeLearningOverview,
    HomePageContext,
} from '@/components/ts/features/home-page/home-page-types';
import { useHomePageState } from '@/components/ts/features/home-page/use-home-page-state';
import { useAuthenticatedUserId } from '@/hooks/use-authenticated-user-id';
import { usePageRefreshOnFocus } from '@/hooks/use-page-refresh-on-focus';
import { usePostActionControls } from '@/hooks/use-post-action-controls';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem, PaginationMeta, PostItem } from '@/types';

type HomePageProps = {
    posts?: PostItem[];
    pagination?: PaginationMeta;
    learningOverview?: HomeLearningOverview;
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
    const currentUserId = useAuthenticatedUserId();
    const pageContext =
        (page.props as { pageContext?: HomePageContext }).pageContext ?? 'home';

    const { isHomePage, activeTab, setActiveTab } =
        useHomePageState(pageContext);
    const postInteractions = usePostActionControls(posts);

    // Only re-fetch the feed on focus (not the whole page) so the learn/feed
    // tab stays put while like/save/follow counts and states stay current.
    usePageRefreshOnFocus(['posts', 'pagination']);

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
                        text={buildFeedHeroText(homeText)}
                    />

                    {isHomePage && activeTab === 'learn' ? (
                        <HomeLearningDashboard
                            overview={learningOverview}
                            text={homeText}
                            onOpenPost={goToPost}
                        />
                    ) : (
                        <FeedPostsPanel
                            posts={posts}
                            pagination={pagination}
                            emptyStateVariant="home"
                            currentUserId={currentUserId}
                            interactions={postInteractions}
                            onOpenPost={goToPost}
                            onOpenComments={goToPostComments}
                            text={buildFeedSectionText(homeText)}
                            appendQuery={
                                isHomePage ? { tab: activeTab } : undefined
                            }
                        />
                    )}
                </div>
            </div>
        </>
    );
}

HomePage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

import { Head, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { FeedHeroSection } from '@/components/shared/feed-hero-section';
import { FeedPostsPanel } from '@/components/shared/feed-posts-panel';
import {
    buildFeedHeroText,
    buildFeedSectionText,
    buildHomeText,
} from '@/components/ts/features/home-page/home-page-text';
import { useAuthenticatedUserId } from '@/hooks/use-authenticated-user-id';
import { usePageRefreshOnFocus } from '@/hooks/use-page-refresh-on-focus';
import { usePostActionControls } from '@/hooks/use-post-action-controls';
import AppLayout from '@/layouts/app-layout';
import { index as followingPage } from '@/routes/following';
import type { BreadcrumbItem, PaginationMeta, PostItem } from '@/types';

type FollowingPageProps = {
    posts?: PostItem[];
    pagination?: PaginationMeta;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Following', href: followingPage() },
];

export default function FollowingPage({
    posts = [],
    pagination,
}: FollowingPageProps) {
    const page = usePage();
    const currentUserId = useAuthenticatedUserId();
    const postInteractions = usePostActionControls(posts, {
        refreshFollowingPage: true,
    });

    useEffect(() => {
        if (!sessionStorage.getItem('followingPageDirty')) return;

        sessionStorage.removeItem('followingPageDirty');
        router.reload({ only: ['posts', 'pagination'] });
    }, []);

    usePageRefreshOnFocus(['posts', 'pagination']);

    const homeText = buildHomeText(page as { props?: Record<string, unknown> });
    const buildPostUrl = (postId: number, focus?: 'comments') => {
        const params = new URLSearchParams({ source: 'following' });
        if (focus) params.set('focus', focus);

        return `/posts/${postId}?${params.toString()}`;
    };
    const goToPost = (postId: number) => router.get(buildPostUrl(postId));
    const goToPostComments = (postId: number) =>
        router.visit(buildPostUrl(postId, 'comments'));

    return (
        <>
            <Head title={homeText.followingTitle} />
            <div className="pb-8">
                <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-6 md:pb-10">
                    <FeedHeroSection
                        isHomePage={false}
                        isFollowingPage
                        activeTab="feed"
                        onChangeTab={() => undefined}
                        text={buildFeedHeroText(homeText)}
                    />

                    <FeedPostsPanel
                        posts={posts}
                        pagination={pagination}
                        emptyStateVariant="following"
                        currentUserId={currentUserId}
                        interactions={postInteractions}
                        onOpenPost={goToPost}
                        onOpenComments={goToPostComments}
                        text={buildFeedSectionText(homeText)}
                    />
                </div>
            </div>
        </>
    );
}

FollowingPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

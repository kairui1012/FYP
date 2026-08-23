import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { PostFeedSection } from '@/component-new/section/post-feed-section';
import { FeedHeroSection } from '@/component-new/section/feed-hero-section';
import {
    buildFeedSectionText,
    buildHomeText,
} from '@/component-new/config/home-page-config';
import { PaginationControls } from '@/component-new/shared/pagination-controls';
import { usePostInteractions } from '@/hooks/use-post-interactions';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import AppLayout from '@/layouts/app-layout';
import { followingPage } from '@/routes';
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
    const currentUserId = (page.props as { auth?: { user?: { id?: number } } })
        .auth?.user?.id;
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
    } = usePostInteractions(posts, { refreshFollowingPage: true });

    useEffect(() => {
        if (!sessionStorage.getItem('followingPageDirty')) return;

        sessionStorage.removeItem('followingPageDirty');
        router.reload({ only: ['posts', 'pagination'] });
    }, []);

    useRefreshOnFocus(['posts', 'pagination']);

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
                        text={{
                            heroTitle: homeText.heroTitle,
                            heroSubtitle: homeText.heroSubtitle,
                            followingTitle: homeText.followingTitle,
                            followingSubtitle: homeText.followingSubtitle,
                            learnTab: homeText.learnTab,
                            feedTab: homeText.feedTab,
                        }}
                    />

                    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 md:p-5">
                        <PostFeedSection
                            posts={posts}
                            emptyStateVariant="following"
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
                        <PaginationControls pagination={pagination} />
                    </section>
                </div>
            </div>
        </>
    );
}

FollowingPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

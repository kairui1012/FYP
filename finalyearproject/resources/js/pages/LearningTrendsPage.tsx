import { reactLang } from '@erag/lang-sync-inertia';
import { Head, router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { LearningTrendsEmptyState } from '@/components/learning-trends/learning-trends-empty-state';
import { LearningTrendsPostList } from '@/components/learning-trends/learning-trends-post-list';
import { LearningTrendsToolbar } from '@/components/learning-trends/learning-trends-toolbar';
import type {
    LearningTrendsPageProps,
} from '@/components/learning-trends/types';
import { useLearningTrendsController } from '@/components/learning-trends/use-learning-trends-controller';
import AppLayout from '@/layouts/app-layout';
import { popularPage } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Popular',
        href: popularPage(),
    },
];

export default function LearningTrendsPage() {
    const { trans } = reactLang();
    const page = usePage<LearningTrendsPageProps>();
    const { props } = page;
    const currentUserId = (page.props as { auth?: { user?: { id?: number } } })
        .auth?.user?.id;

    const controller = useLearningTrendsController({
        posts: props.posts ?? [],
        activeRange: props.activeRange ?? 'week',
        activeSort: props.activeSort ?? 'hottest',
    });

    const goToPost = (postId: number) => {
        router.get(`/posts/${postId}`);
    };

    const goToPostComments = (postId: number) => {
        router.visit(`/posts/${postId}?focus=comments`);
    };

    return (
        <>
            <Head title={trans('navigation.popular')} />
            <div className="pb-8">
                <div className="mx-auto w-full max-w-3xl space-y-2 p-4 md:p-6 md:pb-10">
                    <LearningTrendsToolbar
                        activeRange={controller.activeRange}
                        activeSort={controller.activeSort}
                        onRangeChange={controller.handleRangeChange}
                        onSortChange={controller.handleSortChange}
                        trans={trans}
                    />

                    {controller.posts.length === 0 ? (
                        <LearningTrendsEmptyState
                            message={trans('popular.no_posts')}
                        />
                    ) : (
                        <LearningTrendsPostList
                            posts={controller.posts}
                            currentUserId={currentUserId}
                            likingPostIds={controller.likingPostIds}
                            savingPostIds={controller.savingPostIds}
                            likeStateByPost={controller.likeStateByPost}
                            saveStateByPost={controller.saveStateByPost}
                            followStateByUser={controller.followStateByUser}
                            followingUserIds={controller.followingUserIds}
                            trans={trans}
                            onLike={controller.handleLike}
                            onComment={goToPostComments}
                            onSave={controller.handleSave}
                            onFollowToggle={controller.handleFollowToggle}
                            onOpenPost={goToPost}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

LearningTrendsPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

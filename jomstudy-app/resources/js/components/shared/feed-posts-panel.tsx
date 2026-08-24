import type { ComponentProps } from 'react';
import type { usePostActionControls } from '@/hooks/use-post-action-controls';
import type { PaginationMeta, PostItem } from '@/types';
import { PaginationControls } from './pagination-controls';
import { PostFeedSection } from './post-feed-section';

type PostFeedProps = ComponentProps<typeof PostFeedSection>;
type PaginationProps = ComponentProps<typeof PaginationControls>;

type FeedPostsPanelProps = {
    posts: PostItem[];
    pagination?: PaginationMeta;
    currentUserId?: number;
    emptyStateVariant: NonNullable<PostFeedProps['emptyStateVariant']>;
    interactions: ReturnType<typeof usePostActionControls>;
    onOpenPost: PostFeedProps['onOpenPost'];
    onOpenComments: PostFeedProps['onOpenComments'];
    text: PostFeedProps['text'];
    appendQuery?: PaginationProps['appendQuery'];
};

export function FeedPostsPanel({
    posts,
    pagination,
    currentUserId,
    emptyStateVariant,
    interactions,
    onOpenPost,
    onOpenComments,
    text,
    appendQuery,
}: FeedPostsPanelProps) {
    return (
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 md:p-5">
            <PostFeedSection
                posts={posts}
                emptyStateVariant={emptyStateVariant}
                currentUserId={currentUserId}
                likeStateByPost={interactions.likeStateByPost}
                saveStateByPost={interactions.saveStateByPost}
                followStateByUser={interactions.followStateByUser}
                likingPostIds={interactions.likingPostIds}
                savingPostIds={interactions.savingPostIds}
                followingUserIds={interactions.followingUserIds}
                onOpenPost={onOpenPost}
                onOpenComments={onOpenComments}
                onToggleLike={interactions.handleLike}
                onToggleSave={interactions.handleSave}
                onToggleFollow={interactions.handleFollowToggle}
                text={text}
            />
            <PaginationControls
                pagination={pagination}
                appendQuery={appendQuery}
            />
        </section>
    );
}

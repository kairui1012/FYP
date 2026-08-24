import type { TransFn } from '@/components/ts/features/learning-trends/learning-trends-types';
import type { PostItem } from '@/types';
import { LearningTrendsPostCard } from './learning-trends-post-card';

type LearningTrendsPostListProps = {
    posts: PostItem[];
    currentUserId?: number;
    likingPostIds: number[];
    savingPostIds: number[];
    likeStateByPost: Record<number, { liked: boolean; likesCount: number }>;
    saveStateByPost: Record<number, { saved: boolean; savesCount: number }>;
    followStateByUser: Record<number, boolean>;
    followingUserIds: number[];
    trans: TransFn;
    onLike: (postId: number) => void;
    onComment: (postId: number) => void;
    onSave: (postId: number) => void;
    onFollowToggle: (userId: number) => void;
    onOpenPost: (postId: number) => void;
};

export function LearningTrendsPostList({
    posts,
    currentUserId,
    likingPostIds,
    savingPostIds,
    likeStateByPost,
    saveStateByPost,
    followStateByUser,
    followingUserIds,
    trans,
    onLike,
    onComment,
    onSave,
    onFollowToggle,
    onOpenPost,
}: LearningTrendsPostListProps) {
    return (
        <div className="space-y-2">
            {posts.map((post) => {
                const likeState = likeStateByPost[post.id] ?? {
                    liked: Boolean(post.is_liked),
                    likesCount: post.likes_count ?? 0,
                };
                const saveState = saveStateByPost[post.id] ?? {
                    saved: Boolean(post.is_saved),
                    savesCount: post.saves_count ?? 0,
                };
                const userId = post.user?.id;

                return (
                    <LearningTrendsPostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUserId}
                        liked={likeState.liked}
                        likesCount={likeState.likesCount}
                        saved={saveState.saved}
                        savesCount={saveState.savesCount}
                        likeLoading={likingPostIds.includes(post.id)}
                        saveLoading={savingPostIds.includes(post.id)}
                        following={
                            userId
                                ? (followStateByUser[userId] ??
                                  Boolean(post.user?.is_following))
                                : false
                        }
                        followLoading={
                            userId ? followingUserIds.includes(userId) : false
                        }
                        trans={trans}
                        onLike={onLike}
                        onComment={onComment}
                        onSave={onSave}
                        onFollowToggle={onFollowToggle}
                        onOpenPost={onOpenPost}
                    />
                );
            })}
        </div>
    );
}

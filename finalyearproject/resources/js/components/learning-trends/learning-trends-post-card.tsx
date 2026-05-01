import { Link } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { LeaderboardTitleBadge } from '@/components/LeaderboardTitleBadge';
import { VerifiedTeacherBadge } from '@/components/VerifiedTeacherBadge';
import { PostAttachments } from '@/components/post-attachments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BtnFollow } from '@/components/ui/btn-follow';
import { MaterialLearningStateBadge } from '@/components/ui/material-learning-state-badge';
import { formatFormulaText } from '@/lib/formula-display';
import {
    formatTimeAgo,
    getLanguageLabel,
    getSubjectLabel,
} from '@/lib/post-utils';
import type { PostItem } from '@/types';
import {
    getLangBadgeProps,
    getPostTypeBadgeProps,
    getSubjectBadgeProps,
} from './learning-trends-config';
import { LearningTrendsPostFooter } from './learning-trends-post-footer';
import type { TransFn } from './types';

type LearningTrendsPostCardProps = {
    post: PostItem;
    currentUserId?: number;
    liked: boolean;
    likesCount: number;
    saved: boolean;
    savesCount: number;
    likeLoading: boolean;
    saveLoading: boolean;
    following: boolean;
    followLoading: boolean;
    trans: TransFn;
    onLike: (postId: number) => void;
    onComment: (postId: number) => void;
    onSave: (postId: number) => void;
    onFollowToggle: (userId: number) => void;
    onOpenPost: (postId: number) => void;
};

function MaterialRecommendationBadge({ post }: { post: PostItem }) {
    const averageRating = post.material_feedback_summary?.average_rating ?? 0;
    const recommendationRate =
        post.material_feedback_summary?.recommendation_rate ?? 0;
    const ratingCount = post.material_feedback_summary?.rating_count ?? 0;

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <Star className="h-3.5 w-3.5 fill-current" />
            {ratingCount > 0
                ? `${averageRating.toFixed(1)} · ${recommendationRate}%`
                : 'No ratings yet'}
        </span>
    );
}

function getMaterialFirstPreview(post: PostItem): string {
    const firstBlock = post.content_blocks?.[0];

    if (firstBlock?.type === 'text') {
        return firstBlock.text;
    }

    if (firstBlock?.type === 'image') {
        return firstBlock.name ?? 'Image';
    }

    if (firstBlock?.type === 'document') {
        return firstBlock.name ?? 'Document';
    }

    if (firstBlock?.type === 'video') {
        return firstBlock.url ?? 'Video resource';
    }

    const firstSegment = (post.content ?? '')
        .split(/\n\s*\n/)
        .map((segment) => segment.trim())
        .filter(Boolean)[0];

    return firstSegment ?? '';
}

export function LearningTrendsPostCard({
    post,
    currentUserId,
    liked,
    likesCount,
    saved,
    savesCount,
    likeLoading,
    saveLoading,
    following,
    followLoading,
    trans,
    onLike,
    onComment,
    onSave,
    onFollowToggle,
    onOpenPost,
}: LearningTrendsPostCardProps) {
    const type =
        post.post_type === 'quiz'
            ? 'quiz'
            : post.post_type === 'question'
              ? 'question'
              : 'material';
    const { bg: typeBg, text: typeText } = getPostTypeBadgeProps(type);
    const typeLabel =
        type === 'quiz'
            ? trans('createPost.create_quiz')
            : type === 'question'
              ? trans('createPost.ask_question')
              : trans('createPost.share_material');
    const langCode = post.language?.code ?? 'en';
    const { bg: langBg, text: langText } = getLangBadgeProps(langCode);
    const subjectBadge = getSubjectBadgeProps();
    const subjectLabel = getSubjectLabel(post.subject?.name, trans);
    const contentPreview =
        post.post_type === 'material'
            ? getMaterialFirstPreview(post)
            : (post.content ?? '');

    return (
        <div>
            <article
                className="mb-2 cursor-pointer rounded-xl p-5 transition-colors hover:bg-[#F2F4F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                onClick={() => onOpenPost(post.id)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onOpenPost(post.id);
                    }
                }}
                role="link"
                tabIndex={0}
            >
                <header className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        {post.is_anonymous ? (
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-zinc-300 text-sm font-semibold text-zinc-500">
                                    ?
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <Link
                                href={
                                    post.user?.id
                                        ? `/profilePage/${post.user.id}`
                                        : '/profilePage'
                                }
                                className="peer group/avatar cursor-pointer"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <Avatar className="h-10 w-10 ring-2 ring-transparent transition-colors group-hover/avatar:ring-[#ef99b0]">
                                    {post.user?.avatar ? (
                                        <AvatarImage
                                            src={post.user.avatar}
                                            alt={
                                                post.user?.name ?? 'User avatar'
                                            }
                                        />
                                    ) : null}
                                    <AvatarFallback className="bg-zinc-200 text-sm font-semibold text-zinc-700">
                                        {(post.user?.name ?? 'U')
                                            .charAt(0)
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="mb-3 flex items-center gap-1.5 text-base">
                                {post.is_anonymous ? (
                                    <span className="font-semibold text-zinc-500">
                                        Anonymous User
                                    </span>
                                ) : (
                                    <Link
                                        href={
                                            post.user?.id
                                                ? `/profilePage/${post.user.id}`
                                                : '/profilePage'
                                        }
                                        className={`cursor-pointer font-semibold transition-colors peer-hover:text-[#de6b89] hover:text-[#de6b89] ${post.user?.is_verified ? 'text-blue-600' : 'text-zinc-900'}`}
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                    >
                                        {post.user?.name ?? 'Unknown User'}
                                    </Link>
                                )}
                                {!post.is_anonymous && post.user?.is_verified && (
                                    <VerifiedTeacherBadge />
                                )}
                                {!post.is_anonymous && (
                                    <LeaderboardTitleBadge
                                        title={post.user?.leaderboard_title}
                                    />
                                )}
                                {!post.is_anonymous &&
                                post.user?.id &&
                                currentUserId &&
                                post.user.id !== currentUserId ? (
                                    <BtnFollow
                                        following={following}
                                        loading={followLoading}
                                        onClick={() =>
                                            onFollowToggle(post.user!.id)
                                        }
                                    />
                                ) : null}
                                <span className="text-zinc-400">•</span>
                                <span className="text-sm text-zinc-500">
                                    {formatTimeAgo(post.created_at)}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                                <span
                                    className={`rounded-full px-2 py-0.5 font-medium ${typeBg} ${typeText}`}
                                >
                                    {typeLabel}
                                </span>
                                <span
                                    className={`rounded-full px-2 py-0.5 font-medium ${langBg} ${langText}`}
                                >
                                    {post.language?.name ??
                                        getLanguageLabel(langCode)}
                                </span>
                                {subjectLabel ? (
                                    <span
                                        className={`rounded-full px-2 py-0.5 font-medium ${subjectBadge.bg} ${subjectBadge.text}`}
                                    >
                                        {subjectLabel}
                                    </span>
                                ) : null}
                                {post.post_type === 'material' ? (
                                    <MaterialLearningStateBadge
                                        state={post.material_learning_state}
                                    />
                                ) : null}
                                {post.post_type === 'material' ? (
                                    <MaterialRecommendationBadge post={post} />
                                ) : null}
                            </div>
                        </div>
                    </div>
                </header>

                <h2 className="mb-2 text-lg font-bold text-zinc-900">
                    {post.title}
                </h2>
                <p className="mb-2 text-base leading-6 font-medium whitespace-pre-wrap text-zinc-700">
                    {formatFormulaText(contentPreview)}
                </p>

                <PostAttachments files={post.image} compact />
            </article>

            <LearningTrendsPostFooter
                postId={post.id}
                likes={likesCount}
                liked={liked}
                loading={likeLoading}
                saves={savesCount}
                saved={saved}
                saveLoading={saveLoading}
                comments={post.comments_count ?? 0}
                onLike={onLike}
                onComment={onComment}
                onSave={onSave}
            />
            <div className="mt-1 w-full border-t border-zinc-200" />
        </div>
    );
}

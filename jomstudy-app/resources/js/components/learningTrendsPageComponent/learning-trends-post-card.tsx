import { Link } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { BtnComment } from '@/components/shared/comment-button';
import { BtnFollow } from '@/components/shared/follow-button';
import { LeaderboardTitleBadge } from '@/components/shared/leaderboard-title-badge';
import { BtnLike } from '@/components/shared/like-button';
import { MaterialLearningStateBadge } from '@/components/shared/material-learning-state-badge';
import { PostAttachmentViewer } from '@/components/shared/post-attachment-viewer';
import { BtnSave } from '@/components/shared/save-button';
import { BtnShare } from '@/components/shared/share-button';
import { VerifiedTeacherBadge } from '@/components/shared/verified-teacher-badge';
import {
    getLangBadgeProps,
    getPostTypeBadgeProps,
    getSubjectBadgeProps,
} from '@/components/ts/features/learning-trends/learning-trends-config';
import type { TransFn } from '@/components/ts/features/learning-trends/learning-trends-types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    formatTimeAgo,
    getLanguageLabel,
    getSubjectLabel,
} from '@/lib/post-display-helpers';
import { isVerifiedTeacher } from '@/lib/teacher-verification';
import type { PostItem } from '@/types';

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

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <Star className="h-3.5 w-3.5 fill-current" />
            {averageRating.toFixed(1)}
        </span>
    );
}

function getMaterialFirstPreview(post: PostItem, trans: TransFn): string {
    const firstBlock = post.content_blocks?.[0];

    if (firstBlock?.type === 'text') {
        return firstBlock.text;
    }

    if (firstBlock?.type === 'image') {
        return firstBlock.name ?? trans('createPost.material_image_fallback');
    }

    if (firstBlock?.type === 'document') {
        return (
            firstBlock.name ?? trans('createPost.material_document_fallback')
        );
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
            ? getMaterialFirstPreview(post, trans)
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
                                                post.user?.name ??
                                                trans('profile.user_avatar_alt')
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
                                        {trans('profile.anonymous_user')}
                                    </span>
                                ) : (
                                    <Link
                                        href={
                                            post.user?.id
                                                ? `/profilePage/${post.user.id}`
                                                : '/profilePage'
                                        }
                                        className={`cursor-pointer font-semibold transition-colors peer-hover:text-[#de6b89] hover:text-[#de6b89] ${isVerifiedTeacher(post.user) ? 'text-blue-600' : 'text-zinc-900'}`}
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                    >
                                        {post.user?.name ??
                                            trans('profile.unknown_user')}
                                    </Link>
                                )}
                                {!post.is_anonymous &&
                                    isVerifiedTeacher(post.user) && (
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
                    {contentPreview}
                </p>

                <PostAttachmentViewer files={post.image} compact />
            </article>

            <div className="mt-2 flex items-center gap-3 text-sm text-zinc-900">
                <BtnLike
                    count={likesCount}
                    liked={liked}
                    loading={likeLoading}
                    className="mb-2"
                    onClick={() => onLike(post.id)}
                />
                <BtnComment
                    count={post.comments_count ?? 0}
                    className="mb-2"
                    onClick={() => onComment(post.id)}
                />
                <BtnSave
                    count={savesCount}
                    saved={saved}
                    loading={saveLoading}
                    className="mb-2"
                    onClick={() => onSave(post.id)}
                />
                <BtnShare className="mb-2" />
            </div>
            <div className="mt-1 w-full border-t border-zinc-200" />
        </div>
    );
}

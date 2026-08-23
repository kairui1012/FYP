import { reactLang } from '@erag/lang-sync-inertia';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    FileText,
    PlayCircle,
    Search,
    Star,
    UsersRound,
} from 'lucide-react';
import { LeaderboardTitleBadge } from '@/components/LeaderboardTitleBadge';
import { PostAttachments } from '@/components/post-attachments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BtnComment } from '@/components/ui/btn-comment';
import { BtnFollow } from '@/components/ui/btn-follow';
import { BtnLike } from '@/components/ui/btn-like';
import { BtnSave } from '@/components/ui/btn-save';
import { BtnShare } from '@/components/ui/btn-share';
import { VerifiedTeacherBadge } from '@/components/VerifiedTeacherBadge';
import { formatFormulaText } from '@/lib/formula-display';
import { formatTimeAgo, getSubjectLabel } from '@/lib/post-utils';
import { isVerifiedTeacher } from '@/lib/verified-teacher';
import type { PostItem } from '@/types';
import {
    getLangBadgeProps,
    getPostTypeBadgeProps,
    getSubjectBadgeProps,
} from './home-page-text';

type FeedText = {
    emptyFeed: string;
    emptyFeedTitle: string;
    emptyFeedSubtitle: string;
    emptyFeedAction: string;
    followingEmptyTitle: string;
    followingEmptySubtitle: string;
    followingEmptyAction: string;
    followingEmptySecondaryAction: string;
    createQuiz: string;
    askQuestion: string;
    shareMaterial: string;
    unknownUser: string;
    userAvatarAlt: string;
    langEn: string;
    langZh: string;
    langBm: string;
};

type HomeFeedSectionProps = {
    posts: PostItem[];
    emptyStateVariant?: 'home' | 'following';
    currentUserId?: number;
    likeStateByPost: Record<number, { liked: boolean; likesCount: number }>;
    saveStateByPost: Record<number, { saved: boolean; savesCount: number }>;
    followStateByUser: Record<number, boolean>;
    likingPostIds: number[];
    savingPostIds: number[];
    followingUserIds: number[];
    onOpenPost: (postId: number) => void;
    onOpenComments: (postId: number) => void;
    onToggleLike: (postId: number) => void;
    onToggleSave: (postId: number) => void;
    onToggleFollow: (userId: number) => void;
    text: FeedText;
};

type PostFooterProps = {
    likes: number;
    liked: boolean;
    loading?: boolean;
    saves: number;
    saved: boolean;
    saveLoading?: boolean;
    comments: number;
    postId: number;
    onLike: (postId: number) => void;
    onComment: (postId: number) => void;
    onSave: (postId: number) => void;
};

function PostFooter({
    likes,
    liked,
    loading = false,
    saves,
    saved,
    saveLoading = false,
    comments,
    postId,
    onLike,
    onComment,
    onSave,
}: PostFooterProps) {
    return (
        <div className="mt-2 flex items-center gap-3 text-sm text-zinc-900">
            <BtnLike
                count={likes}
                liked={liked}
                loading={loading}
                className="mb-2"
                onClick={() => onLike(postId)}
            />
            <BtnComment
                count={comments}
                className="mb-2"
                onClick={() => onComment(postId)}
            />
            <BtnSave
                count={saves}
                saved={saved}
                loading={saveLoading}
                className="mb-2"
                onClick={() => onSave(postId)}
            />
            <BtnShare className="mb-2" />
        </div>
    );
}

function materialAssetUrl(path: string) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    return `/storage/${path}`;
}

function MaterialRecommendationBadge({ post }: { post: PostItem }) {
    const averageRating = post.material_feedback_summary?.average_rating ?? 0;

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <Star className="h-3.5 w-3.5 fill-current" />
            {averageRating.toFixed(1)}
        </span>
    );
}

function MaterialPreview({ post }: { post: PostItem }) {
    const firstBlock = post.content_blocks?.[0];

    if (!firstBlock) {
        const fallbackSegments = (post.content ?? '')
            .split(/\n\s*\n/)
            .map((segment) => segment.trim())
            .filter(Boolean);
        const firstSegment =
            fallbackSegments[0] === post.title
                ? (fallbackSegments[1] ?? fallbackSegments[0] ?? '')
                : (fallbackSegments[0] ?? '');

        return (
            <p className="mb-2 text-base leading-6 font-medium whitespace-pre-wrap text-zinc-700">
                {formatFormulaText(firstSegment)}
            </p>
        );
    }

    if (firstBlock.type === 'text') {
        return (
            <p className="mb-2 text-base leading-6 font-medium whitespace-pre-wrap text-zinc-700">
                {formatFormulaText(firstBlock.text)}
            </p>
        );
    }

    if (firstBlock.type === 'image') {
        return (
            <div className="mb-2 overflow-hidden rounded-2xl border-2 border-zinc-200 bg-zinc-50">
                <img
                    src={materialAssetUrl(firstBlock.path)}
                    alt={firstBlock.name ?? post.title}
                    className="max-h-80 w-full object-contain"
                />
            </div>
        );
    }

    if (firstBlock.type === 'document') {
        return (
            <div className="mb-2 flex items-center gap-3 rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                    <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-900">
                        {firstBlock.name ?? 'Document'}
                    </p>
                    <p className="text-sm text-zinc-500">
                        {firstBlock.mime ?? 'Study material file'}
                    </p>
                </div>
            </div>
        );
    }

    if (firstBlock.type === 'video') {
        return (
            <div className="mb-2 flex items-center gap-3 rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <PlayCircle className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="font-semibold text-zinc-900">
                        Video resource
                    </p>
                    <p className="truncate text-sm text-zinc-500">
                        {firstBlock.url}
                    </p>
                </div>
            </div>
        );
    }

    return null;
}

export function HomeFeedSection({
    posts,
    emptyStateVariant = 'home',
    currentUserId,
    likeStateByPost,
    saveStateByPost,
    followStateByUser,
    likingPostIds,
    savingPostIds,
    followingUserIds,
    onOpenPost,
    onOpenComments,
    onToggleLike,
    onToggleSave,
    onToggleFollow,
    text,
}: HomeFeedSectionProps) {
    const { trans } = reactLang();
    const languageLabelByCode: Record<string, string> = {
        en: text.langEn,
        zh: text.langZh,
        bm: text.langBm,
        my: text.langBm,
    };

    if (posts.length === 0) {
        const isFollowingEmpty = emptyStateVariant === 'following';

        return (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-rose-200 bg-linear-to-br from-rose-50 via-white to-sky-50 px-5 py-12 text-center md:px-8 md:py-14">
                <div className="mx-auto flex max-w-lg flex-col items-center">
                    <div className="relative mb-5 h-20 w-28">
                        <div className="absolute top-0 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-rose-100">
                            <UsersRound className="h-7 w-7 text-[#e27193]" />
                        </div>
                        <div className="absolute bottom-0 left-3 h-10 w-10 rounded-full bg-sky-100 ring-4 ring-white" />
                        <div className="absolute right-3 bottom-0 h-10 w-10 rounded-full bg-amber-100 ring-4 ring-white" />
                    </div>
                    <h2 className="text-lg font-bold text-zinc-900">
                        {isFollowingEmpty
                            ? text.followingEmptyTitle
                            : text.emptyFeedTitle}
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
                        {isFollowingEmpty
                            ? text.followingEmptySubtitle
                            : text.emptyFeedSubtitle || text.emptyFeed}
                    </p>
                    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            href={
                                isFollowingEmpty ? '/homePage' : '/categories'
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#e27193] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#cf5d80] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e27193]/40"
                        >
                            <Search className="h-4 w-4" />
                            {isFollowingEmpty
                                ? text.followingEmptyAction
                                : text.emptyFeedAction}
                        </Link>
                        {isFollowingEmpty ? (
                            <Link
                                href="/popularPage"
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition hover:text-[#e27193] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e27193]/30"
                            >
                                {text.followingEmptySecondaryAction}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {posts.map((post) => (
                <div key={post.id}>
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
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                    >
                                        <Avatar className="h-10 w-10 ring-2 ring-transparent transition-colors group-hover/avatar:ring-[#e27193]">
                                            {post.user?.avatar ? (
                                                <AvatarImage
                                                    src={post.user.avatar}
                                                    alt={text.userAvatarAlt}
                                                />
                                            ) : null}
                                            <AvatarFallback className="bg-zinc-200 text-sm font-semibold text-zinc-700">
                                                {(
                                                    post.user?.name ??
                                                    text.unknownUser
                                                )
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
                                                Anonymous
                                            </span>
                                        ) : (
                                            <>
                                                <Link
                                                    href={
                                                        post.user?.id
                                                            ? `/profilePage/${post.user.id}`
                                                            : '/profilePage'
                                                    }
                                                    className={`cursor-pointer font-semibold transition-colors peer-hover:text-[#e27193] hover:text-[#e27193] ${isVerifiedTeacher(post.user) ? 'text-blue-600' : 'text-zinc-900'}`}
                                                    onClick={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                >
                                                    {post.user?.name ??
                                                        text.unknownUser}
                                                </Link>
                                                {isVerifiedTeacher(
                                                    post.user,
                                                ) && <VerifiedTeacherBadge />}
                                                <LeaderboardTitleBadge
                                                    title={
                                                        post.user
                                                            ?.leaderboard_title
                                                    }
                                                />
                                            </>
                                        )}
                                        {!post.is_anonymous &&
                                        post.user?.id &&
                                        currentUserId &&
                                        post.user.id !== currentUserId ? (
                                            <BtnFollow
                                                following={
                                                    followStateByUser[
                                                        post.user.id
                                                    ] ??
                                                    Boolean(
                                                        post.user.is_following,
                                                    )
                                                }
                                                loading={followingUserIds.includes(
                                                    post.user.id,
                                                )}
                                                onClick={() =>
                                                    onToggleFollow(
                                                        post.user!.id,
                                                    )
                                                }
                                            />
                                        ) : null}
                                        <span className="text-zinc-400">•</span>
                                        <span className="text-sm text-zinc-500">
                                            {formatTimeAgo(post.created_at)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                                        {(() => {
                                            const type =
                                                post.post_type === 'quiz'
                                                    ? 'quiz'
                                                    : post.post_type ===
                                                        'question'
                                                      ? 'question'
                                                      : 'material';
                                            const { bg, text: typeTextClass } =
                                                getPostTypeBadgeProps(type);
                                            const label =
                                                type === 'quiz'
                                                    ? text.createQuiz
                                                    : type === 'question'
                                                      ? text.askQuestion
                                                      : text.shareMaterial;

                                            return (
                                                <span
                                                    className={`rounded-full px-2 py-0.5 font-medium ${bg} ${typeTextClass}`}
                                                >
                                                    {label}
                                                </span>
                                            );
                                        })()}
                                        {(() => {
                                            const code =
                                                post.language?.code || 'en';
                                            const { bg, text: langTextClass } =
                                                getLangBadgeProps(code);
                                            const label =
                                                languageLabelByCode[code] ??
                                                code;
                                            return (
                                                <span
                                                    className={`rounded-full px-2 py-0.5 font-medium ${bg} ${langTextClass}`}
                                                >
                                                    {label}
                                                </span>
                                            );
                                        })()}
                                        {post.subject?.name
                                            ? (() => {
                                                  const {
                                                      bg,
                                                      text: subjectTextClass,
                                                  } = getSubjectBadgeProps();
                                                  const subjectLabel =
                                                      getSubjectLabel(
                                                          post.subject?.name,
                                                          trans,
                                                      );
                                                  return (
                                                      <span
                                                          className={`rounded-full px-2 py-0.5 font-medium ${bg} ${subjectTextClass}`}
                                                      >
                                                          {subjectLabel}
                                                      </span>
                                                  );
                                              })()
                                            : null}
                                        {post.post_type === 'material' ? (
                                            <MaterialRecommendationBadge
                                                post={post}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </header>

                        <h2 className="mb-2 text-lg font-bold text-zinc-900">
                            {post.title}
                        </h2>
                        {post.post_type === 'material' ? (
                            <MaterialPreview post={post} />
                        ) : (
                            <>
                                <p className="mb-2 text-base leading-6 font-medium whitespace-pre-wrap text-zinc-700">
                                    {formatFormulaText(post.content ?? '')}
                                </p>
                                <PostAttachments files={post.image} compact />
                            </>
                        )}
                    </article>

                    {(() => {
                        const likeState = likeStateByPost[post.id] ?? {
                            liked: Boolean(post.is_liked),
                            likesCount: post.likes_count ?? 0,
                        };
                        const saveState = saveStateByPost[post.id] ?? {
                            saved: Boolean(post.is_saved),
                            savesCount: post.saves_count ?? 0,
                        };

                        return (
                            <PostFooter
                                postId={post.id}
                                likes={likeState.likesCount}
                                liked={likeState.liked}
                                loading={likingPostIds.includes(post.id)}
                                saves={saveState.savesCount}
                                saved={saveState.saved}
                                saveLoading={savingPostIds.includes(post.id)}
                                comments={post.comments_count ?? 0}
                                onLike={onToggleLike}
                                onComment={onOpenComments}
                                onSave={onToggleSave}
                            />
                        );
                    })()}
                    <div className="mt-1 w-full border-t border-zinc-200"></div>
                </div>
            ))}
        </div>
    );
}

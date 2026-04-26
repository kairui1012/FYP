import { Link } from '@inertiajs/react';
import { lazy, Suspense } from 'react';
import { LeaderboardTitleBadge } from '@/components/LeaderboardTitleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BtnComment } from '@/components/ui/btn-comment';
import { BtnFollow } from '@/components/ui/btn-follow';
import { BtnLike } from '@/components/ui/btn-like';
import { BtnSave } from '@/components/ui/btn-save';
import { BtnShare } from '@/components/ui/btn-share';
import { formatFormulaText } from '@/lib/formula-display';
import { formatTimeAgo } from '@/lib/post-utils';
import type { PostItem } from '@/types';
import {
    getLangBadgeProps,
    getPostTypeBadgeProps,
    getSubjectBadgeProps,
} from './home-page-text';

const PostAttachments = lazy(() =>
    import('@/components/post-attachments').then((m) => ({
        default: m.PostAttachments,
    })),
);

type FeedText = {
    emptyFeed: string;
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

export function HomeFeedSection({
    posts,
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
    const languageLabelByCode: Record<string, string> = {
        en: text.langEn,
        zh: text.langZh,
        bm: text.langBm,
        my: text.langBm,
    };

    if (posts.length === 0) {
        return (
            <div className="border border-dashed border-zinc-300 bg-white px-6 py-16 text-center text-3xl text-zinc-500">
                <p>{text.emptyFeed}</p>
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
                                            <span className="font-semibold text-zinc-500 italic">
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
                                                    className="cursor-pointer font-semibold text-zinc-900 transition-colors peer-hover:text-[#e27193] hover:text-[#e27193]"
                                                    onClick={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                >
                                                    {post.user?.name ??
                                                        text.unknownUser}
                                                </Link>
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
                                                  return (
                                                      <span
                                                          className={`rounded-full px-2 py-0.5 font-medium ${bg} ${subjectTextClass}`}
                                                      >
                                                          {post.subject.name}
                                                      </span>
                                                  );
                                              })()
                                            : null}
                                    </div>
                                </div>
                            </div>
                        </header>

                        <h2 className="mb-2 text-lg font-bold text-zinc-900">
                            {post.title}
                        </h2>
                        <p className="mb-2 text-base leading-6 font-medium whitespace-pre-wrap text-zinc-700">
                            {formatFormulaText(post.content ?? '')}
                        </p>

                        <Suspense
                            fallback={
                                <div className="h-48 rounded-xl bg-zinc-100" />
                            }
                        >
                            <PostAttachments files={post.image} compact />
                        </Suspense>
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

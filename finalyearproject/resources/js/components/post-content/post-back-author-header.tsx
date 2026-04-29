import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { ComponentProps } from 'react';
import { LeaderboardTitleBadge } from '@/components/LeaderboardTitleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BtnFollow } from '@/components/ui/btn-follow';
import { formatTimeAgo, getSubjectLabelFromPage } from '@/lib/post-utils';
import type { PostItem } from '@/types';
import {
    getLangBadgeProps,
    getPostTypeBadgeProps,
    getSubjectBadgeProps,
} from './post-content-config';
import type { PostContentTransFn } from './types';

type PostBackAuthorHeaderProps = {
    post: PostItem;
    page: unknown;
    backHref: ComponentProps<typeof Link>['href'];
    currentUserId?: number;
    displayName: string;
    isAnonymousPost: boolean;
    isFollowingAuthor: boolean;
    followingAuthorLoading: boolean;
    trans: PostContentTransFn;
    onFollowAuthor: () => void;
};

function PostBadges({
    post,
    page,
    trans,
}: {
    post: PostItem;
    page: unknown;
    trans: PostContentTransFn;
}) {
    const type =
        post.post_type === 'quiz'
            ? 'quiz'
            : post.post_type === 'discussion'
              ? 'discussion'
            : post.post_type === 'question'
              ? 'question'
              : 'material';
    const { bg: typeBg, text: typeText } = getPostTypeBadgeProps(type);
    const typeLabel =
        type === 'quiz'
            ? trans('createPost.create_quiz', page)
            : type === 'discussion'
              ? trans('createPost.create_discussion', page)
            : type === 'question'
              ? trans('createPost.ask_question', page)
              : trans('createPost.share_material', page);
    const code = post.language?.code || 'en';
    const { bg: langBg, text: langText } = getLangBadgeProps(code);
    const languageLabel = trans(`language_label.${code}`, page);
    const { bg: subjectBg, text: subjectText } = getSubjectBadgeProps();
    const subjectLabel = getSubjectLabelFromPage(
        post.subject?.name,
        trans,
        page,
    );

    return (
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
            <span
                className={`rounded-full px-2 py-0.5 font-medium ${typeBg} ${typeText}`}
            >
                {typeLabel}
            </span>
            <span
                className={`rounded-full px-2 py-0.5 font-medium ${langBg} ${langText}`}
            >
                {languageLabel}
            </span>
            {subjectLabel ? (
                <span
                    className={`rounded-full px-2 py-0.5 font-medium ${subjectBg} ${subjectText}`}
                >
                    {subjectLabel}
                </span>
            ) : null}
        </div>
    );
}

export function PostBackAuthorHeader({
    post,
    page,
    backHref,
    currentUserId,
    displayName,
    isAnonymousPost,
    isFollowingAuthor,
    followingAuthorLoading,
    trans,
    onFollowAuthor,
}: PostBackAuthorHeaderProps) {
    return (
        <div className="flex items-start justify-between px-4 pt-6 pb-4">
            <div className="flex items-start gap-3 sm:gap-6">
                <Link
                    href={backHref}
                    className="mt-0.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-sidebar-border bg-background from-[#ef99b0] to-[#e27193] text-foreground hover:border-2 hover:border-[#e27193] hover:bg-linear-to-r hover:text-white sm:h-10 sm:w-10"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>

                {isAnonymousPost ? (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 shrink-0 overflow-hidden ring-2 ring-transparent">
                            <AvatarFallback className="bg-zinc-200 text-base font-bold text-zinc-700">
                                ?
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col leading-tight">
                            <div className="min-w-0 flex-1">
                                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-sm sm:mb-3 sm:gap-3 sm:text-base">
                                    <span className="font-semibold text-zinc-900">
                                        {displayName}
                                    </span>
                                    <span className="text-zinc-400">•</span>
                                    <span className="text-sm text-zinc-500">
                                        {formatTimeAgo(post.created_at)}
                                    </span>
                                </div>
                                <PostBadges
                                    post={post}
                                    page={page}
                                    trans={trans}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <Link
                            href={
                                post.user?.id
                                    ? `/profilePage/${post.user.id}`
                                    : '/profilePage'
                            }
                            className="peer group/avatar cursor-pointer"
                        >
                            <Avatar className="h-11 w-11 shrink-0 overflow-hidden ring-2 ring-transparent transition-colors group-hover/avatar:ring-[#ef99b0]">
                                {post.user?.avatar ? (
                                    <AvatarImage
                                        src={post.user.avatar}
                                        alt={post.user?.name ?? 'User avatar'}
                                    />
                                ) : null}
                                <AvatarFallback className="bg-zinc-200 text-base font-bold text-zinc-700">
                                    {(post.user?.name ?? 'U')
                                        .charAt(0)
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="flex flex-col leading-tight">
                            <div className="min-w-0 flex-1">
                                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-sm sm:mb-3 sm:gap-3 sm:text-base">
                                    <Link
                                        href={
                                            post.user?.id
                                                ? `/profilePage/${post.user.id}`
                                                : '/profilePage'
                                        }
                                        className="cursor-pointer font-semibold text-zinc-900 transition-colors peer-hover:text-[#de6b89] hover:text-[#de6b89]"
                                    >
                                        {displayName}
                                    </Link>
                                    <LeaderboardTitleBadge
                                        title={post.user?.leaderboard_title}
                                    />
                                    {post.user?.id &&
                                    currentUserId &&
                                    post.user.id !== currentUserId ? (
                                        <BtnFollow
                                            following={isFollowingAuthor}
                                            loading={followingAuthorLoading}
                                            onClick={() => {
                                                void onFollowAuthor();
                                            }}
                                        />
                                    ) : null}
                                    <span className="text-zinc-400">•</span>
                                    <span className="text-sm text-zinc-500">
                                        {formatTimeAgo(post.created_at)}
                                    </span>
                                </div>
                                <PostBadges
                                    post={post}
                                    page={page}
                                    trans={trans}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

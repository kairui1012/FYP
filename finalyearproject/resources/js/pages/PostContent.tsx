import { Head, Link, router } from '@inertiajs/react';
import { useState, type ReactElement, type ReactNode } from 'react';
import { PostAttachments } from '@/components/post-attachments';
import {
    formatFullDate,
    formatTimeAgo,
    getLanguageLabel,
} from '@/lib/post-utils';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem, PostItem } from '@/types';
import { ArrowLeft, Bell, ChevronDown, ChevronUp, MessageSquare, MoreHorizontal } from 'lucide-react';
import { BtnComment } from '@/components/ui/btn-comment';
import { BtnLike } from '@/components/ui/btn-like';
import { BtnShare } from '@/components/ui/btn-share';
import like from '@/routes/like';
type PostContentProps = {
    post: PostItem;
};
import { BtnAiTranslate } from '@/components/ui/btn-ai-translate';
import { usePage } from '@inertiajs/react';

function getLangBadgeProps(code: string) {
    if (code === 'en') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (code === 'zh') return { bg: 'bg-red-100', text: 'text-red-700' };
    if (code === 'bm' || code === 'my') return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-gray-200', text: 'text-gray-700' };
}

function trans(key: string, page: any) {
    // 支持嵌套 key，如 language_label.zh
    const parts = key.split('.');
    let obj = page.props?.lang;
    for (const part of parts) {
        if (obj && typeof obj === 'object' && part in obj) {
            obj = obj[part];
        } else {
            return key;
        }
    }
    return typeof obj === 'string' ? obj : key;
}

export default function PostContent({ post }: PostContentProps) {
    const [translated, setTranslated] = useState<{ title: string; content: string } | null>(null);
    const [isLiked, setIsLiked] = useState(Boolean(post.is_liked));
    const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
    const [liking, setLiking] = useState(false);

    const handleLike = (postId: number) => {
        if (liking) {
            return;
        }

        const previousLiked = isLiked;
        const previousLikesCount = likesCount;
        const optimisticLiked = !previousLiked;

        setLiking(true);
        setIsLiked(optimisticLiked);
        setLikesCount((count) => Math.max(0, count + (optimisticLiked ? 1 : -1)));

        router.post(like.toggle.url({ posts: postId }), {}, {
            preserveScroll: true,
            preserveState: true,
            only: ['post'],
            onError: () => {
                setIsLiked(previousLiked);
                setLikesCount(previousLikesCount);
            },
            onSuccess: (page) => {
                const nextPost = (page.props as { post?: PostItem }).post;

                if (!nextPost) {
                    return;
                }

                setIsLiked(Boolean(nextPost.is_liked));
                setLikesCount(nextPost.likes_count ?? 0);
            },
            onFinish: () => {
                setLiking(false);
            },
        });
    };

    return (
        <>
            <Head title={translated?.title ?? post.title} />

            <div className="w-full bg-white pb-20">
                <div className="mx-auto w-full max-w-3xl ">
                    <div className="flex items-center justify-between px-3 pt-4 pb-3">
                        <div className="flex items-center gap-3 mb-3">
                            <Link
                                href={homePage()}
                                className="flex h-10 w-10 items-center justify-center rounded-full 
                                bg-background text-foreground 
                                border-2 border-sidebar-border
                                hover:border-2 hover:border-[#e27193]
                                hover:bg-linear-to-r from-[#ef99b0] to-[#e27193] hover:text-white"                            
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            <Link href={post.user?.id ? `/profilePage/${post.user.id}` : '/profilePage'} className="group flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-base font-bold text-zinc-700 overflow-hidden ring-2 ring-transparent transition-colors group-hover:ring-[#ef99b0]">
                                    {(post.user?.name ?? 'U')
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 text-base">
                                            <p className="font-semibold text-zinc-900 transition-colors group-hover:text-[#de6b89]">
                                                {post.user?.name ?? 'Unknown User'}
                                            </p>
                                            <span className="text-zinc-400">•</span>
                                            <span className="text-zinc-500 text-sm">
                                                {formatTimeAgo(post.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                                            {(() => {
                                                const page = usePage();
                                                const code = post.language?.code || 'en';
                                                const { bg, text } = getLangBadgeProps(code);
                                                const label = trans(`language_label.${code}`, page);
                                                return (
                                                    <span className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}>
                                                        {label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                    <h1 className="px-4 pb-4 text-2xl font-bold leading-snug text-zinc-950">
                        {translated?.title ?? post.title}
                    </h1>
                    {(translated?.content ?? post.content) && (
                        <p className="px-4 pb-4 text-base leading-7 whitespace-pre-wrap text-zinc-700">
                            {translated?.content ?? post.content}
                        </p>
                    )}
                    <PostAttachments files={post.image} />
                    <PostFooter
                        postId={post.id}
                        liked={isLiked}
                        loading={liking}
                        onLike={handleLike}
                        likes={likesCount}
                        comments={post.comments_count ?? 0}
                    />
                    <div className=" w-full border-t border-zinc-200 mt-1 mb-3"></div>
                    <BtnAiTranslate
                        title={post.title}
                        content={post.content ?? ''}
                        onTranslate={setTranslated}
                    />
                </div>
            </div>
        </>
    );
}

PostContent.layout = (page: ReactNode) => {
    const pageWithProps = page as ReactElement<PostContentProps>;
    const { post } = pageWithProps.props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Home',
            href: homePage(),
        },
        {
            title: post.title,
            href: `/posts/${post.id}`,
        },
    ];

    return <AppLayout breadcrumbs={breadcrumbs}>{pageWithProps}</AppLayout>;
};
type PostFooterProps = {
    postId: number;
    likes: number;
    liked: boolean;
    loading?: boolean;
    onLike: (postId: number) => void;
    comments: number;
};


function PostFooter({ postId, likes, liked, loading = false, onLike, comments }: PostFooterProps) {
    return (
        <div className="mt-3 flex items-center gap-3 text-sm text-zinc-900">
            <BtnLike
                count={likes}
                liked={liked}
                loading={loading}
                className="mb-5"
                onClick={() => onLike(postId)}
            />
            <BtnComment count={comments} className="mb-5" />
            <BtnShare className="mb-5" />
        </div>
    );
}
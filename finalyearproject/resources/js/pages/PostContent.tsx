import { Head, Link } from '@inertiajs/react';
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
import { ArrowLeft, Heart, MessageCircle, Bell, ChevronDown, ChevronUp, MessageSquare, MoreHorizontal, Share2 } from 'lucide-react';
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
    return (
        <>
            <Head title={translated?.title ?? post.title} />

            <div className="min-h-screen bg-white mb-6">
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
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-base font-bold text-zinc-700 overflow-hidden">
                                {(post.user?.name ?? 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>
                            <div className="flex flex-col leading-tight">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 text-base">
                                        <p className="font-semibold text-zinc-900">
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
                        likes={post.likes_count ?? 0}
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
    likes: number;
    comments: number;
};


function PostFooter({ likes, comments }: PostFooterProps) {
    const btnClass =
        "inline-flex items-center gap-2 rounded-full bg-zinc-200 px-3.5 py-1.5 font-semibold transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 text-zinc-600 hover:bg-gradient-to-r hover:from-[#ef99b0] hover:to-pink-500 hover:text-white active:bg-rose-700 active:text-white group mb-5";
    return (
        <div className="mt-3 flex items-center gap-3 text-sm text-zinc-900">
            <button
                type="button"
                className={btnClass}
                onClick={event => event.stopPropagation()}
            >
                <Heart className="h-4 w-4 text-zinc-600 group-hover:text-white group-active:text-white transition-colors" />
                <span className="text-zinc-600 group-hover:text-white group-active:text-white transition-colors">{likes}</span>
            </button>
            <button
                type="button"
                className={btnClass}
                onClick={event => event.stopPropagation()}
            >
                <MessageCircle className="h-4 w-4 text-zinc-600 group-hover:text-white group-active:text-white transition-colors" />
                <span className="text-zinc-600 group-hover:text-white group-active:text-white transition-colors">{comments}</span>
            </button>
            <button
                type="button"
                className={btnClass}
                onClick={event => event.stopPropagation()}
            >
                <Share2 className="h-4 w-4 text-zinc-600 group-hover:text-white group-active:text-white transition-colors" />
                <span className="text-zinc-600 group-hover:text-white group-active:text-white transition-colors">Share</span>
            </button>
        </div>
    );
}
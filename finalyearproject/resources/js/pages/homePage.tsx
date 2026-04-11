import { Head, router } from '@inertiajs/react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { PostAttachments } from '@/components/post-attachments';
import { formatTimeAgo, getLanguageLabel } from '@/lib/post-utils';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem, PostItem } from '@/types';
import { usePage } from '@inertiajs/react';

type PostFooterProps = {
    likes: number;
    comments: number;
};

function PostFooter({ likes, comments }: PostFooterProps) {
    const btnClass =
        "inline-flex items-center gap-2 rounded-full bg-zinc-200 px-3.5 py-1.5 font-semibold transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 text-zinc-600 hover:bg-gradient-to-r hover:from-[#ef99b0] hover:to-pink-500 hover:text-white active:bg-rose-700 active:text-white group mb-2";
    return (
        <div className="mt-2 flex items-center gap-3 text-sm text-zinc-900">
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

type HomePageProps = {
    posts?: PostItem[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Home',
        href: homePage(),
    },
];

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

export default function HomePage({ posts = [] }: HomePageProps) {
    const goToPost = (postId: number) => {
        router.get(`/posts/${postId}`);
    };
    const page = usePage();

    return (
        <>
            <Head title="Home" />
            <div className="pb-8">
                <div className="mx-auto w-full max-w-3xl space-y-2 p-4 md:p-6 md:pb-10">
                    {posts.length === 0 ? (
                        <div className="rounded-3xl border border-zinc-600 bg-white p-10 text-center text-zinc-500">
                            No posts yet. Be the first to post!
                        </div>
                    ) : (
                        posts.map((post) => (
                            <div key={post.id}>
                                <article
                                    className="cursor-pointer rounded-xl p-5 transition-colors hover:bg-[#F2F4F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 mb-2"
                                    onClick={() => goToPost(post.id)}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                        ) {
                                            event.preventDefault();
                                            goToPost(post.id);
                                        }
                                    }}
                                    role="link"
                                    tabIndex={0}
                                >
                                    <header className=" flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 ">
                                                {(post.user?.name ?? 'U')
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
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
                                    </header>

                                    <h2 className="mb-2 text-lg font-bold text-zinc-900">
                                        {post.title}
                                    </h2>
                                    <p className="mb-2 text-base font-medium leading-6 whitespace-pre-wrap text-zinc-700">
                                        {post.content}
                                    </p>

                                    <PostAttachments files={post.image} compact />
                                </article>
                                <PostFooter
                                    likes={post.likes_count ?? 0}
                                    comments={post.comments_count ?? 0}
                                />
                                <div className=" w-full border-t border-zinc-200 mt-1"></div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

HomePage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

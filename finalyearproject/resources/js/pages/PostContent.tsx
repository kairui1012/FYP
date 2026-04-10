import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Heart, MessageCircle, Share2 } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { PostAttachments } from '@/components/post-attachments';
import {
    formatFullDate,
    formatTimeAgo,
    getLanguageLabel,
} from '@/lib/post-utils';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem, PostItem } from '@/types';

type PostContentProps = {
    post: PostItem;
};

export default function PostContent({ post }: PostContentProps) {
    return (
        <>
            <Head title={post.title} />

            <div className="bg-rose-50 pb-8">
                <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
                    <Link
                        href={homePage()}
                        className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>

                    <article className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
                        <header className="mb-6 flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-base font-semibold text-zinc-700">
                                {(post.user?.name ?? 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-base font-semibold text-zinc-900">
                                    {post.user?.name ?? 'Unknown User'}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                                    <span>
                                        {formatTimeAgo(post.created_at)}
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {formatFullDate(post.created_at)}
                                    </span>
                                </div>
                            </div>
                        </header>

                        <div className="mb-4 flex flex-wrap gap-2">
                            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                                {getLanguageLabel(post.language?.code)}
                            </span>
                        </div>

                        <h1 className="mb-4 text-2xl font-semibold text-zinc-950 md:text-3xl">
                            {post.title}
                        </h1>

                        <p className="mb-6 text-base leading-8 whitespace-pre-wrap text-zinc-700">
                            {post.content}
                        </p>

                        <PostAttachments files={post.image} />

                        <div className="mt-6 border-t border-zinc-100 pt-4">
                            <div className="flex flex-wrap items-center gap-5 text-sm text-zinc-600">
                                <div className="inline-flex items-center gap-2">
                                    <Heart className="h-4 w-4" />
                                    <span>{post.likes_count ?? 0}</span>
                                </div>
                                <div className="inline-flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    <span>{post.comments_count ?? 0}</span>
                                </div>
                                <div className="inline-flex items-center gap-2">
                                    <Share2 className="h-4 w-4" />
                                    <span>Share</span>
                                </div>
                            </div>
                        </div>
                    </article>
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

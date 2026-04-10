import { Head, router } from '@inertiajs/react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { PostAttachments } from '@/components/post-attachments';
import { formatTimeAgo, getLanguageLabel } from '@/lib/post-utils';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem, PostItem } from '@/types';

type HomePageProps = {
    posts?: PostItem[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Home',
        href: homePage(),
    },
];

export default function HomePage({ posts = [] }: HomePageProps) {
    const goToPost = (postId: number) => {
        router.get(`/posts/${postId}`);
    };

    return (
        <>
            <Head title="Home" />
            <div className="bg-rose-50 pb-6">
                <div className="mx-auto w-full max-w-4xl space-y-6 p-4 pb-8 md:p-6 md:pb-10">
                    {posts.length === 0 ? (
                        <div className="rounded-2xl border border-zinc-600 bg-white p-10 text-center text-zinc-500">
                            No posts yet. Be the first to post!
                        </div>
                    ) : (
                        posts.map((post) => (
                            <article
                                key={post.id}
                                className="cursor-pointer rounded-3xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
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
                                <header className="mb-4 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700">
                                            {(post.user?.name ?? 'U')
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900">
                                                {post.user?.name ??
                                                    'Unknown User'}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <span>
                                                    {formatTimeAgo(
                                                        post.created_at,
                                                    )}
                                                </span>
                                                <span>•</span>
                                                <span className="rounded-full bg-zinc-100 px-2 py-0.5">
                                                    {getLanguageLabel(
                                                        post.language?.code,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </header>

                                <h2 className="mb-2 text-base font-semibold text-zinc-900">
                                    {post.title}
                                </h2>
                                <p className="mb-3 text-sm leading-6 whitespace-pre-wrap text-zinc-700">
                                    {post.content}
                                </p>

                                <PostAttachments files={post.image} compact />

                                <div className="mt-5 w-full border-t border-zinc-100"></div>
                                <footer className="mx-auto mt-2 flex max-w-10/12 justify-between text-sm text-zinc-600">
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-100"
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                    >
                                        <Heart className="h-4 w-4" />
                                        <span>{post.likes_count ?? 0}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-100"
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        <span>{post.comments_count ?? 0}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-100"
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                    >
                                        <Share2 className="h-4 w-4" />
                                        <span>Share</span>
                                    </button>
                                </footer>
                            </article>
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

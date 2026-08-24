import { Link } from '@inertiajs/react';
import { MessageCircle, ThumbsUp, Trophy } from 'lucide-react';
import type {
    ProfilePost,
    TransFn,
} from '@/components/ts/features/profile/profile-types';
import { formatTimeAgo } from '@/lib/post-display-helpers';

export function ProfilePostsTab({
    posts,
    labels,
    trans,
}: {
    posts: ProfilePost[];
    labels: {
        noPostsYet: string;
        likes: string;
        comments: string;
        attachmentSingle: string;
        attachmentPlural: string;
    };
    trans: TransFn;
}) {
    if (posts.length === 0) {
        return (
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <div className="relative overflow-hidden rounded-2xl border border-dashed border-rose-200 bg-linear-to-br from-rose-50 via-white to-sky-50 px-5 py-12 text-center md:px-8 md:py-14">
                    <div className="mx-auto flex max-w-lg flex-col items-center">
                        <div className="relative mb-5 h-20 w-28">
                            <div className="absolute top-0 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-rose-100">
                                <Trophy className="h-7 w-7 text-[#e27193]" />
                            </div>
                            <div className="absolute bottom-0 left-3 h-10 w-10 rounded-full bg-sky-100 ring-4 ring-white" />
                            <div className="absolute right-3 bottom-0 h-10 w-10 rounded-full bg-amber-100 ring-4 ring-white" />
                        </div>
                        <h2 className="text-lg font-bold text-zinc-900">
                            {labels.noPostsYet}
                        </h2>
                        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
                            {trans('profile.earn_badges_hint')}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {posts.map((post) => (
                    <article
                        key={post.id}
                        className="group p-5 transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                    >
                        <Link href={`/posts/${post.id}`} className="block">
                            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                <span>{formatTimeAgo(post.created_at)}</span>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" />
                                    {post.likes_count ?? 0} {labels.likes}
                                </span>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1">
                                    <MessageCircle className="h-3 w-3" />
                                    {post.comments_count ?? 0} {labels.comments}
                                </span>
                            </div>
                            <h3 className="text-base font-semibold text-zinc-900 transition group-hover:text-[#de6b89] dark:text-zinc-100">
                                {post.title}
                            </h3>
                            <p
                                className="mt-2 border-l-2 border-rose-200 pl-3 text-sm leading-6 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400"
                                style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {post.content}
                            </p>
                            {post.image && post.image.length > 0 && (
                                <p className="mt-2 text-xs text-zinc-400">
                                    {post.image.length}{' '}
                                    {post.image.length > 1
                                        ? labels.attachmentPlural
                                        : labels.attachmentSingle}
                                </p>
                            )}
                        </Link>
                    </article>
                ))}
            </div>
        </section>
    );
}

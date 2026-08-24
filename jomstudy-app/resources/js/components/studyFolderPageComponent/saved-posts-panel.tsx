import { Bookmark } from 'lucide-react';
import { Fragment } from 'react';
import type { TransFn } from '@/components/ts/features/study-folder/study-folder-types';
import type { PostItem } from '@/types';
import { PostCard } from './post-card';

type SavedPostsPanelProps = {
    posts: PostItem[];
    savingPostIds: number[];
    trans: TransFn;
    onToggleSave: (postId: number) => void;
};

export function SavedPostsPanel({
    posts,
    savingPostIds,
    trans,
    onToggleSave,
}: SavedPostsPanelProps) {
    return (
        <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                    <p className="text-sm font-semibold text-zinc-600">
                        {trans('bookmark.study_folder_all')}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-zinc-900">
                        {trans('bookmark.study_folder_all')}
                    </h2>
                </div>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-semibold text-zinc-700">
                    {posts.length}
                </span>
            </div>

            <div className="mt-6">
                {posts.length === 0 ? (
                    <div className="relative overflow-hidden rounded-2xl border border-dashed border-rose-200 bg-linear-to-br from-rose-50 via-white to-sky-50 px-5 py-12 text-center md:px-8 md:py-14">
                        <div className="mx-auto flex max-w-lg flex-col items-center">
                            <div className="relative mb-5 h-20 w-28">
                                <div className="absolute top-0 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-rose-100">
                                    <span className="text-[#e27193] [&>svg]:h-7 [&>svg]:w-7">
                                        <Bookmark />
                                    </span>
                                </div>
                                <div className="absolute bottom-0 left-2 h-10 w-10 rounded-full bg-sky-100 ring-4 ring-white" />
                                <div className="absolute right-2 bottom-0 h-10 w-10 rounded-full bg-amber-100 ring-4 ring-white" />
                            </div>
                            <h2 className="text-lg font-bold text-zinc-900">
                                {trans('bookmark.no_bookmarks')}
                            </h2>
                            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
                                {trans('bookmark.save_posts')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div>
                        {posts.map((post, index) => (
                            <Fragment key={post.id}>
                                {index > 0 && (
                                    <hr className="my-5 border-zinc-100" />
                                )}
                                <PostCard
                                    post={post}
                                    savingPostIds={savingPostIds}
                                    onToggleSave={onToggleSave}
                                    trans={trans}
                                />
                            </Fragment>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

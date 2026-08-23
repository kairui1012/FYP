import { Bookmark } from 'lucide-react';
import { Fragment } from 'react';
import type { BookmarkFolderItem, PostItem } from '@/types';
import { EmptyState } from './empty-state';
import { PostCard } from './post-card';
import type { TransFn } from './types';

type SavedPostsPanelProps = {
    posts: PostItem[];
    folders: BookmarkFolderItem[];
    activeFolder: BookmarkFolderItem | undefined;
    activeFolderId: number | null | undefined;
    movingPostIds: number[];
    savingPostIds: number[];
    trans: TransFn;
    onMove: (postId: number, folderId: number) => Promise<void>;
    onToggleSave: (postId: number) => void;
};

export function SavedPostsPanel({
    posts,
    folders,
    activeFolder,
    activeFolderId,
    movingPostIds,
    savingPostIds,
    trans,
    onMove,
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
                        {activeFolder
                            ? activeFolder.name
                            : trans('bookmark.folders_title')}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                        {trans('bookmark.move_post_help')}
                    </p>
                </div>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-semibold text-zinc-700">
                    {posts.length}
                </span>
            </div>

            <div className="mt-6">
                {posts.length === 0 ? (
                    <EmptyState
                        icon={<Bookmark />}
                        title={trans('bookmark.no_bookmarks')}
                        subtitle={trans('bookmark.save_posts')}
                    />
                ) : (
                    <div>
                        {posts.map((post, index) => (
                            <Fragment key={post.id}>
                                {index > 0 && (
                                    <hr className="my-5 border-zinc-100" />
                                )}
                                <PostCard
                                    post={post}
                                    folders={folders}
                                    activeFolderId={activeFolderId}
                                    movingPostIds={movingPostIds}
                                    savingPostIds={savingPostIds}
                                    onMove={onMove}
                                    onToggleSave={onToggleSave}
                                    trans={trans}
                                    showFolderSelect
                                />
                            </Fragment>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

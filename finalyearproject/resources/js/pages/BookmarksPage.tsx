import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { reactLang } from '@erag/lang-sync-inertia';
import { Bookmark, FolderPlus, PencilLine, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BtnSave } from '@/components/ui/btn-save';
import { formatFormulaText } from '@/lib/formula-display';
import { formatTimeAgo, getLanguageLabel } from '@/lib/post-utils';
import type { BookmarkFolderItem, BreadcrumbItem, PostItem } from '@/types';

const PostAttachments = lazy(() => import('@/components/post-attachments').then((m) => ({ default: m.PostAttachments })));

type BookmarksPageProps = {
    posts?: PostItem[];
    folders?: BookmarkFolderItem[];
    activeFolderId?: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Bookmarks',
        href: '/bookmarks',
    },
];

function getPostTypeBadgeProps(type: string) {
    if (type === 'quiz') return { bg: 'bg-amber-100', text: 'text-amber-700' };
    if (type === 'question') return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    return { bg: 'bg-violet-100', text: 'text-violet-700' };
}

function getSubjectBadgeProps() {
    return { bg: 'bg-slate-100', text: 'text-slate-700' };
}

function toBookmarksUrl(folderId?: number) {
    if (!folderId) {
        return '/bookmarks';
    }

    return `/bookmarks?folder_id=${folderId}`;
}

export default function BookmarksPage() {
    const { trans } = reactLang();
    const { props } = usePage<BookmarksPageProps>();

    const folders = props.folders ?? [];
    const posts = props.posts ?? [];
    const activeFolderId = props.activeFolderId ?? folders.find((folder) => folder.is_default)?.id ?? folders[0]?.id;
    const activeFolder = folders.find((folder) => folder.id === activeFolderId);

    const [creatingFolder, setCreatingFolder] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [renamingFolderId, setRenamingFolderId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [savingPostIds, setSavingPostIds] = useState<number[]>([]);
    const [movingPostIds, setMovingPostIds] = useState<number[]>([]);

    const totalSaves = useMemo(
        () => folders.reduce((sum, folder) => sum + (folder.items_count ?? 0), 0),
        [folders],
    );

    const refreshCurrentFolder = (folderId = activeFolderId) => {
        router.get(toBookmarksUrl(folderId), {}, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    const withCsrfHeaders = () => {
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

        return {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
        };
    };

    const handleCreateFolder = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const name = folderName.trim();
        if (!name) {
            return;
        }

        setCreatingFolder(true);

        try {
            const response = await fetch('/bookmarks/folders', {
                method: 'POST',
                headers: withCsrfHeaders(),
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                throw new Error('Failed to create folder.');
            }

            const payload = (await response.json()) as {
                folder?: BookmarkFolderItem;
            };

            setFolderName('');
            refreshCurrentFolder(payload.folder?.id ?? activeFolderId);
        } finally {
            setCreatingFolder(false);
        }
    };

    const handleRenameFolder = async (folderId: number) => {
        const name = renameValue.trim();
        if (!name) {
            return;
        }

        setRenamingFolderId(folderId);

        try {
            const response = await fetch(`/bookmarks/folders/${folderId}`, {
                method: 'PATCH',
                headers: withCsrfHeaders(),
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                throw new Error('Failed to rename folder.');
            }

            setRenameValue('');
            setRenamingFolderId(null);
            refreshCurrentFolder(activeFolderId);
        } finally {
            setRenamingFolderId(null);
        }
    };

    const handleDeleteFolder = async (folderId: number) => {
        const response = await fetch(`/bookmarks/folders/${folderId}`, {
            method: 'DELETE',
            headers: withCsrfHeaders(),
        });

        if (!response.ok) {
            return;
        }

        const payload = (await response.json()) as { folder_id?: number };
        refreshCurrentFolder(payload.folder_id ?? activeFolderId);
    };

    const handleToggleSave = async (postId: number) => {
        if (savingPostIds.includes(postId)) {
            return;
        }

        setSavingPostIds((prev) => [...prev, postId]);

        try {
            const response = await fetch(`/posts/${postId}/save`, {
                method: 'POST',
                headers: withCsrfHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to toggle save.');
            }

            refreshCurrentFolder(activeFolderId);
        } finally {
            setSavingPostIds((prev) => prev.filter((id) => id !== postId));
        }
    };

    const handleMovePost = async (postId: number, folderId: number) => {
        if (!folderId || movingPostIds.includes(postId)) {
            return;
        }

        setMovingPostIds((prev) => [...prev, postId]);

        try {
            const response = await fetch(`/bookmarks/posts/${postId}/move`, {
                method: 'POST',
                headers: withCsrfHeaders(),
                body: JSON.stringify({ folder_id: folderId }),
            });

            if (!response.ok) {
                throw new Error('Failed to move post.');
            }

            refreshCurrentFolder(activeFolderId);
        } finally {
            setMovingPostIds((prev) => prev.filter((id) => id !== postId));
        }
    };

    return (
        <>
            <Head title={trans('navigation.bookmarks')} />

            <div className="w-full max-w-none p-4 pb-24 md:p-6 md:pb-24">
                <div className="mx-auto w-full max-w-6xl space-y-6">
                    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="max-w-2xl">
                                <h1 className="text-3xl font-bold text-zinc-900">{trans('navigation.bookmarks')}</h1>
                                <p className="mt-2 text-zinc-600">
                                    {trans('bookmark.description')}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                                <div>
                                    {trans('bookmark.folders_title')}: <span className="font-semibold">{folders.length}</span>
                                </div>
                                <div className="mt-1">
                                    {trans('bookmark.saved_items')}: <span className="font-semibold">{totalSaves}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            {folders.map((folder) => {
                                const isActive = folder.id === activeFolderId;

                                return (
                                    <button
                                        key={folder.id}
                                        type="button"
                                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                                            isActive
                                                ? 'border-[#e27193] bg-[#fff0f5] text-[#b93c61]'
                                                : 'border-zinc-300 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50'
                                        }`}
                                        onClick={() => refreshCurrentFolder(folder.id)}
                                    >
                                        <Bookmark className="h-4 w-4" />
                                        <span>{folder.name}</span>
                                        <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-zinc-600">
                                            {folder.items_count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
                        <aside className="space-y-4">
                            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <FolderPlus className="h-5 w-5 text-zinc-700" />
                                    <h2 className="text-lg font-semibold text-zinc-900">{trans('bookmark.create_folder')}</h2>
                                </div>

                                <p className="mt-2 text-sm text-zinc-600">
                                    {trans('bookmark.create_folder_help')}
                                </p>

                                <form className="mt-4 space-y-3" onSubmit={handleCreateFolder}>
                                    <label className="block text-sm font-medium text-zinc-700" htmlFor="bookmark-folder-name">
                                        {trans('bookmark.folder_name_label')}
                                    </label>
                                    <input
                                        id="bookmark-folder-name"
                                        type="text"
                                        value={folderName}
                                        onChange={(event) => setFolderName(event.target.value)}
                                        placeholder={trans('bookmark.folder_name_placeholder')}
                                        className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#e27193] focus:ring-2 focus:ring-[#ffd9e4]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={creatingFolder}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        <FolderPlus className="h-4 w-4" />
                                        {trans('bookmark.create_folder')}
                                    </button>
                                </form>
                            </section>

                            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                                <h2 className="text-lg font-semibold text-zinc-900">{trans('bookmark.folders_title')}</h2>
                                <div className="mt-4 space-y-3">
                                    {folders.length === 0 ? (
                                        <p className="text-sm text-zinc-500">{trans('bookmark.no_folders')}</p>
                                    ) : (
                                        folders.map((folder) => (
                                            <div key={folder.id} className="rounded-2xl border border-zinc-200 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                                                            <span>{folder.name}</span>
                                                            {folder.is_default ? (
                                                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                                                                    {trans('bookmark.default_folder')}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <p className="mt-1 text-xs text-zinc-500">
                                                            {folder.items_count} {trans('bookmark.saved_items')}
                                                        </p>
                                                    </div>
                                                    {folder.is_default ? null : (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                                                                onClick={() => {
                                                                    setRenamingFolderId(folder.id);
                                                                    setRenameValue(folder.name);
                                                                }}
                                                            >
                                                                <PencilLine className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-rose-600"
                                                                onClick={() => {
                                                                    void handleDeleteFolder(folder.id);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {renamingFolderId === folder.id ? (
                                                    <div className="mt-3 space-y-2">
                                                        <input
                                                            type="text"
                                                            value={renameValue}
                                                            onChange={(event) => setRenameValue(event.target.value)}
                                                            className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#e27193] focus:ring-2 focus:ring-[#ffd9e4]"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
                                                                onClick={() => {
                                                                    void handleRenameFolder(folder.id);
                                                                }}
                                                            >
                                                                {trans('bookmark.rename_folder')}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                                                                onClick={() => {
                                                                    setRenamingFolderId(null);
                                                                    setRenameValue('');
                                                                }}
                                                            >
                                                                {trans('bookmark.cancel')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </aside>

                        <main className="space-y-4">
                            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                            <h2 className="text-xl font-semibold text-zinc-900">
                                                {activeFolder ? activeFolder.name : trans('bookmark.folders_title')}
                                        </h2>
                                        <p className="mt-1 text-sm text-zinc-600">
                                            {trans('bookmark.move_post_help')}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                                        {trans('bookmark.saved_items')}: <span className="font-semibold">{posts.length}</span>
                                    </div>
                                </div>
                            </section>

                            {posts.length === 0 ? (
                                <section className="rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center">
                                    <Bookmark className="mx-auto h-12 w-12 text-zinc-400" />
                                    <h2 className="mt-4 text-xl font-semibold text-zinc-900">
                                        {trans('bookmark.no_bookmarks')}
                                    </h2>
                                    <p className="mt-2 text-zinc-500">{trans('bookmark.save_posts')}</p>
                                    <button
                                        type="button"
                                        className="mt-6 rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
                                        onClick={() => router.visit('/homePage')}
                                    >
                                        {trans('bookmark.discover_posts')}
                                    </button>
                                </section>
                            ) : (
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <article
                                            key={post.id}
                                            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
                                        >
                                            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-2 text-sm text-zinc-500">
                                                    <Link
                                                        href={post.user?.id ? `/profilePage/${post.user.id}` : '/profilePage'}
                                                        className="truncate font-semibold text-zinc-800 hover:text-[#de6b89]"
                                                    >
                                                        {post.user?.name ?? trans('bookmark.unknown_user')}
                                                    </Link>
                                                    <span>•</span>
                                                    <span>{formatTimeAgo(post.created_at)}</span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <select
                                                        value={post.bookmark_folder_id ?? activeFolderId}
                                                        disabled={movingPostIds.includes(post.id)}
                                                        onChange={(event) => {
                                                            void handleMovePost(post.id, Number(event.target.value));
                                                        }}
                                                        className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 outline-none transition focus:border-[#e27193] focus:ring-2 focus:ring-[#ffd9e4] disabled:cursor-not-allowed disabled:opacity-70"
                                                    >
                                                        {folders.map((folder) => (
                                                            <option key={folder.id} value={folder.id}>
                                                                {folder.name}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <BtnSave
                                                        count={post.saves_count ?? 0}
                                                        saved={Boolean(post.is_saved)}
                                                        loading={savingPostIds.includes(post.id)}
                                                        onClick={() => {
                                                            void handleToggleSave(post.id);
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <Link href={`/posts/${post.id}`} className="block">
                                                <h2 className="text-lg font-bold text-zinc-900 hover:text-[#de6b89]">{post.title}</h2>
                                                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-zinc-700">
                                                    {formatFormulaText(post.content ?? '')}
                                                </p>
                                            </Link>

                                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                                {(() => {
                                                    const type = post.post_type === 'quiz'
                                                        ? 'quiz'
                                                        : post.post_type === 'question'
                                                            ? 'question'
                                                            : 'material';
                                                    const { bg, text } = getPostTypeBadgeProps(type);
                                                    const label =
                                                        type === 'quiz'
                                                            ? trans('createPost.create_quiz')
                                                            : type === 'question'
                                                                ? trans('createPost.ask_question')
                                                                : trans('createPost.share_material');

                                                    return (
                                                        <span className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}>
                                                            {label}
                                                        </span>
                                                    );
                                                })()}

                                                {post.language?.code ? (
                                                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
                                                        {getLanguageLabel(post.language.code)}
                                                    </span>
                                                ) : null}

                                                {post.subject?.name ? (() => {
                                                    const { bg, text } = getSubjectBadgeProps();

                                                    return (
                                                        <span className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}>
                                                            {post.subject.name}
                                                        </span>
                                                    );
                                                })() : null}
                                            </div>

                                            {post.image && post.image.length > 0 ? (
                                                <div className="mt-4">
                                                    <Suspense fallback={null}>
                                                        <PostAttachments files={post.image} compact />
                                                    </Suspense>
                                                </div>
                                            ) : null}
                                        </article>
                                    ))}
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}

BookmarksPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
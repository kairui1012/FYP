import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { reactLang } from '@erag/lang-sync-inertia';
import {
    Bookmark,
    BookOpen,
    CheckCircle2,
    ExternalLink,
    Folder,
    FolderPlus,
    PencilLine,
    Trash2,
    XCircle,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BtnSave } from '@/components/ui/btn-save';
import { QuizStatusBadge } from '@/components/ui/quiz-status-badge';
import { formatFormulaText } from '@/lib/formula-display';
import { formatTimeAgo, getLanguageLabel } from '@/lib/post-utils';
import { cn } from '@/lib/utils';
import type { BookmarkFolderItem, BreadcrumbItem, PostItem } from '@/types';

const PostAttachments = lazy(() => import('@/components/post-attachments').then((m) => ({ default: m.PostAttachments })));

type QuizFolderMode = 'completed' | 'correct' | 'wrong';

type QuizReviewItem = {
    id: number;
    post_id: number;
    post_title: string;
    question_index: number;
    question_text: string | null;
    subject_name: string | null;
    selected_answer: string | null;
    correct_answer: string | null;
    attempted_at: string;
    is_correct?: boolean;
};

type FolderButtonTone = 'default' | 'correct' | 'wrong';

type BookmarksPageProps = {
    posts?: PostItem[];
    folders?: BookmarkFolderItem[];
    activeFolderId?: number | null;
    studyMode?: string;
    completedCount?: number;
    correctCount?: number;
    wrongCount?: number;
    quizReviewItems?: QuizReviewItem[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My Study Folder', href: '/bookmarks' },
];

const pinkFolderButtonClass =
    'inline-flex items-center gap-2 rounded-md border-2 border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-all duration-200';

const pinkActionButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-70';

function getPostTypeBadgeProps(type: string) {
    if (type === 'quiz') return { bg: 'bg-amber-100', text: 'text-amber-700' };
    if (type === 'question') return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    return { bg: 'bg-violet-100', text: 'text-violet-700' };
}

function getSubjectBadgeProps() {
    return { bg: 'bg-rose-50', text: 'text-rose-700' };
}

function toBookmarksUrl(folderId?: number | null) {
    if (!folderId) return '/bookmarks';
    return `/bookmarks?folder_id=${folderId}`;
}

function toQuizFolderUrl(mode: QuizFolderMode) {
    return `/bookmarks?study=${mode}`;
}

function getFirstQuizQuestion(post: PostItem): { question: string | null; correctAnswer: string | null } {
    const raw = post.quiz_data as Record<string, unknown> | null | undefined;
    if (!raw) return { question: null, correctAnswer: null };

    if (Array.isArray(raw.questions) && raw.questions.length > 0) {
        const q = raw.questions[0] as Record<string, unknown>;
        const opts = Array.isArray(q.options) ? (q.options as string[]) : [];
        const ai = Number(q.answer_index);
        return {
            question: typeof q.question === 'string' ? q.question : null,
            correctAnswer: !Number.isNaN(ai) && opts[ai] ? opts[ai] : null,
        };
    }

    const opts = Array.isArray(raw.options) ? (raw.options as string[]) : [];
    const ai = Number(raw.answer_index);
    return {
        question: null,
        correctAnswer: !Number.isNaN(ai) && opts[ai] ? opts[ai] : null,
    };
}

export default function BookmarksPage() {
    const { trans } = reactLang();
    const { props } = usePage<BookmarksPageProps>();

    const folders = props.folders ?? [];
    const posts = props.posts ?? [];
    const studyMode = props.studyMode ?? '';
    const completedCount = props.completedCount ?? 0;
    const correctCount = props.correctCount ?? 0;
    const wrongCount = props.wrongCount ?? 0;
    const quizReviewItems = props.quizReviewItems ?? [];
    const activeFolderId = props.activeFolderId ?? (studyMode ? null : (folders.find((f) => f.is_default)?.id ?? folders[0]?.id));
    const activeFolder = folders.find((f) => f.id === activeFolderId);
    const activeQuizMode: QuizFolderMode = studyMode === 'correct' || studyMode === 'wrong' ? studyMode : 'completed';
    const isQuizFolder = studyMode === 'completed' || studyMode === 'correct' || studyMode === 'wrong';

    const [creatingFolder, setCreatingFolder] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [renamingFolderId, setRenamingFolderId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [savingPostIds, setSavingPostIds] = useState<number[]>([]);
    const [movingPostIds, setMovingPostIds] = useState<number[]>([]);

    const totalSaves = useMemo(() => folders.reduce((sum, folder) => sum + (folder.items_count ?? 0), 0), [folders]);
    const savedQuizzesCount = completedCount;

    const withCsrfHeaders = () => {
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        return {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
        };
    };

    const refreshCurrentFolder = (folderId = activeFolderId) => {
        router.get(toBookmarksUrl(folderId), {}, { preserveScroll: true, preserveState: false });
    };

    const navigateQuizFolder = (mode: QuizFolderMode) => {
        router.get(toQuizFolderUrl(mode), {}, { preserveScroll: true, preserveState: false });
    };

    const handleCreateFolder = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = folderName.trim();
        if (!name) return;
        setCreatingFolder(true);
        try {
            const response = await fetch('/bookmarks/folders', {
                method: 'POST',
                headers: withCsrfHeaders(),
                body: JSON.stringify({ name }),
            });
            if (!response.ok) throw new Error('Failed to create folder.');
            const payload = (await response.json()) as { folder?: BookmarkFolderItem };
            setFolderName('');
            refreshCurrentFolder(payload.folder?.id ?? activeFolderId);
        } finally {
            setCreatingFolder(false);
        }
    };

    const handleRenameFolder = async (folderId: number) => {
        const name = renameValue.trim();
        if (!name) return;
        setRenamingFolderId(folderId);
        try {
            const response = await fetch(`/bookmarks/folders/${folderId}`, {
                method: 'PATCH',
                headers: withCsrfHeaders(),
                body: JSON.stringify({ name }),
            });
            if (!response.ok) throw new Error('Failed to rename folder.');
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
        if (!response.ok) return;
        const payload = (await response.json()) as { folder_id?: number };
        refreshCurrentFolder(payload.folder_id ?? activeFolderId);
    };

    const handleToggleSave = async (postId: number) => {
        if (savingPostIds.includes(postId)) return;
        setSavingPostIds((prev) => [...prev, postId]);
        try {
            const response = await fetch(`/posts/${postId}/save`, {
                method: 'POST',
                headers: withCsrfHeaders(),
            });
            if (!response.ok) throw new Error('Failed to toggle save.');

            if (isQuizFolder) {
                navigateQuizFolder(activeQuizMode);
                return;
            }

            refreshCurrentFolder(activeFolderId);
        } finally {
            setSavingPostIds((prev) => prev.filter((id) => id !== postId));
        }
    };

    const handleMovePost = async (postId: number, folderId: number) => {
        if (!folderId || movingPostIds.includes(postId)) return;
        setMovingPostIds((prev) => [...prev, postId]);
        try {
            const response = await fetch(`/bookmarks/posts/${postId}/move`, {
                method: 'POST',
                headers: withCsrfHeaders(),
                body: JSON.stringify({ folder_id: folderId }),
            });
            if (!response.ok) throw new Error('Failed to move post.');
            refreshCurrentFolder(activeFolderId);
        } finally {
            setMovingPostIds((prev) => prev.filter((id) => id !== postId));
        }
    };

    return (
        <>
            <Head title={trans('navigation.bookmarks')} />

            <div className="w-full max-w-none p-4 pb-24 md:p-6 md:pb-24">
                <div className="mx-auto w-full max-w-6xl space-y-5">
                    <section className="overflow-hidden rounded-[30px] border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div className="max-w-2xl">
                                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                                    My Study Folder
                                </h1>
                                <p className="mt-2 text-sm leading-6 text-zinc-600">
                                    {trans('bookmark.description')}
                                </p>
                            </div>

                            <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl">
                                <StatCard
                                    icon={<Bookmark className="h-5 w-5" />}
                                    label="Saved Posts"
                                    value={totalSaves}
                                />
                                <StatCard
                                    icon={<BookOpen className="h-5 w-5" />}
                                    label="Saved Quizzes"
                                    value={savedQuizzesCount}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <FolderButton
                                active={!isQuizFolder}
                                icon={<Bookmark className="h-3.5 w-3.5" />}
                                label={trans('bookmark.study_folder_all')}
                                count={totalSaves}
                                onClick={() => refreshCurrentFolder(activeFolderId)}
                            />
                            <FolderButton
                                active={isQuizFolder}
                                icon={<BookOpen className="h-3.5 w-3.5" />}
                                label={trans('bookmark.quiz_folder')}
                                onClick={() => navigateQuizFolder(activeQuizMode)}
                            />
                        </div>

                        {isQuizFolder ? (
                            <div className="mt-4 flex flex-wrap gap-3 border-t border-zinc-200 pt-4">
                                <FolderButton
                                    active={activeQuizMode === 'completed'}
                                    icon={<BookOpen className="h-3.5 w-3.5" />}
                                    label={trans('bookmark.study_folder_completed')}
                                    count={completedCount}
                                    onClick={() => navigateQuizFolder('completed')}
                                />
                                <FolderButton
                                    active={activeQuizMode === 'correct'}
                                    icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                                    label={trans('bookmark.study_folder_correct')}
                                    count={correctCount}
                                    tone="correct"
                                    onClick={() => navigateQuizFolder('correct')}
                                />
                                <FolderButton
                                    active={activeQuizMode === 'wrong'}
                                    icon={<XCircle className="h-3.5 w-3.5" />}
                                    label={trans('bookmark.study_folder_wrong')}
                                    count={wrongCount}
                                    tone="wrong"
                                    onClick={() => navigateQuizFolder('wrong')}
                                />
                            </div>
                        ) : folders.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-3 border-t border-zinc-200 pt-4">
                                {folders.map((folder) => (
                                    <FolderButton
                                        key={folder.id}
                                        active={folder.id === activeFolderId}
                                        icon={<Folder className="h-3.5 w-3.5" />}
                                        label={folder.name}
                                        count={folder.items_count}
                                        onClick={() => refreshCurrentFolder(folder.id)}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </section>

                    {isQuizFolder ? (
                        <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-zinc-900">
                                        {activeQuizMode === 'completed'
                                            ? trans('bookmark.study_folder_completed')
                                            : activeQuizMode === 'correct'
                                                ? trans('bookmark.study_folder_correct')
                                                : trans('bookmark.study_folder_wrong')}
                                    </h2>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        {activeQuizMode === 'completed'
                                            ? trans('bookmark.quiz_completed_description')
                                            : activeQuizMode === 'correct'
                                                ? trans('bookmark.quiz_correct_description')
                                                : trans('bookmark.quiz_wrong_description')}
                                    </p>
                                </div>

                            </div>

                            <div className="mt-5">
                                {activeQuizMode === 'completed' ? (
                                    <StudyPostList
                                        posts={posts}
                                        studyMode={activeQuizMode}
                                        trans={trans}
                                        savingPostIds={savingPostIds}
                                        onToggleSave={handleToggleSave}
                                    />
                                ) : (
                                    <QuizReviewList
                                        items={quizReviewItems}
                                        mode={activeQuizMode}
                                        trans={trans}
                                    />
                                )}
                            </div>
                        </section>
                    ) : (
                        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                            <aside className="space-y-4">
                                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <FolderPlus className="h-5 w-5 text-zinc-600" />
                                        <h2 className="text-base font-semibold text-zinc-900">{trans('bookmark.create_folder')}</h2>
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-zinc-500">{trans('bookmark.create_folder_help')}</p>
                                    <form className="mt-4 space-y-3" onSubmit={handleCreateFolder}>
                                        <input
                                            type="text"
                                            value={folderName}
                                            onChange={(event) => setFolderName(event.target.value)}
                                            placeholder={trans('bookmark.folder_name_placeholder')}
                                            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                                        />
                                        <button
                                            type="submit"
                                            disabled={creatingFolder}
                                            className={cn('w-full', pinkActionButtonClass)}
                                        >
                                            <FolderPlus className="h-4 w-4" />
                                            {trans('bookmark.create_folder')}
                                        </button>
                                    </form>
                                </section>

                                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 className="text-base font-semibold text-zinc-900">{trans('bookmark.folders_title')}</h2>
                                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                                            {folders.length}
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {folders.length === 0 ? (
                                            <EmptyState message={trans('bookmark.no_folders')} compact />
                                        ) : (
                                            folders.map((folder) => {
                                                const isActive = folder.id === activeFolderId;

                                                return (
                                                    <div
                                                        key={folder.id}
                                                        className={cn(
                                                            'rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm transition-all',
                                                            isActive
                                                                ? 'border-zinc-400 bg-zinc-50'
                                                                : 'hover:border-zinc-300 hover:bg-zinc-50',
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <button
                                                                type="button"
                                                                className="min-w-0 flex-1 text-left"
                                                                onClick={() => refreshCurrentFolder(folder.id)}
                                                            >
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <p className="truncate text-sm font-semibold text-zinc-900">{folder.name}</p>
                                                                    {folder.is_default ? (
                                                                        <span className="rounded-md border-2 border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                                                                            {trans('bookmark.default_folder')}
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                                <p className="mt-1 text-xs text-zinc-500">
                                                                    {folder.items_count} {trans('bookmark.saved_items')}
                                                                </p>
                                                            </button>

                                                            {!folder.is_default ? (
                                                                <div className="flex shrink-0 items-center gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700"
                                                                        onClick={() => {
                                                                            setRenamingFolderId(folder.id);
                                                                            setRenameValue(folder.name);
                                                                        }}
                                                                    >
                                                                        <PencilLine className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700"
                                                                        onClick={() => {
                                                                            void handleDeleteFolder(folder.id);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            ) : null}
                                                        </div>

                                                        {renamingFolderId === folder.id ? (
                                                            <div className="mt-3 space-y-3">
                                                                <input
                                                                    type="text"
                                                                    value={renameValue}
                                                                    onChange={(event) => setRenameValue(event.target.value)}
                                                                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                                                                />
                                                                <div className="flex flex-wrap gap-2">
                                                                    <button
                                                                        type="button"
                                                                        className={pinkActionButtonClass}
                                                                        onClick={() => {
                                                                            void handleRenameFolder(folder.id);
                                                                        }}
                                                                    >
                                                                        {trans('bookmark.rename_folder')}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50"
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
                                                );
                                            })
                                        )}
                                    </div>
                                </section>
                            </aside>

                            <main className="space-y-4">
                                <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
                                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-4">
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-600">{trans('bookmark.study_folder_all')}</p>
                                            <h2 className="mt-1 text-xl font-semibold text-zinc-900">
                                                {activeFolder ? activeFolder.name : trans('bookmark.folders_title')}
                                            </h2>
                                            <p className="mt-1 text-sm text-zinc-500">{trans('bookmark.move_post_help')}</p>
                                        </div>
                                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-semibold text-zinc-700">
                                            {posts.length}
                                        </span>
                                    </div>

                                    <div className="mt-5">
                                        {posts.length === 0 ? (
                                            <EmptyState message={trans('bookmark.no_bookmarks')} />
                                        ) : (
                                            <div className="space-y-4">
                                                {posts.map((post) => (
                                                    <PostCard
                                                        key={post.id}
                                                        post={post}
                                                        folders={folders}
                                                        activeFolderId={activeFolderId}
                                                        movingPostIds={movingPostIds}
                                                        savingPostIds={savingPostIds}
                                                        onMove={handleMovePost}
                                                        onToggleSave={handleToggleSave}
                                                        trans={trans}
                                                        showFolderSelect
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </main>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function FolderButton({
    active,
    icon,
    label,
    count,
    tone = 'default',
    onClick,
}: {
    active: boolean;
    icon: React.ReactNode;
    label: string;
    count?: number;
    tone?: FolderButtonTone;
    onClick: () => void;
}) {
    const toneClass = tone === 'correct'
        ? (active
            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
            : 'border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50')
        : tone === 'wrong'
            ? (active
                ? 'border-rose-600 bg-rose-50 text-rose-800 shadow-sm'
                : 'border-rose-200 text-rose-700 hover:border-rose-400 hover:bg-rose-50')
            : (active
                ? 'border-zinc-700 bg-zinc-100 text-zinc-900 shadow-sm'
                : 'hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900');

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(pinkFolderButtonClass, toneClass)}
        >
            {icon}
            <span>{label}</span>
            {typeof count === 'number' ? (
                <span
                    className={cn(
                        'rounded px-1 py-0.5 text-[11px] font-semibold',
                        tone === 'correct'
                            ? (active ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-100 text-emerald-700')
                            : tone === 'wrong'
                                ? (active ? 'bg-rose-100 text-rose-800' : 'bg-rose-100 text-rose-700')
                                : (active ? 'bg-white/60 text-zinc-900' : 'bg-zinc-200 text-zinc-700'),
                    )}
                >
                    {count}
                </span>
            ) : null}
        </button>
    );
}

function StatCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
}) {
    return (
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-3">
                <div
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700"
                >
                    {icon}
                </div>
                <div>
                    <p className="text-lg font-semibold text-zinc-900">{value}</p>
                    <p className="text-xs text-zinc-500">{label}</p>
                </div>
            </div>
        </div>
    );
}

function StudyPostList({
    posts,
    studyMode,
    trans,
    savingPostIds,
    onToggleSave,
}: {
    posts: PostItem[];
    studyMode: QuizFolderMode;
    trans: (key: string) => string;
    savingPostIds: number[];
    onToggleSave: (id: number) => void;
}) {
    const emptyMessage = studyMode === 'completed'
        ? trans('bookmark.no_quiz_completed')
        : trans('bookmark.no_correct_answers');

    if (posts.length === 0) {
        return <EmptyState message={emptyMessage} />;
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    folders={[]}
                    activeFolderId={null}
                    movingPostIds={[]}
                    savingPostIds={savingPostIds}
                    onMove={() => Promise.resolve()}
                    onToggleSave={onToggleSave}
                    trans={trans}
                    showFolderSelect={false}
                    showQuizPreview
                />
            ))}
        </div>
    );
}

function QuizReviewList({
    items,
    mode,
    trans,
}: {
    items: QuizReviewItem[];
    mode: Extract<QuizFolderMode, 'correct' | 'wrong'>;
    trans: (key: string) => string;
}) {
    if (items.length === 0) {
        return (
            <EmptyState
                message={mode === 'correct' ? trans('bookmark.no_correct_answers') : trans('bookmark.no_wrong_answers')}
            />
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
                <article
                    key={item.id}
                    className={cn(
                        'rounded-[26px] bg-white p-5 shadow-sm',
                        mode === 'wrong' ? 'border-2 border-zinc-400' : 'border border-zinc-200',
                    )}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            <span
                                className={cn(
                                    'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                    mode === 'wrong'
                                        ? 'bg-rose-50 text-rose-700'
                                        : 'bg-emerald-50 text-emerald-700',
                                )}
                            >
                                {mode === 'wrong'
                                    ? trans('bookmark.study_folder_wrong')
                                    : trans('bookmark.study_folder_correct')}
                            </span>
                            <h3 className="text-base font-semibold leading-6 text-zinc-900">
                                {item.question_text || item.post_title}
                            </h3>
                        </div>

                        <span className="shrink-0 text-xs font-medium text-zinc-500">
                            {formatTimeAgo(item.attempted_at)}
                        </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        {item.subject_name ? (
                            <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
                                {item.subject_name}
                            </span>
                        ) : null}
                        <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-600">
                            Q{item.question_index + 1}
                        </span>
                    </div>

                    {item.selected_answer ? (
                        <div className="mt-4 rounded-2xl bg-[#fff7fa] p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                                {trans('bookmark.your_answer_label')}
                            </p>
                            <p className={cn('mt-1 text-sm', mode === 'wrong' ? 'text-rose-700' : 'text-emerald-700')}>
                                {item.selected_answer}
                            </p>
                        </div>
                    ) : null}

                    {item.correct_answer ? (
                        <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                                {trans('bookmark.correct_answer_label')}
                            </p>
                            <p className="mt-1 text-sm text-zinc-700">{item.correct_answer}</p>
                        </div>
                    ) : null}

                    <div className="mt-4 flex justify-end">
                        <Link
                            href={`/posts/${item.post_id}`}
                            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
                        >
                            <ExternalLink className="h-4 w-4" />
                            {trans('bookmark.view_post')}
                        </Link>
                    </div>
                </article>
            ))}
        </div>
    );
}

function PostCard({
    post,
    folders,
    activeFolderId,
    movingPostIds,
    savingPostIds,
    onMove,
    onToggleSave,
    trans,
    showFolderSelect,
    showQuizPreview = false,
}: {
    post: PostItem;
    folders: BookmarkFolderItem[];
    activeFolderId: number | null | undefined;
    movingPostIds: number[];
    savingPostIds: number[];
    onMove: (postId: number, folderId: number) => Promise<void>;
    onToggleSave: (postId: number) => void;
    trans: (key: string) => string;
    showFolderSelect: boolean;
    showQuizPreview?: boolean;
}) {
    const type = post.post_type === 'quiz' ? 'quiz' : post.post_type === 'question' ? 'question' : 'material';
    const { bg, text } = getPostTypeBadgeProps(type);
    const typeLabel =
        type === 'quiz'
            ? trans('createPost.create_quiz')
            : type === 'question'
                ? trans('createPost.ask_question')
                : trans('createPost.share_material');

    const quizStatus = post.is_quiz_completed === true ? 'correct' : post.is_quiz_completed === false && post.post_type === 'quiz' ? 'incorrect' : 'unanswered';

    const { question, correctAnswer } = post.post_type === 'quiz' && showQuizPreview
        ? getFirstQuizQuestion(post)
        : { question: null, correctAnswer: null };

    return (
        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-sm text-zinc-500">
                    <Link
                        href={post.user?.id ? `/profilePage/${post.user.id}` : '/profilePage'}
                        className="truncate font-semibold text-zinc-800 transition hover:text-zinc-950"
                    >
                        {post.user?.name ?? trans('bookmark.unknown_user')}
                    </Link>
                    <span>•</span>
                    <span className="shrink-0">{formatTimeAgo(post.created_at)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {showFolderSelect && folders.length > 0 ? (
                        <select
                            value={post.bookmark_folder_id ?? activeFolderId ?? ''}
                            disabled={movingPostIds.includes(post.id)}
                            onChange={(event) => {
                                void onMove(post.id, Number(event.target.value));
                            }}
                            className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {folders.map((folder) => (
                                <option key={folder.id} value={folder.id}>
                                    {folder.name}
                                </option>
                            ))}
                        </select>
                    ) : null}

                    <BtnSave
                        count={post.saves_count ?? 0}
                        saved={Boolean(post.is_saved)}
                        loading={savingPostIds.includes(post.id)}
                        onClick={() => {
                            onToggleSave(post.id);
                        }}
                    />
                </div>
            </div>

            <Link href={`/posts/${post.id}`} className="group block">
                <h2 className="text-lg font-bold text-zinc-900 transition group-hover:text-zinc-950">
                    {post.title}
                </h2>
                <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                    {formatFormulaText(post.content ?? '')}
                </p>
            </Link>

            {showQuizPreview && post.post_type === 'quiz' && (question || correctAnswer) ? (
                <div className="mt-4 rounded-[22px] border border-[#f4d6b3] bg-[#fff8ef] p-4">
                    {question ? (
                        <p className="text-sm font-semibold text-amber-800">{question}</p>
                    ) : null}
                    {correctAnswer ? (
                        <p className="mt-2 text-sm text-zinc-600">
                            <span className="font-semibold text-zinc-800">{trans('bookmark.correct_answer_label')}:</span>{' '}
                            {correctAnswer}
                        </p>
                    ) : null}
                </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${text}`}>{typeLabel}</span>

                {post.language?.code ? (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                        {getLanguageLabel(post.language.code)}
                    </span>
                ) : null}

                {post.subject?.name ? (() => {
                    const { bg: subjectBg, text: subjectText } = getSubjectBadgeProps();
                    return (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${subjectBg} ${subjectText}`}>
                            {post.subject.name}
                        </span>
                    );
                })() : null}

                {post.post_type === 'quiz' && showQuizPreview ? <QuizStatusBadge status={quizStatus} /> : null}

                <Link
                    href={`/posts/${post.id}`}
                    className="ml-auto inline-flex items-center gap-1 rounded-2xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800"
                >
                    <ExternalLink className="h-3 w-3" />
                    {trans('bookmark.view_post')}
                </Link>
            </div>

            {post.image && post.image.length > 0 ? (
                <div className="mt-4">
                    <Suspense fallback={null}>
                        <PostAttachments files={post.image} compact />
                    </Suspense>
                </div>
            ) : null}
        </article>
    );
}

function EmptyState({
    message,
    compact = false,
}: {
    message: string;
    compact?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-[28px] border border-dashed border-[#f0c8d5] bg-[#fff8fb] px-6 text-center',
                compact ? 'py-10' : 'py-16',
            )}
        >
            <Bookmark className="mb-3 h-10 w-10 text-[#e9a8bd]" />
            <p className="max-w-md text-sm leading-6 text-zinc-500">{message}</p>
        </div>
    );
}

BookmarksPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

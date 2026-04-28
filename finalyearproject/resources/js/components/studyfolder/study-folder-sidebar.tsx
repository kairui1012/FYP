import {
    Bookmark,
    BookOpen,
    CheckCircle2,
    FolderPlus,
    PencilLine,
    Trash2,
    XCircle,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { cn } from '@/lib/utils';
import type { BookmarkFolderItem } from '@/types';
import { EmptyState } from './empty-state';
import { SidebarFolderItem } from './sidebar-folder-item';
import { pinkActionButtonClass } from './study-folder-utils';
import type { QuizFolderMode, TransFn } from './types';

type StudyFolderSidebarProps = {
    folders: BookmarkFolderItem[];
    activeFolderId: number | null | undefined;
    isQuizFolder: boolean;
    activeQuizMode: QuizFolderMode;
    totalSaves: number;
    completedCount: number;
    correctCount: number;
    wrongCount: number;
    creatingFolder: boolean;
    showCreateFolderForm: boolean;
    folderName: string;
    renamingFolderId: number | null;
    renameValue: string;
    trans: TransFn;
    onNavigateFolder: (folderId?: number | null) => void;
    onNavigateQuizFolder: (mode: QuizFolderMode) => void;
    onToggleCreateFolderForm: () => void;
    onFolderNameChange: (value: string) => void;
    onSubmitCreateFolder: (event: FormEvent<HTMLFormElement>) => void;
    onCancelCreateFolder: () => void;
    onStartRenameFolder: (folder: BookmarkFolderItem) => void;
    onRenameValueChange: (value: string) => void;
    onConfirmRenameFolder: (folderId: number) => void;
    onCancelRenameFolder: () => void;
    onDeleteFolder: (folderId: number) => void;
};

export function StudyFolderSidebar({
    folders,
    activeFolderId,
    isQuizFolder,
    activeQuizMode,
    totalSaves,
    completedCount,
    correctCount,
    wrongCount,
    creatingFolder,
    showCreateFolderForm,
    folderName,
    renamingFolderId,
    renameValue,
    trans,
    onNavigateFolder,
    onNavigateQuizFolder,
    onToggleCreateFolderForm,
    onFolderNameChange,
    onSubmitCreateFolder,
    onCancelCreateFolder,
    onStartRenameFolder,
    onRenameValueChange,
    onConfirmRenameFolder,
    onCancelRenameFolder,
    onDeleteFolder,
}: StudyFolderSidebarProps) {
    return (
        <aside className="space-y-5">
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                    {trans('bookmark.folders_title')}
                </p>
                <div className="mt-3 space-y-1">
                    <SidebarFolderItem
                        active={!isQuizFolder}
                        icon={<Bookmark className="h-3.5 w-3.5" />}
                        label={trans('bookmark.study_folder_all')}
                        count={totalSaves}
                        onClick={() => onNavigateFolder(activeFolderId)}
                    />
                    <SidebarFolderItem
                        active={isQuizFolder}
                        icon={<BookOpen className="h-3.5 w-3.5" />}
                        label={trans('bookmark.quiz_folder')}
                        tone="quiz"
                        onClick={() => onNavigateQuizFolder(activeQuizMode)}
                    />
                    {isQuizFolder ? (
                        <div className="mt-1 ml-5 space-y-1 border-l border-zinc-200 pl-3">
                            <SidebarFolderItem
                                active={activeQuizMode === 'completed'}
                                icon={<BookOpen className="h-3.5 w-3.5" />}
                                label={trans('bookmark.study_folder_completed')}
                                count={completedCount}
                                compact
                                onClick={() =>
                                    onNavigateQuizFolder('completed')
                                }
                            />
                            <SidebarFolderItem
                                active={activeQuizMode === 'correct'}
                                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                                label={trans('bookmark.study_folder_correct')}
                                count={correctCount}
                                tone="correct"
                                compact
                                onClick={() => onNavigateQuizFolder('correct')}
                            />
                            <SidebarFolderItem
                                active={activeQuizMode === 'wrong'}
                                icon={<XCircle className="h-3.5 w-3.5" />}
                                label={trans('bookmark.study_folder_wrong')}
                                count={wrongCount}
                                tone="wrong"
                                compact
                                onClick={() => onNavigateQuizFolder('wrong')}
                            />
                        </div>
                    ) : null}
                </div>
            </section>

            {!isQuizFolder ? (
                <FolderManagementPanel
                    folders={folders}
                    activeFolderId={activeFolderId}
                    creatingFolder={creatingFolder}
                    showCreateFolderForm={showCreateFolderForm}
                    folderName={folderName}
                    renamingFolderId={renamingFolderId}
                    renameValue={renameValue}
                    trans={trans}
                    onNavigateFolder={onNavigateFolder}
                    onToggleCreateFolderForm={onToggleCreateFolderForm}
                    onFolderNameChange={onFolderNameChange}
                    onSubmitCreateFolder={onSubmitCreateFolder}
                    onCancelCreateFolder={onCancelCreateFolder}
                    onStartRenameFolder={onStartRenameFolder}
                    onRenameValueChange={onRenameValueChange}
                    onConfirmRenameFolder={onConfirmRenameFolder}
                    onCancelRenameFolder={onCancelRenameFolder}
                    onDeleteFolder={onDeleteFolder}
                />
            ) : null}
        </aside>
    );
}

type FolderManagementPanelProps = Omit<
    StudyFolderSidebarProps,
    | 'isQuizFolder'
    | 'activeQuizMode'
    | 'totalSaves'
    | 'completedCount'
    | 'correctCount'
    | 'wrongCount'
    | 'onNavigateQuizFolder'
>;

function FolderManagementPanel({
    folders,
    activeFolderId,
    creatingFolder,
    showCreateFolderForm,
    folderName,
    renamingFolderId,
    renameValue,
    trans,
    onNavigateFolder,
    onToggleCreateFolderForm,
    onFolderNameChange,
    onSubmitCreateFolder,
    onCancelCreateFolder,
    onStartRenameFolder,
    onRenameValueChange,
    onConfirmRenameFolder,
    onCancelRenameFolder,
    onDeleteFolder,
}: FolderManagementPanelProps) {
    return (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-zinc-900">
                    {trans('bookmark.folders_title')}
                </h2>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                    {folders.length}
                </span>
            </div>

            <div className="mt-4 space-y-3">
                <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
                    onClick={onToggleCreateFolderForm}
                >
                    <FolderPlus className="h-4 w-4" />
                    {trans('bookmark.create_folder')}
                </button>

                {showCreateFolderForm ? (
                    <form className="space-y-2" onSubmit={onSubmitCreateFolder}>
                        <input
                            type="text"
                            value={folderName}
                            onChange={(event) =>
                                onFolderNameChange(event.target.value)
                            }
                            placeholder={trans(
                                'bookmark.folder_name_placeholder',
                            )}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={creatingFolder}
                                className={cn('flex-1', pinkActionButtonClass)}
                            >
                                {trans('bookmark.create_folder')}
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50"
                                onClick={onCancelCreateFolder}
                            >
                                {trans('bookmark.cancel')}
                            </button>
                        </div>
                    </form>
                ) : null}

                {folders.length === 0 ? (
                    <EmptyState
                        icon={<FolderPlus />}
                        title={trans('bookmark.create_folder')}
                        subtitle={trans('bookmark.no_folders')}
                        compact
                    />
                ) : (
                    folders.map((folder) => (
                        <FolderRow
                            key={folder.id}
                            folder={folder}
                            active={folder.id === activeFolderId}
                            trans={trans}
                            onNavigateFolder={onNavigateFolder}
                            onStartRenameFolder={onStartRenameFolder}
                            onDeleteFolder={onDeleteFolder}
                        />
                    ))
                )}

                {renamingFolderId !== null ? (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(event) =>
                                onRenameValueChange(event.target.value)
                            }
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                            <button
                                type="button"
                                className={pinkActionButtonClass}
                                onClick={() =>
                                    onConfirmRenameFolder(renamingFolderId)
                                }
                            >
                                {trans('bookmark.rename_folder')}
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50"
                                onClick={onCancelRenameFolder}
                            >
                                {trans('bookmark.cancel')}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </section>
    );
}

type FolderRowProps = {
    folder: BookmarkFolderItem;
    active: boolean;
    trans: TransFn;
    onNavigateFolder: (folderId?: number | null) => void;
    onStartRenameFolder: (folder: BookmarkFolderItem) => void;
    onDeleteFolder: (folderId: number) => void;
};

function FolderRow({
    folder,
    active,
    trans,
    onNavigateFolder,
    onStartRenameFolder,
    onDeleteFolder,
}: FolderRowProps) {
    return (
        <div
            className={cn(
                'flex w-full items-start justify-between rounded-lg px-2.5 py-2 transition',
                active
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-700 hover:bg-zinc-50',
            )}
        >
            <button
                type="button"
                onClick={() => onNavigateFolder(folder.id)}
                className="min-w-0 flex-1 text-left"
            >
                <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">
                        {folder.name}
                    </p>
                    {folder.is_default ? (
                        <span className="rounded-md border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700">
                            {trans('bookmark.default_folder')}
                        </span>
                    ) : null}
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                    {folder.items_count} {trans('bookmark.saved_items')}
                </p>
            </button>

            {!folder.is_default ? (
                <div className="ml-2 flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700"
                        onClick={() => onStartRenameFolder(folder)}
                    >
                        <PencilLine className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700"
                        onClick={() => onDeleteFolder(folder.id)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : null}
        </div>
    );
}

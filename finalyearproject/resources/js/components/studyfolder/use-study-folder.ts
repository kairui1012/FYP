import { router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { BookmarkFolderItem } from '@/types';
import { toStudyFolderUrl, toQuizFolderUrl, withCsrfHeaders } from './study-folder-utils';
import type { QuizFolderMode, StudyFolderPageProps } from './types';

export function useStudyFolder() {
    const { props } = usePage<StudyFolderPageProps>();

    const folders = useMemo(() => props.folders ?? [], [props.folders]);
    const posts = props.posts ?? [];
    const studyMode = props.studyMode ?? '';
    const completedCount = props.completedCount ?? 0;
    const correctCount = props.correctCount ?? 0;
    const wrongCount = props.wrongCount ?? 0;
    const quizReviewItems = props.quizReviewItems ?? [];
    const activeFolderId =
        props.activeFolderId ??
        (studyMode
            ? null
            : (folders.find((f) => f.is_default)?.id ?? folders[0]?.id));
    const activeFolder = folders.find((f) => f.id === activeFolderId);
    const activeQuizMode: QuizFolderMode =
        studyMode === 'correct' || studyMode === 'wrong' ? studyMode : 'completed';
    const isQuizFolder =
        studyMode === 'completed' || studyMode === 'correct' || studyMode === 'wrong';

    const totalSaves = useMemo(
        () => folders.reduce((sum, folder) => sum + (folder.items_count ?? 0), 0),
        [folders],
    );
    const savedQuizzesCount = completedCount;

    const [creatingFolder, setCreatingFolder] = useState(false);
    const [showCreateFolderForm, setShowCreateFolderForm] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [renamingFolderId, setRenamingFolderId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [savingPostIds, setSavingPostIds] = useState<number[]>([]);
    const [movingPostIds, setMovingPostIds] = useState<number[]>([]);

    const refreshCurrentFolder = (folderId = activeFolderId) => {
        router.get(toStudyFolderUrl(folderId), {}, { preserveScroll: true, preserveState: false });
    };

    const navigateQuizFolder = (mode: QuizFolderMode) => {
        router.get(toQuizFolderUrl(mode), {}, { preserveScroll: true, preserveState: false });
    };

    const cancelCreateFolder = () => {
        setShowCreateFolderForm(false);
        setFolderName('');
    };

    const startRenameFolder = (folder: BookmarkFolderItem) => {
        setRenamingFolderId(folder.id);
        setRenameValue(folder.name);
    };

    const cancelRenameFolder = () => {
        setRenamingFolderId(null);
        setRenameValue('');
    };

    const handleCreateFolder = async (event: FormEvent<HTMLFormElement>) => {
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
            setShowCreateFolderForm(false);
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

    return {
        // derived from server props
        folders,
        posts,
        completedCount,
        correctCount,
        wrongCount,
        quizReviewItems,
        activeFolderId,
        activeFolder,
        activeQuizMode,
        isQuizFolder,
        totalSaves,
        savedQuizzesCount,
        // local state
        creatingFolder,
        showCreateFolderForm,
        folderName,
        renamingFolderId,
        renameValue,
        savingPostIds,
        movingPostIds,
        // state setters
        setShowCreateFolderForm,
        setFolderName,
        setRenameValue,
        // handlers
        refreshCurrentFolder,
        navigateQuizFolder,
        cancelCreateFolder,
        startRenameFolder,
        cancelRenameFolder,
        handleCreateFolder,
        handleRenameFolder,
        handleDeleteFolder,
        handleToggleSave,
        handleMovePost,
    };
}

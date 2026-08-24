import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type {
    QuizFolderMode,
    StudyFolderPageProps,
} from './study-folder-types';
import {
    toQuizFolderUrl,
    toStudyFolderUrl,
    withCsrfHeaders,
} from './study-folder-utils';

export function useStudyFolder() {
    const { props } = usePage<StudyFolderPageProps>();
    const posts = props.posts ?? [];
    const studyMode = props.studyMode ?? '';
    const correctCount = props.correctCount ?? 0;
    const wrongCount = props.wrongCount ?? 0;
    const quizReviewItems = props.quizReviewItems ?? [];
    const pagination = props.pagination;
    const activeQuizMode: QuizFolderMode =
        studyMode === 'wrong' ? 'wrong' : 'correct';
    const isQuizFolder = studyMode === 'correct' || studyMode === 'wrong';
    const totalSaves = props.totalSaves ?? posts.length;
    const savedQuizzesCount = props.completedCount ?? 0;
    const [savingPostIds, setSavingPostIds] = useState<number[]>([]);

    const refreshSavedPosts = () => {
        router.get(
            toStudyFolderUrl(),
            {},
            { preserveScroll: true, preserveState: false },
        );
    };

    const navigateQuizFolder = (mode: QuizFolderMode) => {
        router.get(
            toQuizFolderUrl(mode),
            {},
            { preserveScroll: true, preserveState: false },
        );
    };

    const handleToggleSave = async (postId: number) => {
        if (savingPostIds.includes(postId)) return;

        setSavingPostIds((prev) => [...prev, postId]);
        try {
            const response = await fetch(`/posts/${postId}/bookmark`, {
                method: 'POST',
                headers: withCsrfHeaders(),
            });
            if (!response.ok) throw new Error('Failed to toggle save.');

            if (isQuizFolder) {
                navigateQuizFolder(activeQuizMode);
                return;
            }
            refreshSavedPosts();
        } finally {
            setSavingPostIds((prev) => prev.filter((id) => id !== postId));
        }
    };

    return {
        posts,
        correctCount,
        wrongCount,
        quizReviewItems,
        pagination,
        activeQuizMode,
        isQuizFolder,
        totalSaves,
        savedQuizzesCount,
        savingPostIds,
        refreshSavedPosts,
        navigateQuizFolder,
        handleToggleSave,
    };
}

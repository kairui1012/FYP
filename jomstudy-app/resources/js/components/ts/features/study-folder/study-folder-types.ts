import type { PaginationMeta, PostItem } from '@/types';

export type QuizFolderMode = 'correct' | 'wrong';

export type QuizReviewItem = {
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

export type FolderButtonTone = 'default' | 'quiz' | 'correct' | 'wrong';

export type StudyFolderPageProps = {
    posts?: PostItem[];
    studyMode?: string;
    totalSaves?: number;
    completedCount?: number;
    correctCount?: number;
    wrongCount?: number;
    quizReviewItems?: QuizReviewItem[];
    pagination?: PaginationMeta;
};

export type TransFn = (key: string) => string;

import type { PostItem } from '@/types';

export type PostContentProps = {
    post: PostItem;
};

export type PostContentTransFn = (key: string, page: unknown) => string;

export type QuizQuestion = {
    question: string | null;
    options: string[];
    answerIndex: number;
    creatorAnswer: string;
    explanation?: string | null;
};

export type QuizData = {
    questions: QuizQuestion[];
};

export type QuizResultState = 'correct' | 'wrong' | null;

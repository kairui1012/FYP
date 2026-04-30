import type { PostItem } from '@/types';
import type { QuizFolderMode } from './types';

export function withCsrfHeaders() {
    const csrfToken =
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? '';

    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
    };
}

export const pinkFolderButtonClass =
    'inline-flex items-center gap-2 rounded-md border-2 border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-all duration-200';

export const pinkActionButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-70';

export function getPostTypeBadgeProps(type: string) {
    if (type === 'quiz') return { bg: 'bg-amber-100', text: 'text-amber-700' };
    if (type === 'question')
        return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    return { bg: 'bg-violet-100', text: 'text-violet-700' };
}

export function getSubjectBadgeProps() {
    return { bg: 'bg-rose-50', text: 'text-rose-700' };
}

export function toStudyFolderUrl(folderId?: number | null) {
    if (!folderId) return '/bookmarks';
    return `/bookmarks?folder_id=${folderId}`;
}

export function toQuizFolderUrl(mode: QuizFolderMode) {
    return `/bookmarks?study=${mode}`;
}

export function getFirstQuizQuestion(post: PostItem): {
    question: string | null;
    correctAnswer: string | null;
} {
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

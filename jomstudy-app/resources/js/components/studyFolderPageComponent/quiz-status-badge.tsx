import { reactLang } from '@erag/lang-sync-inertia';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import type { ReactElement } from 'react';
import { cn } from '@/lib/common-helpers';

export type QuizStatus = 'unanswered' | 'correct' | 'incorrect';

export function QuizStatusBadge({ status }: { status: QuizStatus }) {
    const { trans } = reactLang();

    const configs: Record<QuizStatus, { icon: ReactElement; label: string; className: string }> = {
        unanswered: {
            icon: <Circle className="h-3 w-3" />,
            label: trans('createPost.quiz_status_unanswered'),
            className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
        },
        correct: {
            icon: <CheckCircle2 className="h-3 w-3" />,
            label: trans('createPost.quiz_status_correct'),
            className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        },
        incorrect: {
            icon: <XCircle className="h-3 w-3" />,
            label: trans('createPost.quiz_status_incorrect'),
            className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        },
    };

    const { icon, label, className } = configs[status];

    return (
        <span
            className={cn(
                'inline-flex animate-in fade-in zoom-in-95 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold duration-200',
                className,
            )}
        >
            {icon}
            {label}
        </span>
    );
}

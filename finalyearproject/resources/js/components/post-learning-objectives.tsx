import { BookOpen, Clock, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import {
    requestLearningObjectives,
    type LearningObjectives,
} from '@/lib/ai-learning-objectives';
import { cn } from '@/lib/utils';
import { trans } from './post-content/post-content-config';

type Props = {
    page: unknown;
    postTitle: string;
    postContent?: string;
    postType?: string;
    className?: string;
};

const difficultyStyles = {
    beginner: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    intermediate: 'border-amber-300 bg-amber-50 text-amber-700',
    advanced: 'border-rose-300 bg-rose-50 text-rose-700',
} as const;

export function PostLearningObjectives({
    page,
    postTitle,
    postContent,
    postType,
    className,
}: Props) {
    const [result, setResult] = useState<LearningObjectives | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inFlightRef = useRef(false);

    const generate = async () => {
        if (loading || inFlightRef.current) return;

        inFlightRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const data = await requestLearningObjectives({
                postTitle,
                postContent,
                postType,
            });
            setResult(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : trans('home.lo_error', page),
            );
        } finally {
            inFlightRef.current = false;
            setLoading(false);
        }
    };

    const difficultyLabel = result
        ? trans(`home.lo_${result.difficulty}`, page)
        : '';

    return (
        <div className={cn('mx-4 mb-5', result ? 'w-full' : '', className)}>
            {!result && !loading ? (
                <button
                    type="button"
                    onClick={() => void generate()}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-violet-300 bg-white px-4 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    {trans('home.lo_button', page)}
                </button>
            ) : null}

            {loading ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {trans('home.lo_loading', page)}
                </div>
            ) : null}

            {error && !loading ? (
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-rose-600">{error}</p>
                    <button
                        type="button"
                        onClick={() => void generate()}
                        className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                        <RotateCcw className="h-3 w-3" />
                        {trans('home.lo_retry', page)}
                    </button>
                </div>
            ) : null}

            {result && !loading ? (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-violet-600" />
                            <span className="text-sm font-bold text-violet-800">
                                {trans('home.lo_title', page)}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={cn(
                                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                                    difficultyStyles[result.difficulty],
                                )}
                            >
                                {trans('home.lo_difficulty', page)}:{' '}
                                {difficultyLabel}
                            </span>
                            {result.estimated_time ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-zinc-600">
                                    <Clock className="h-3 w-3" />
                                    {result.estimated_time}
                                </span>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => void generate()}
                                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-50"
                            >
                                <RotateCcw className="h-3 w-3" />
                                {trans('home.lo_retry', page)}
                            </button>
                        </div>
                    </div>

                    <ul className="space-y-2">
                        {result.objectives.map((obj, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2.5 text-sm text-zinc-700"
                            >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                                <span className="leading-6">{obj}</span>
                            </li>
                        ))}
                    </ul>

                    <p className="mt-3 text-xs text-zinc-400 italic">
                        {trans('home.lo_disclaimer', page)}
                    </p>
                </div>
            ) : null}
        </div>
    );
}

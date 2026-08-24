import {
    ChevronDown,
    ChevronUp,
    Loader2,
    RotateCcw,
    Sparkles,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { explainBestAnswer } from '@/lib/best-answer-ai-service';
import type { BestAnswerExplanation } from '@/lib/best-answer-ai-service';
import { cn } from '@/lib/common-helpers';

type TransFn = (
    page: { props?: { lang?: Record<string, unknown> } },
    key: string,
) => string;

type Props = {
    page: { props?: { lang?: Record<string, unknown> } };
    trans: TransFn;
    postTitle: string;
    postContent?: string;
    answerContent: string;
};

export function BestAnswerAiPanel({
    page,
    trans,
    postTitle,
    postContent,
    answerContent,
}: Props) {
    const [result, setResult] = useState<BestAnswerExplanation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(true);
    const mountedRef = useRef(true);
    const inFlightRef = useRef(false);

    const t = {
        label: trans(page, 'comment.ai_explain_label'),
        button: trans(page, 'comment.ai_explain_button'),
        loading: trans(page, 'comment.ai_explain_loading'),
        error: trans(page, 'comment.ai_explain_error'),
        regenerate: trans(page, 'comment.ai_explain_regenerate'),
        collapse: trans(page, 'comment.ai_explain_collapse'),
        expand: trans(page, 'comment.ai_explain_expand'),
        disclaimer: trans(page, 'comment.ai_explain_disclaimer'),
    };

    const generate = async () => {
        if (loading || inFlightRef.current) return;

        inFlightRef.current = true;
        setLoading(true);
        setError(null);
        setExpanded(true);

        try {
            const data = await explainBestAnswer({
                postTitle,
                postContent,
                answerContent,
            });
            if (!mountedRef.current) return;
            setResult(data);
        } catch (err) {
            if (!mountedRef.current) return;
            setError(err instanceof Error ? err.message : t.error);
        } finally {
            inFlightRef.current = false;
            if (mountedRef.current) setLoading(false);
        }
    };

    return (
        <div className="mt-4 border-t border-emerald-200/60 pt-4">
            <div className="flex flex-wrap items-center gap-2">
                {result === null && !loading && error === null ? (
                    <button
                        type="button"
                        onClick={() => void generate()}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-full border-2 border-emerald-400 bg-linear-to-r from-emerald-400 to-teal-500 px-4 py-1.5 text-xs font-semibold text-white',
                            'transition-all duration-200 hover:border-emerald-500 hover:from-emerald-500 hover:to-teal-600',
                        )}
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        {t.button}
                    </button>
                ) : null}

                {loading ? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {t.loading}
                    </div>
                ) : null}

                {result !== null && !loading ? (
                    <>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <Sparkles className="h-3 w-3" />
                            {t.label}
                        </div>
                        <button
                            type="button"
                            onClick={() => setExpanded((v) => !v)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                        >
                            {expanded ? (
                                <>
                                    <ChevronUp className="h-3 w-3" />
                                    {t.collapse}
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-3 w-3" />
                                    {t.expand}
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => void generate()}
                            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700"
                        >
                            <RotateCcw className="h-3 w-3" />
                            {t.regenerate}
                        </button>
                    </>
                ) : null}

                {error !== null && !loading ? (
                    <>
                        <p className="text-xs text-rose-600">{error}</p>
                        <button
                            type="button"
                            onClick={() => void generate()}
                            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                            <RotateCcw className="h-3 w-3" />
                            {t.regenerate}
                        </button>
                    </>
                ) : null}
            </div>

            {result !== null && expanded && !loading ? (
                <div className="mt-3 animate-in space-y-3 duration-200 fade-in slide-in-from-top-2">
                    <div className="rounded-xl border border-emerald-200 bg-white/80 p-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-700">
                            {result.explanation}
                        </p>
                    </div>

                    {result.key_points.length > 0 ? (
                        <div className="rounded-xl border border-emerald-200 bg-white/80 p-4">
                            <p className="mb-2 text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                                Key Points
                            </p>
                            <ul className="space-y-1.5">
                                {result.key_points.map((point, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-sm leading-relaxed text-zinc-700"
                                    >
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {result.summary ? (
                        <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3">
                            <p className="mb-1 text-xs font-semibold tracking-wide text-teal-700 uppercase">
                                Summary
                            </p>
                            <p className="text-sm leading-relaxed text-zinc-700">
                                {result.summary}
                            </p>
                        </div>
                    ) : null}

                    <p className="text-xs text-zinc-400 italic">
                        {t.disclaimer}
                    </p>
                </div>
            ) : null}
        </div>
    );
}

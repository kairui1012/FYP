import { CheckCircle2, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    clarifyDoubt,
    type DoubtClarification,
} from '@/lib/ai-comment-feedback';
import { cn } from '@/lib/utils';

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
    onConfusionSubmitted: () => void;
    onResolved: () => void;
    onStillUnresolved: () => void;
    onCancel: () => void;
};

export function CommentAiDoubtPanel({
    page,
    trans,
    postTitle,
    postContent,
    answerContent,
    onConfusionSubmitted,
    onResolved,
    onStillUnresolved,
    onCancel,
}: Props) {
    const [confusion, setConfusion] = useState('');
    const [result, setResult] = useState<DoubtClarification | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);
    const inFlightRef = useRef(false);

    const t = {
        label: trans(page, 'comment.ai_doubt_label'),
        placeholder: trans(page, 'comment.ai_doubt_placeholder'),
        submit: trans(page, 'comment.ai_doubt_submit'),
        submitting: trans(page, 'comment.ai_doubt_submitting'),
        cancel: trans(page, 'comment.ai_doubt_cancel'),
        minLength: trans(page, 'comment.ai_doubt_min_length'),
        loading: trans(page, 'comment.ai_doubt_loading'),
        error: trans(page, 'comment.ai_doubt_error'),
        retry: trans(page, 'comment.ai_doubt_retry'),
        explanationTitle: trans(page, 'comment.ai_doubt_explanation_title'),
        guidanceTitle: trans(page, 'comment.ai_doubt_guidance_title'),
        disclaimer: trans(page, 'comment.ai_doubt_disclaimer'),
        resolvedQuestion: trans(page, 'comment.ai_doubt_resolved_question'),
        resolved: trans(page, 'comment.ai_doubt_resolved'),
        stillUnresolved: trans(page, 'comment.ai_doubt_still_unresolved'),
    };

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const generate = async () => {
        const trimmed = confusion.trim();
        if (trimmed.length < 1) return;
        if (loading || inFlightRef.current) return;

        inFlightRef.current = true;
        setLoading(true);
        setError(null);

        try {
            onConfusionSubmitted();
            const data = await clarifyDoubt({
                postTitle,
                postContent,
                answerContent,
                userConfusion: trimmed,
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

    const isTooShort = confusion.trim().length < 1;

    return (
        <div className="mx-1 mb-3 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/60">
            <div className="flex items-center gap-2 border-b border-amber-200/70 bg-amber-100/60 px-3 py-2">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span className="text-xs font-semibold text-amber-800">
                    {t.label}
                </span>
            </div>

            <div className="space-y-2.5 px-3 py-2.5">
                {result === null ? (
                    <>
                        <textarea
                            value={confusion}
                            onChange={(e) => {
                                setConfusion(e.target.value);
                                setError(null);
                            }}
                            rows={2}
                            disabled={loading}
                            placeholder={t.placeholder}
                            className="w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm leading-5 text-zinc-800 transition outline-none placeholder:text-zinc-400 focus:border-amber-400 focus:bg-white disabled:opacity-60"
                        />

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => void generate()}
                                disabled={loading || isTooShort}
                                className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-300 bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        {t.submitting}
                                    </>
                                ) : (
                                    t.submit
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={loading}
                                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                            >
                                {t.cancel}
                            </button>
                            {isTooShort && confusion.trim().length > 0 ? (
                                <span className="text-[11px] text-zinc-400">
                                    {t.minLength}
                                </span>
                            ) : null}
                        </div>
                    </>
                ) : null}

                {loading ? (
                    <div className="flex items-center gap-2 py-1 text-xs text-amber-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {t.loading}
                    </div>
                ) : null}

                {error !== null && !loading ? (
                    <div className="flex flex-wrap items-center gap-2 py-1">
                        <p className="text-xs text-rose-600">{error}</p>
                        <button
                            type="button"
                            onClick={() => void generate()}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                            <RotateCcw className="h-3 w-3" />
                            {t.retry}
                        </button>
                    </div>
                ) : null}

                {result !== null && !loading ? (
                    <div
                        className={cn(
                            'animate-in space-y-2 duration-200 fade-in slide-in-from-top-1',
                        )}
                    >
                        <div>
                            <p className="mb-0.5 text-[11px] font-semibold tracking-wide text-amber-700 uppercase">
                                {t.explanationTitle}
                            </p>
                            <p className="text-sm leading-relaxed text-zinc-700">
                                {result.explanation}
                            </p>
                        </div>

                        {result.guidance.trim() !== '' ? (
                            <div>
                                <p className="mb-0.5 text-[11px] font-semibold tracking-wide text-amber-700 uppercase">
                                    {t.guidanceTitle}
                                </p>
                                <p className="text-sm leading-relaxed text-zinc-700">
                                    {result.guidance}
                                </p>
                            </div>
                        ) : null}

                        <p className="text-[11px] text-zinc-400 italic">
                            {t.disclaimer}
                        </p>

                        <div className="rounded-lg bg-white/70 px-3 py-2">
                            <p className="mb-2 text-xs font-semibold text-zinc-700">
                                {t.resolvedQuestion}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onResolved}
                                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-300 bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600"
                                >
                                    <CheckCircle2 className="h-3 w-3" />
                                    {t.resolved}
                                </button>
                                <button
                                    type="button"
                                    onClick={onStillUnresolved}
                                    className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                                >
                                    {t.stillUnresolved}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

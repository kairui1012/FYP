import { Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { clarifyDoubt, type DoubtClarification } from '@/lib/ai-comment-feedback';
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
};

export function CommentAiDoubtPanel({ page, trans, postTitle, postContent, answerContent }: Props) {
    const [result, setResult] = useState<DoubtClarification | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);
    const inFlightRef = useRef(false);

    const t = {
        label: trans(page, 'comment.ai_doubt_label'),
        loading: trans(page, 'comment.ai_doubt_loading'),
        error: trans(page, 'comment.ai_doubt_error'),
        retry: trans(page, 'comment.ai_doubt_retry'),
        explanationTitle: trans(page, 'comment.ai_doubt_explanation_title'),
        guidanceTitle: trans(page, 'comment.ai_doubt_guidance_title'),
        disclaimer: trans(page, 'comment.ai_doubt_disclaimer'),
    };

    useEffect(() => {
        mountedRef.current = true;
        void generate();
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const generate = async () => {
        if (loading || inFlightRef.current) return;

        inFlightRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const data = await clarifyDoubt({ postTitle, postContent, answerContent });
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
        <div className="mx-1 mb-3 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/60">
            <div className="flex items-center gap-2 border-b border-amber-200/70 bg-amber-100/60 px-3 py-2">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span className="text-xs font-semibold text-amber-800">{t.label}</span>
            </div>

            <div className="px-3 py-2.5">
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
                            'space-y-2 animate-in fade-in slide-in-from-top-1 duration-200',
                        )}
                    >
                        <div>
                            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                {t.explanationTitle}
                            </p>
                            <p className="text-sm leading-relaxed text-zinc-700">
                                {result.explanation}
                            </p>
                        </div>

                        {result.guidance.trim() !== '' ? (
                            <div>
                                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                    {t.guidanceTitle}
                                </p>
                                <p className="text-sm leading-relaxed text-zinc-700">
                                    {result.guidance}
                                </p>
                            </div>
                        ) : null}

                        <p className="text-[11px] italic text-zinc-400">{t.disclaimer}</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

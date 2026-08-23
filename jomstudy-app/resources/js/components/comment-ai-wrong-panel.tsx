import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { validateWrongAnswer } from '@/lib/ai-comment-feedback';

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
    onValidated: () => void;
    onCancel: () => void;
};

export function CommentAiWrongPanel({
    page,
    trans,
    postTitle,
    postContent,
    answerContent,
    onValidated,
    onCancel,
}: Props) {
    const [reasoning, setReasoning] = useState('');
    const [loading, setLoading] = useState(false);
    const [verdict, setVerdict] = useState<{
        isWrong: boolean;
        message: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const t = {
        label: trans(page, 'comment.ai_wrong_label'),
        placeholder: trans(page, 'comment.ai_wrong_placeholder'),
        submit: trans(page, 'comment.ai_wrong_submit'),
        submitting: trans(page, 'comment.ai_wrong_submitting'),
        cancel: trans(page, 'comment.ai_wrong_cancel'),
        confirm: trans(page, 'comment.ai_wrong_confirm'),
        error: trans(page, 'comment.ai_wrong_error'),
        validTitle: trans(page, 'comment.ai_wrong_valid_title'),
        invalidTitle: trans(page, 'comment.ai_wrong_invalid_title'),
        editReasoning: trans(page, 'comment.ai_wrong_edit'),
        minLength: trans(page, 'comment.ai_wrong_min_length'),
    };

    const handleSubmit = async () => {
        const trimmed = reasoning.trim();
        if (Array.from(trimmed).length < 4) return;

        setLoading(true);
        setError(null);
        setVerdict(null);

        try {
            const result = await validateWrongAnswer({
                postTitle,
                postContent,
                answerContent,
                userReasoning: trimmed,
            });
            setVerdict({
                isWrong: result.is_wrong,
                message: result.message,
            });
            if (result.is_wrong) {
                onValidated();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t.error);
        } finally {
            setLoading(false);
        }
    };

    const isTooShort = Array.from(reasoning.trim()).length < 4;

    return (
        <div className="mx-1 mb-3 overflow-hidden rounded-xl border border-rose-200 bg-rose-50/50">
            <div className="flex items-center gap-2 border-b border-rose-200/70 bg-rose-100/60 px-3 py-2">
                <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                <span className="text-xs font-semibold text-rose-800">
                    {t.label}
                </span>
            </div>

            <div className="space-y-2.5 px-3 py-2.5">
                {/* Input area — hidden once verdict is shown */}
                {verdict === null ? (
                    <>
                        <textarea
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                            rows={2}
                            disabled={loading}
                            placeholder={t.placeholder}
                            className="w-full resize-none rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm leading-5 text-zinc-800 transition outline-none placeholder:text-zinc-400 focus:border-rose-400 focus:bg-white disabled:opacity-60"
                        />

                        {error !== null ? (
                            <p className="text-xs text-rose-600">{error}</p>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => void handleSubmit()}
                                disabled={loading || isTooShort}
                                className="inline-flex items-center gap-1.5 rounded-full border-2 border-rose-400 bg-rose-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                            {isTooShort && reasoning.trim().length > 0 ? (
                                <span className="text-[11px] text-zinc-400">
                                    {t.minLength}
                                </span>
                            ) : null}
                        </div>
                    </>
                ) : null}

                {/* Verdict display */}
                {verdict !== null ? (
                    <div className="animate-in space-y-2 duration-200 fade-in slide-in-from-top-1">
                        <div
                            className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm leading-relaxed ${
                                verdict.isWrong
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-amber-50 text-amber-800'
                            }`}
                        >
                            {verdict.isWrong ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            ) : (
                                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            )}
                            <div>
                                <p className="mb-0.5 text-[11px] font-bold tracking-wide uppercase">
                                    {verdict.isWrong
                                        ? t.validTitle
                                        : t.invalidTitle}
                                </p>
                                <p>{verdict.message}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {verdict.isWrong ? (
                                <button
                                    type="button"
                                    onClick={onValidated}
                                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-rose-400 bg-rose-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-600"
                                >
                                    <CheckCircle2 className="h-3 w-3" />
                                    {t.confirm}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVerdict(null);
                                        setError(null);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                                >
                                    {t.editReasoning}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onCancel}
                                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                            >
                                {t.cancel}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

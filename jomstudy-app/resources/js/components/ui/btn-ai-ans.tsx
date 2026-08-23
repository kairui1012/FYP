import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Circle, Languages, Loader2, Sparkles, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { explainAnswer, type QuizAiAnalysis } from '@/lib/ai-explain';
import { postAiJson } from '@/lib/ai-http';

type ManualResult = 'correct' | 'wrong' | null;

type TransFn = (key: string, page: unknown) => string;

type TranslatedQuestion = {
    question: string;
    options: string[];
};

type Props = {
    page: unknown;
    trans: TransFn;
    question: string;
    options: string[];
    creatorAnswer: string;
    selected: string;
    manualResult: ManualResult;
    onCheckAnswer: () => void;
    onTranslateQuestion?: (translated: TranslatedQuestion) => void;
};

function StatusBadge({
    status,
    label,
}: {
    status: 'unanswered' | 'correct' | 'incorrect';
    label: string;
}) {
    const configs = {
        unanswered: {
            icon: <Circle className="h-3 w-3" />,
            className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
        },
        correct: {
            icon: <CheckCircle2 className="h-3 w-3" />,
            className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        },
        incorrect: {
            icon: <XCircle className="h-3 w-3" />,
            className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        },
    } as const;

    const config = configs[status];

    return (
        <span
            className={cn(
                'inline-flex animate-in fade-in zoom-in-95 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold duration-200',
                config.className,
            )}
        >
            {config.icon}
            {label}
        </span>
    );
}

function ToneCard({
    title,
    value,
    tone,
}: {
    title: string;
    value: string;
    tone: 'emerald' | 'sky' | 'amber';
}) {
    const tones = {
        emerald: 'border-emerald-200 bg-white',
        sky: 'border-sky-200 bg-white',
        amber: 'border-amber-200 bg-white',
    } as const;

    const titleTones = {
        emerald: 'text-emerald-700',
        sky: 'text-sky-700',
        amber: 'text-amber-700',
    } as const;

    return (
        <div className={cn('rounded-xl border p-3', tones[tone])}>
            <p className={cn('text-xs font-semibold uppercase tracking-wide', titleTones[tone])}>
                {title}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-800">{value}</p>
        </div>
    );
}

function AnalysisBadge({
    label,
    tone,
}: {
    label: string;
    tone: 'emerald' | 'rose' | 'amber' | 'sky';
}) {
    const tones = {
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        rose: 'bg-rose-100 text-rose-700 border-rose-200',
        amber: 'bg-amber-100 text-amber-700 border-amber-200',
        sky: 'bg-sky-100 text-sky-700 border-sky-200',
    } as const;

    return (
        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide', tones[tone])}>
            {label}
        </span>
    );
}

async function translateTexts(texts: string[]): Promise<Record<string, string>> {
    const { translations } = await postAiJson(
        '/translate',
        { texts },
        'The AI translation service returned an unexpected response. Please try again.',
    );

    if (!translations || typeof translations !== 'object') {
        throw new Error('Translation failed');
    }

    return translations as Record<string, string>;
}

export function BtnAiAns({
    page,
    trans,
    question,
    options,
    creatorAnswer,
    selected,
    manualResult,
    onCheckAnswer,
    onTranslateQuestion,
}: Props) {
    const [analysis, setAnalysis] = useState<QuizAiAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [translating, setTranslating] = useState(false);
    const [translateError, setTranslateError] = useState<string | null>(null);
    const [translated, setTranslated] = useState(false);
    const cacheRef = useRef<Record<string, QuizAiAnalysis>>({});
    const inFlightRef = useRef<string | null>(null);
    const mountedRef = useRef(true);

    const selectedIndex = selected === '' ? -1 : Number(selected);
    const selectedAnswer = selectedIndex >= 0 && selectedIndex < options.length ? options[selectedIndex] : '';
    const cacheKey = useMemo(
        () => `${question}::${creatorAnswer}::${options.join('\u001f')}::${selected}`,
        [question, creatorAnswer, options, selected],
    );

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        setAnalysis(null);
        setError(null);
    }, [cacheKey]);

    const handleTranslate = async () => {
        if (translating || translated || !onTranslateQuestion) return;
        setTranslateError(null);
        setTranslating(true);
        try {
            const texts = [question, ...options];
            const result = await translateTexts(texts);
            if (!mountedRef.current) return;
            onTranslateQuestion({
                question: result[question] ?? question,
                options: options.map((opt) => result[opt] ?? opt),
            });
            setTranslated(true);
        } catch {
            if (!mountedRef.current) return;
            setTranslateError(trans('createPost.quiz_ai_translate_error', page));
        } finally {
            if (mountedRef.current) setTranslating(false);
        }
    };

    const handleAiAnswer = async () => {
        if (loading || selected === '') {
            return;
        }

        if (!selectedAnswer || !creatorAnswer) {
            setError(trans('createPost.quiz_ai_error', page));
            return;
        }

        const cached = cacheRef.current[cacheKey];
        if (cached) {
            setAnalysis(cached);
            setError(null);
            return;
        }

        if (inFlightRef.current === cacheKey) {
            return;
        }

        inFlightRef.current = cacheKey;
        setLoading(true);
        setError(null);

        try {
            const result = await explainAnswer({
                question,
                options,
                userAnswer: selectedAnswer,
                creatorAnswer,
            });

            if (!mountedRef.current) {
                return;
            }

            cacheRef.current[cacheKey] = result;
            setAnalysis(result);
        } catch (err) {
            if (!mountedRef.current) {
                return;
            }

            setError(
                err instanceof Error
                    ? err.message
                    : trans('createPost.quiz_ai_error', page),
            );
        } finally {
            inFlightRef.current = null;
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    };

    const manualStatus =
        manualResult === 'correct' ? 'correct' : manualResult === 'wrong' ? 'incorrect' : 'unanswered';

    const verdictTone = analysis?.isUserCorrect ? 'emerald' : 'rose';
    const matchCreatorTone = analysis?.matchesCreator ? 'sky' : 'amber';

    return (
        <div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={onCheckAnswer}
                    className="rounded-full border border-amber-500 bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                    {trans('createPost.quiz_check_answer', page)}
                </button>

                <button
                    type="button"
                    onClick={() => void handleAiAnswer()}
                    disabled={loading || selected === ''}
                    className={cn(
                        'inline-flex items-center gap-2 rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] px-4 py-2 text-sm font-semibold text-white transition-all duration-200',
                        'hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                    )}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4" />
                    )}
                    {loading
                        ? trans('createPost.quiz_ai_loading', page)
                        : trans('createPost.quiz_ai_answer', page)}
                </button>

                {onTranslateQuestion && (
                    <button
                        type="button"
                        onClick={() => void handleTranslate()}
                        disabled={translating || translated}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-full border-2 border-sky-400 bg-linear-to-r from-sky-400 to-sky-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200',
                            'hover:border-sky-600 hover:from-sky-100 hover:to-sky-200 hover:text-sky-800',
                            'disabled:cursor-not-allowed disabled:opacity-60',
                        )}
                    >
                        {translating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Languages className="h-4 w-4" />
                        )}
                        {translating
                            ? trans('createPost.quiz_ai_translate_loading', page)
                            : translated
                              ? trans('createPost.quiz_ai_translated_label', page)
                              : trans('createPost.quiz_ai_translate', page)}
                    </button>
                )}

                <StatusBadge
                    status={manualStatus}
                    label={
                        manualStatus === 'correct'
                            ? trans('createPost.quiz_status_correct', page)
                            : manualStatus === 'incorrect'
                                ? trans('createPost.quiz_status_incorrect', page)
                                : trans('createPost.quiz_status_unanswered', page)
                    }
                />
            </div>

            {translateError && (
                <p className="mt-2 text-xs font-medium text-rose-600">
                    {translateError}
                </p>
            )}

            {(analysis !== null || error !== null) && (
                <div
                    className={cn(
                        'mt-4 rounded-2xl border p-4',
                        analysis
                            ? analysis.matchesCreator
                                ? analysis.isUserCorrect
                                    ? 'border-emerald-200 bg-emerald-50'
                                    : 'border-rose-200 bg-rose-50'
                                : 'border-amber-300 bg-amber-50'
                            : 'border-rose-200 bg-rose-50',
                    )}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                            {trans('createPost.quiz_ai_suggestion', page)}
                        </p>
                        {analysis ? (
                            <>
                                <AnalysisBadge
                                    tone={verdictTone}
                                    label={
                                        analysis.isUserCorrect
                                            ? trans('createPost.quiz_status_correct', page)
                                            : trans('createPost.quiz_status_incorrect', page)
                                    }
                                />
                                <AnalysisBadge
                                    tone={matchCreatorTone}
                                    label={
                                        analysis.matchesCreator
                                            ? trans('createPost.quiz_ai_matches_creator', page)
                                            : trans('createPost.quiz_ai_discrepancy_title', page)
                                    }
                                />
                                {analysis.confidence === 'low' ? (
                                    <AnalysisBadge
                                        tone="amber"
                                        label={trans('createPost.quiz_ai_low_confidence', page)}
                                    />
                                ) : null}
                            </>
                        ) : null}
                    </div>

                    {analysis ? (
                        <div className="mt-3 space-y-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <ToneCard
                                    title={trans('createPost.quiz_ai_ai_answer', page)}
                                    value={analysis.aiAnswer}
                                    tone="emerald"
                                />
                                <ToneCard
                                    title={trans('createPost.quiz_ai_creator_answer', page)}
                                    value={analysis.creatorAnswer}
                                    tone="sky"
                                />
                                <ToneCard
                                    title={trans('createPost.quiz_ai_user_answer', page)}
                                    value={analysis.userAnswer}
                                    tone="amber"
                                />
                            </div>

                            <div className="rounded-xl border border-white/70 bg-white/90 p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                                    {trans('createPost.quiz_ai_reasoning', page)}
                                </p>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                                    {analysis.explanation}
                                </p>
                            </div>

                            {!analysis.matchesCreator ? (
                                <div className="rounded-xl border border-amber-300 bg-white/90 p-4">
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-800">
                                        {trans('createPost.quiz_ai_discrepancy_title', page)}
                                    </p>

                                    <div className="space-y-3">
                                        <div>
                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                                {trans('createPost.quiz_ai_ai_reasoning', page)}
                                            </p>
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                                                {analysis.aiReasoning ?? analysis.explanation}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                                {trans('createPost.quiz_ai_creator_reasoning', page)}
                                            </p>
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                                                {analysis.creatorReasoning ?? analysis.creatorAnswer}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                                {trans('createPost.quiz_ai_ambiguity_note', page)}
                                            </p>
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                                                {analysis.ambiguityNote ?? analysis.discrepancyAnalysis}
                                            </p>
                                        </div>

                                        {analysis.discrepancyAnalysis ? (
                                            <div className="rounded-lg bg-amber-100/60 p-3 text-sm leading-relaxed text-amber-900">
                                                {analysis.discrepancyAnalysis}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}

                            <p className="text-xs italic text-zinc-400">
                                {trans('createPost.quiz_ai_disclaimer', page)}
                            </p>
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-rose-600">
                            {error ?? trans('createPost.quiz_ai_error', page)}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

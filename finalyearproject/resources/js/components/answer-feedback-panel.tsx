import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react';
import { useRef, useState } from 'react';
import { requestAnswerFeedback, type AnswerFeedback } from '@/lib/ai-answer-feedback';
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

const statusStyles = {
    good: {
        Icon: CheckCircle2,
        badge: 'border-emerald-300 bg-emerald-50 text-emerald-700',
        panel: 'border-emerald-200 bg-emerald-50/50',
        dot: 'bg-emerald-500',
    },
    incomplete: {
        Icon: TriangleAlert,
        badge: 'border-amber-300 bg-amber-50 text-amber-700',
        panel: 'border-amber-200 bg-amber-50/50',
        dot: 'bg-amber-500',
    },
    wrong: {
        Icon: AlertCircle,
        badge: 'border-rose-300 bg-rose-50 text-rose-700',
        panel: 'border-rose-200 bg-rose-50/50',
        dot: 'bg-rose-500',
    },
} as const;

export function AnswerFeedbackPanel({ page, trans, postTitle, postContent, answerContent }: Props) {
    const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inFlightRef = useRef(false);

    const generate = async () => {
        if (loading || inFlightRef.current || answerContent.trim() === '') {
            return;
        }

        inFlightRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const result = await requestAnswerFeedback({
                postTitle,
                postContent,
                answerContent,
            });
            setFeedback(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : trans(page, 'comment.ai_feedback_error'));
        } finally {
            inFlightRef.current = false;
            setLoading(false);
        }
    };

    const status = feedback?.status ?? 'incomplete';
    const style = statusStyles[status];
    const StatusIcon = style.Icon;

    return (
        <div className="mt-3">
            {!feedback && !loading ? (
                <button
                    type="button"
                    onClick={() => void generate()}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-sky-300 bg-white px-4 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    {trans(page, 'comment.ai_feedback_button')}
                </button>
            ) : null}

            {loading ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-xs font-semibold text-sky-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {trans(page, 'comment.ai_feedback_loading')}
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
                        {trans(page, 'comment.ai_feedback_retry')}
                    </button>
                </div>
            ) : null}

            {feedback && !loading ? (
                <div className={cn('space-y-3 rounded-xl border p-4', style.panel)}>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold', style.badge)}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {trans(page, `comment.ai_feedback_status_${feedback.status}`)}
                        </span>
                        <button
                            type="button"
                            onClick={() => void generate()}
                            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700"
                        >
                            <RotateCcw className="h-3 w-3" />
                            {trans(page, 'comment.ai_feedback_retry')}
                        </button>
                    </div>

                    <p className="text-sm leading-6 whitespace-pre-wrap text-zinc-800">
                        {feedback.feedback}
                    </p>

                    {feedback.strengths.length > 0 ? (
                        <FeedbackList
                            title={trans(page, 'comment.ai_feedback_strengths')}
                            items={feedback.strengths}
                            dotClass={style.dot}
                        />
                    ) : null}

                    {feedback.improvements.length > 0 ? (
                        <FeedbackList
                            title={trans(page, 'comment.ai_feedback_improvements')}
                            items={feedback.improvements}
                            dotClass="bg-sky-500"
                        />
                    ) : null}

                    {feedback.next_step ? (
                        <div className="rounded-lg border border-white/70 bg-white/70 p-3">
                            <p className="mb-1 text-xs font-bold tracking-wide text-zinc-500 uppercase">
                                {trans(page, 'comment.ai_feedback_next_step')}
                            </p>
                            <p className="text-sm leading-6 text-zinc-700">{feedback.next_step}</p>
                        </div>
                    ) : null}

                    <p className="text-xs italic text-zinc-400">
                        {trans(page, 'comment.ai_feedback_disclaimer')}
                    </p>
                </div>
            ) : null}
        </div>
    );
}

function FeedbackList({ title, items, dotClass }: { title: string; items: string[]; dotClass: string }) {
    return (
        <div>
            <p className="mb-1.5 text-xs font-bold tracking-wide text-zinc-500 uppercase">{title}</p>
            <ul className="space-y-1.5">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm leading-6 text-zinc-700">
                        <span className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', dotClass)} />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

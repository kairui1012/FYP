import { Link } from '@inertiajs/react';
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import { Fragment } from 'react';
import type {
    QuizFolderMode,
    QuizReviewItem,
    TransFn,
} from '@/components/ts/features/study-folder/study-folder-types';
import { cn } from '@/lib/common-helpers';
import { formatTimeAgo, getSubjectLabel } from '@/lib/post-display-helpers';

type QuizReviewListProps = {
    items: QuizReviewItem[];
    mode: Extract<QuizFolderMode, 'correct' | 'wrong'>;
    trans: TransFn;
};

export function QuizReviewList({ items, mode, trans }: QuizReviewListProps) {
    if (items.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-rose-200 bg-linear-to-br from-rose-50 via-white to-sky-50 px-5 py-12 text-center md:px-8 md:py-14">
                <div className="mx-auto flex max-w-lg flex-col items-center">
                    <div className="relative mb-5 h-20 w-28">
                        <div className="absolute top-0 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-rose-100">
                            <span className="text-[#e27193] [&>svg]:h-7 [&>svg]:w-7">
                                {mode === 'correct' ? (
                                    <CheckCircle2 />
                                ) : (
                                    <XCircle />
                                )}
                            </span>
                        </div>
                        <div className="absolute bottom-0 left-2 h-10 w-10 rounded-full bg-sky-100 ring-4 ring-white" />
                        <div className="absolute right-2 bottom-0 h-10 w-10 rounded-full bg-amber-100 ring-4 ring-white" />
                    </div>
                    <h2 className="text-lg font-bold text-zinc-900">
                        {mode === 'correct'
                            ? trans('bookmark.no_correct_answers')
                            : trans('bookmark.no_wrong_answers')}
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <div>
            {items.map((item, index) => (
                <Fragment key={item.id}>
                    {index > 0 && <hr className="my-5 border-zinc-100" />}
                    <QuizReviewCard item={item} mode={mode} trans={trans} />
                </Fragment>
            ))}
        </div>
    );
}

type QuizReviewCardProps = {
    item: QuizReviewItem;
    mode: Extract<QuizFolderMode, 'correct' | 'wrong'>;
    trans: TransFn;
};

function QuizReviewCard({ item, mode, trans }: QuizReviewCardProps) {
    const subjectLabel = getSubjectLabel(item.subject_name, trans);

    return (
        <article>
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <span
                        className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
                            mode === 'wrong'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-emerald-50 text-emerald-700',
                        )}
                    >
                        {mode === 'wrong'
                            ? trans('bookmark.study_folder_wrong')
                            : trans('bookmark.study_folder_correct')}
                    </span>
                    <h3 className="text-base leading-6 font-semibold text-zinc-900">
                        {item.question_text || item.post_title}
                    </h3>
                </div>

                <span className="shrink-0 text-xs font-medium text-zinc-500">
                    {formatTimeAgo(item.attempted_at)}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                {subjectLabel ? (
                    <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
                        {subjectLabel}
                    </span>
                ) : null}
                <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-600">
                    Q{item.question_index + 1}
                </span>
            </div>

            {item.selected_answer ? (
                <div className="mt-4 rounded-2xl bg-[#fff7fa] p-3">
                    <p className="text-xs font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                        {trans('bookmark.your_answer_label')}
                    </p>
                    <p
                        className={cn(
                            'mt-1 text-sm',
                            mode === 'wrong'
                                ? 'text-rose-700'
                                : 'text-emerald-700',
                        )}
                    >
                        {item.selected_answer}
                    </p>
                </div>
            ) : null}

            {item.correct_answer ? (
                <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="text-xs font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                        {trans('bookmark.correct_answer_label')}
                    </p>
                    <p className="mt-1 text-sm text-zinc-700">
                        {item.correct_answer}
                    </p>
                </div>
            ) : null}

            <div className="mt-4 flex justify-end">
                <Link
                    href={`/posts/${item.post_id}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
                >
                    <ExternalLink className="h-4 w-4" />
                    View Quiz
                </Link>
            </div>
        </article>
    );
}

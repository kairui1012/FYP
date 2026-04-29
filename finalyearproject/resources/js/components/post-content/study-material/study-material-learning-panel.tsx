import { reactLang } from '@erag/lang-sync-inertia';
import { Link } from '@inertiajs/react';
import {
    BarChart3,
    BookOpenCheck,
    CheckCircle2,
    MessageSquareText,
    Star,
    ThumbsDown,
    ThumbsUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PostItem } from '@/types';

type StudyMaterialLearningPanelProps = {
    post: PostItem;
    canManageMaterial: boolean;
};

type FeedbackPayload = {
    status: string;
    summary?: PostItem['material_feedback_summary'];
    user_feedback?: PostItem['material_user_feedback'];
    analytics?: PostItem['learning_analytics'];
};

function csrfHeaders() {
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

function formatDate(value: string | null | undefined, fallback: string) {
    if (!value) {
        return fallback;
    }

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(value));
}

function StatTile({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-medium text-zinc-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{value}</p>
        </div>
    );
}

export function StudyMaterialLearningPanel({
    post,
    canManageMaterial,
}: StudyMaterialLearningPanelProps) {
    const { trans } = reactLang();
    const [summary, setSummary] = useState(post.material_feedback_summary);
    const [analytics, setAnalytics] = useState(post.learning_analytics);
    const [vote, setVote] = useState<number | null>(
        post.material_user_feedback?.vote ?? null,
    );
    const [rating, setRating] = useState<number | null>(
        post.material_user_feedback?.rating ?? null,
    );
    const [feedback, setFeedback] = useState(
        post.material_user_feedback?.feedback ?? '',
    );
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const averageRating = summary?.average_rating ?? 0;
    const totalVotes = summary?.total_votes ?? 0;
    const linkedQuizzes = useMemo(
        () => post.linked_quizzes ?? [],
        [post.linked_quizzes],
    );
    const publisherRole = post.user?.role ?? 'teacher';

    const quizQuestionCount = useMemo(
        () =>
            linkedQuizzes.reduce((total, quiz) => {
                const questions = quiz.quiz_data?.questions;
                return (
                    total + (Array.isArray(questions) ? questions.length : 1)
                );
            }, 0),
        [linkedQuizzes],
    );

    const submitFeedback = async () => {
        if (saving) {
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const response = await fetch(
                `/posts/${post.id}/material-feedback`,
                {
                    method: 'POST',
                    headers: csrfHeaders(),
                    body: JSON.stringify({
                        vote,
                        rating,
                        feedback: feedback.trim(),
                    }),
                },
            );

            if (!response.ok) {
                throw new Error(trans('createPost.material_feedback_error'));
            }

            const payload = (await response.json()) as FeedbackPayload;
            setSummary(payload.summary ?? null);
            setAnalytics(payload.analytics ?? null);
            setVote(payload.user_feedback?.vote ?? null);
            setRating(payload.user_feedback?.rating ?? null);
            setFeedback(payload.user_feedback?.feedback ?? '');
            setMessage(trans('createPost.material_feedback_submitted'));
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : trans('createPost.material_feedback_error'),
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-4 my-8 space-y-4">
            <section className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                            {trans('createPost.material_page_label')}
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-zinc-950">
                            {post.title}
                        </h2>
                        <p className="mt-2 text-sm text-zinc-600">
                            {trans('createPost.material_publisher_label')}:{' '}
                            {post.user?.name ??
                                trans('createPost.material_unknown_user')}{' '}
                            (<span className="capitalize">{publisherRole}</span>
                            )
                        </p>
                        <p className="text-sm text-zinc-500">
                            {trans('createPost.material_last_updated_label')}:{' '}
                            {formatDate(
                                post.updated_at,
                                trans('createPost.material_not_available'),
                            )}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {trans('createPost.material_reliable_badge')}
                        </span>
                        {post.material_improved_from_feedback ? (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {trans('createPost.material_improved_badge')}
                            </span>
                        ) : null}
                    </div>
                </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-2">
                    <BookOpenCheck className="h-5 w-5 text-amber-600" />
                    <h3 className="text-base font-semibold text-zinc-900">
                        {trans('createPost.material_quiz_section')}
                    </h3>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatTile
                        label={trans('createPost.material_linked_quizzes')}
                        value={linkedQuizzes.length}
                    />
                    <StatTile
                        label={trans('createPost.material_quiz_questions')}
                        value={quizQuestionCount}
                    />
                    <StatTile
                        label={trans('createPost.material_attempts_recorded')}
                        value={analytics?.quiz_attempts ?? 0}
                    />
                </div>
                <div className="mt-4 space-y-3">
                    {linkedQuizzes.length > 0 ? (
                        linkedQuizzes.map((quiz) => (
                            <Link
                                key={quiz.id}
                                href={`/posts/${quiz.id}`}
                                className="block rounded-lg border border-amber-200 bg-amber-50 p-3 transition hover:border-amber-400 hover:bg-amber-100"
                            >
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="font-semibold text-zinc-900">
                                        {quiz.title}
                                    </p>
                                    <span className="text-xs font-semibold text-amber-700">
                                        {trans(
                                            'createPost.material_attempt_quiz',
                                        )}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-zinc-600">
                                    {trans(
                                        'createPost.material_contributed_by',
                                    )}{' '}
                                    {quiz.user?.name ??
                                        trans(
                                            'createPost.material_unknown_user',
                                        )}
                                </p>
                            </Link>
                        ))
                    ) : (
                        <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-500">
                            {trans('createPost.material_no_linked_quizzes')}
                        </p>
                    )}
                </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-2">
                    <MessageSquareText className="h-5 w-5 text-rose-600" />
                    <h3 className="text-base font-semibold text-zinc-900">
                        {trans('createPost.material_student_feedback')}
                    </h3>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatTile
                        label={trans('createPost.material_average_rating')}
                        value={`${averageRating.toFixed(1)} / 5`}
                    />
                    <StatTile
                        label={trans('createPost.material_total_votes')}
                        value={totalVotes}
                    />
                    <StatTile
                        label={trans('createPost.material_feedback_count')}
                        value={summary?.feedback_count ?? 0}
                    />
                </div>

                <div className="mt-4 rounded-lg bg-zinc-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setVote(vote === 1 ? null : 1)}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                                vote === 1
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                        >
                            <ThumbsUp className="h-4 w-4" />
                            {trans('createPost.material_upvote')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setVote(vote === -1 ? null : -1)}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                                vote === -1
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-white text-zinc-700 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                        >
                            <ThumbsDown className="h-4 w-4" />
                            {trans('createPost.material_downvote')}
                        </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() =>
                                    setRating(rating === value ? null : value)
                                }
                                className="p-1"
                                aria-label={`${trans('createPost.material_average_rating')} ${value}`}
                            >
                                <Star
                                    className={`h-6 w-6 ${
                                        rating && value <= rating
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-zinc-300'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={feedback}
                        onChange={(event) => setFeedback(event.target.value)}
                        rows={4}
                        maxLength={2000}
                        placeholder={trans(
                            'createPost.material_feedback_placeholder',
                        )}
                        className="mt-4 w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 transition outline-none placeholder:text-zinc-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void submitFeedback()}
                            disabled={saving}
                            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:pointer-events-none disabled:opacity-50"
                        >
                            {saving
                                ? trans(
                                      'createPost.material_submitting_feedback',
                                  )
                                : trans('createPost.material_submit_feedback')}
                        </button>
                        {message ? (
                            <span className="text-sm text-zinc-500">
                                {message}
                            </span>
                        ) : null}
                    </div>
                </div>

                {canManageMaterial && summary?.latest_feedback?.length ? (
                    <div className="mt-4 space-y-3">
                        <p className="text-sm font-semibold text-zinc-800">
                            {trans('createPost.material_feedback_improvement')}
                        </p>
                        {summary.latest_feedback.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-lg border border-zinc-200 bg-white p-3"
                            >
                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                    <span className="font-semibold text-zinc-700">
                                        {item.user?.name ??
                                            trans(
                                                'createPost.material_unknown_user',
                                            )}
                                    </span>
                                    <span className="capitalize">
                                        {item.user?.role ?? 'student'}
                                    </span>
                                    {item.rating ? (
                                        <span>{item.rating}/5</span>
                                    ) : null}
                                </div>
                                <p className="mt-2 text-sm text-zinc-700">
                                    {item.feedback}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : null}
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-base font-semibold text-zinc-900">
                        {trans('createPost.material_learning_analytics')}
                    </h3>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile
                        label={trans('createPost.material_views')}
                        value={analytics?.views ?? 0}
                    />
                    <StatTile
                        label={trans('createPost.material_unique_users')}
                        value={analytics?.unique_users ?? 0}
                    />
                    <StatTile
                        label={trans('createPost.material_average_quiz_score')}
                        value={`${(analytics?.average_quiz_score ?? 0).toFixed(1)}%`}
                    />
                    <StatTile
                        label={trans('createPost.material_attempt_improvement')}
                        value={`${(analytics?.improvement_across_attempts ?? 0).toFixed(1)}%`}
                    />
                </div>
                <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{trans('createPost.material_learning_loop')}</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

import {
    Ellipsis,
    LoaderCircle,
    Pencil,
    ThumbsDown,
    ThumbsUp,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { trans } from '@/components/post-content/post-content-config';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { formatFullDate, formatTimeAgo } from '@/lib/post-utils';
import { cn } from '@/lib/utils';
import type { MaterialFeedbackEntry, PostItem } from '@/types';

type MaterialFeedbackSectionProps = {
    page: unknown;
    post: PostItem;
    onFeedbackCountChange?: (count: number) => void;
};

type FeedbackPayload = {
    status: string;
    summary?: PostItem['material_feedback_summary'];
    user_feedback?: PostItem['material_user_feedback'];
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

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function getRoleBadgeTone(role?: string) {
    if (role === 'teacher') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (role === 'admin') {
        return 'border-sky-200 bg-sky-50 text-sky-700';
    }

    return 'border-zinc-200 bg-zinc-100 text-zinc-600';
}

function formatRole(role?: string) {
    if (!role) {
        return '';
    }

    return role.charAt(0).toUpperCase() + role.slice(1);
}


function RecommendationButton({
    active,
    disabled,
    count,
    tone,
    icon,
    label,
    onClick,
}: {
    active: boolean;
    disabled?: boolean;
    count: number;
    tone: 'positive' | 'negative';
    icon: 'up' | 'down';
    label: string;
    onClick?: () => void;
}) {
    const Icon = icon === 'up' ? ThumbsUp : ThumbsDown;

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'inline-flex min-w-[132px] items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition',
                tone === 'positive'
                    ? active
                        ? 'border-emerald-300 bg-emerald-100 text-emerald-800 shadow-sm'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : active
                      ? 'border-rose-300 bg-rose-100 text-rose-800 shadow-sm'
                      : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
                disabled ? 'cursor-not-allowed opacity-60' : '',
            )}
        >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                {count}
            </span>
        </button>
    );
}

function FeedbackCard({
    page,
    entry,
    deleting,
    onEdit,
    onDelete,
}: {
    page: unknown;
    entry: MaterialFeedbackEntry;
    deleting: boolean;
    onEdit: (entry: MaterialFeedbackEntry) => void;
    onDelete: (entry: MaterialFeedbackEntry) => void;
}) {
    const displayTime = entry.updated_at ?? entry.created_at ?? null;
    const userName =
        entry.user?.name ?? trans('createPost.material_unknown_user', page);
    const role = entry.user?.role ?? 'student';

    return (
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-11 w-11 border border-zinc-200">
                        <AvatarImage
                            src={entry.user?.avatar ?? undefined}
                            alt={userName}
                        />
                        <AvatarFallback className="bg-zinc-100 text-sm font-semibold text-zinc-700">
                            {getInitials(userName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-zinc-900">
                                {userName}
                            </p>
                            {role !== 'student' ? (
                                <span
                                    className={cn(
                                        'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                                        getRoleBadgeTone(role),
                                    )}
                                >
                                    {formatRole(role)}
                                </span>
                            ) : null}
                        </div>
                        {displayTime ? (
                            <time
                                className="text-xs text-zinc-500"
                                title={formatFullDate(displayTime)}
                            >
                                {formatTimeAgo(displayTime)}
                            </time>
                        ) : null}
                    </div>
                </div>

                {entry.is_owner ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                                aria-label={trans(
                                    'createPost.material_feedback_manage',
                                    page,
                                )}
                            >
                                <Ellipsis className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onEdit(entry)}>
                                <Pencil className="h-4 w-4" />
                                {trans(
                                    'createPost.material_feedback_edit',
                                    page,
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                disabled={deleting}
                                onClick={() => onDelete(entry)}
                            >
                                <Trash2 className="h-4 w-4" />
                                {trans(
                                    'createPost.material_feedback_delete',
                                    page,
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
            </div>

            <div className="mt-4">
                <p className="text-[15px] leading-7 whitespace-pre-wrap text-zinc-800">
                    {entry.feedback}
                </p>
            </div>

            <div className="mt-5 flex justify-center gap-3">
                <RecommendationButton
                    active={entry.vote === 1}
                    disabled
                    count={entry.recommend_count}
                    tone="positive"
                    icon="up"
                    label={trans('createPost.material_recommend', page)}
                />
                <RecommendationButton
                    active={entry.vote === -1}
                    disabled
                    count={entry.not_recommend_count}
                    tone="negative"
                    icon="down"
                    label={trans('createPost.material_not_recommend', page)}
                />
            </div>
        </article>
    );
}

export function MaterialFeedbackSection({
    page,
    post,
    onFeedbackCountChange,
}: MaterialFeedbackSectionProps) {
    const currentUser = (
        page as {
            props?: {
                auth?: {
                    user?: {
                        name?: string;
                        avatar?: string | null;
                    };
                };
            };
        }
    ).props?.auth?.user;
    const [summary, setSummary] = useState(post.material_feedback_summary);
    const [userFeedback, setUserFeedback] = useState(
        post.material_user_feedback,
    );
    const [draftFeedback, setDraftFeedback] = useState(
        post.material_user_feedback?.feedback ?? '',
    );
    const [draftVote, setDraftVote] = useState<number | null>(
        post.material_user_feedback?.vote ?? null,
    );
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setSummary(post.material_feedback_summary);
        setUserFeedback(post.material_user_feedback);
        setDraftFeedback(post.material_user_feedback?.feedback ?? '');
        setDraftVote(post.material_user_feedback?.vote ?? null);
        setMessage(null);
        setErrorMessage(null);
    }, [post.id, post.material_feedback_summary, post.material_user_feedback]);

    useEffect(() => {
        onFeedbackCountChange?.(
            Math.max(summary?.feedback_count ?? 0, summary?.total_votes ?? 0),
        );
    }, [onFeedbackCountChange, summary?.feedback_count, summary?.total_votes]);

    const entries = useMemo(
        () => summary?.latest_feedback ?? [],
        [summary?.latest_feedback],
    );

    const handleSubmit = async () => {
        if (submitting) {
            return;
        }

        if (draftVote === null && draftFeedback.trim() === '') {
            setErrorMessage(
                trans('createPost.material_feedback_required', page),
            );
            return;
        }

        setSubmitting(true);
        setMessage(null);
        setErrorMessage(null);

        try {
            const response = await fetch(
                `/posts/${post.id}/material-feedback`,
                {
                    method: 'POST',
                    headers: csrfHeaders(),
                    body: JSON.stringify({
                        vote: draftVote,
                        feedback: draftFeedback.trim(),
                    }),
                },
            );

            const payload = (await response.json()) as FeedbackPayload & {
                message?: string;
            };

            if (!response.ok) {
                throw new Error(
                    payload.message ??
                        trans('createPost.material_feedback_error', page),
                );
            }

            setSummary(payload.summary ?? null);
            setUserFeedback(payload.user_feedback ?? null);
            setDraftFeedback(payload.user_feedback?.feedback ?? '');
            setDraftVote(payload.user_feedback?.vote ?? null);
            setMessage(trans('createPost.material_feedback_submitted', page));
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : trans('createPost.material_feedback_error', page),
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (deleting) {
            return;
        }

        setDeleting(true);
        setMessage(null);
        setErrorMessage(null);

        try {
            const response = await fetch(
                `/posts/${post.id}/material-feedback`,
                {
                    method: 'DELETE',
                    headers: csrfHeaders(),
                },
            );

            const payload = (await response.json()) as FeedbackPayload & {
                message?: string;
            };

            if (!response.ok) {
                throw new Error(
                    payload.message ??
                        trans(
                            'createPost.material_feedback_delete_error',
                            page,
                        ),
                );
            }

            setSummary(payload.summary ?? null);
            setUserFeedback(null);
            setDraftFeedback('');
            setDraftVote(null);
            setMessage(trans('createPost.material_feedback_deleted', page));
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : trans('createPost.material_feedback_delete_error', page),
            );
        } finally {
            setDeleting(false);
        }
    };

    const beginEditing = (entry: MaterialFeedbackEntry) => {
        if (!entry.is_owner) {
            return;
        }

        setDraftFeedback(entry.feedback);
        setDraftVote(entry.vote ?? null);
        setMessage(null);
        setErrorMessage(null);
        textareaRef.current?.focus();
        textareaRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    };

    const recommendedCount =
        summary?.recommended_count ?? summary?.upvotes ?? 0;
    const notRecommendedCount =
        summary?.not_recommended_count ?? summary?.downvotes ?? 0;
    const hasSubmittedFeedback = Boolean(userFeedback?.id);

    return (
        <section className="space-y-5">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-zinc-950">
                        {trans('createPost.material_student_feedback', page)}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                        {summary?.feedback_count ?? 0}{' '}
                        {trans('createPost.material_feedback_plural', page)}
                    </p>

                    <div className="mt-3 inline-flex rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-zinc-200">
                        <button
                            type="button"
                            className="rounded-full bg-[#e27193] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-all duration-150"
                        >
                            Latest
                        </button>
                        <button
                            type="button"
                            className="rounded-full px-4 py-1.5 text-sm font-semibold text-zinc-500 transition-all duration-150 hover:text-[#e27193]"
                        >
                            Most Useful
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11 border border-zinc-200">
                        <AvatarImage
                            src={currentUser?.avatar ?? undefined}
                            alt={currentUser?.name ?? 'You'}
                        />
                        <AvatarFallback className="bg-zinc-100 text-sm font-semibold text-zinc-700">
                            {getInitials(currentUser?.name ?? 'You')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-900">
                            {currentUser?.name ?? 'You'}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                            {hasSubmittedFeedback
                                ? trans(
                                      'createPost.material_feedback_update_title',
                                      page,
                                  )
                                : trans(
                                      'createPost.material_feedback_write_title',
                                      page,
                                  )}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                            {trans(
                                'createPost.material_feedback_write_hint',
                                page,
                            )}
                        </p>
                    </div>
                </div>

                <div className="mt-5">
                    <Textarea
                        ref={textareaRef}
                        value={draftFeedback}
                        onChange={(event) => {
                            setDraftFeedback(event.target.value);
                            setErrorMessage(null);
                            setMessage(null);
                        }}
                        rows={5}
                        placeholder={trans(
                            'createPost.material_feedback_placeholder',
                            page,
                        )}
                        className="min-h-[140px] rounded-3xl border-zinc-200 px-4 py-3 text-sm leading-7 shadow-none focus-visible:ring-emerald-200"
                    />
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <RecommendationButton
                        active={draftVote === 1}
                        disabled={submitting || deleting}
                        count={recommendedCount}
                        tone="positive"
                        icon="up"
                        label={trans('createPost.material_recommend', page)}
                        onClick={() => {
                            setDraftVote((current) =>
                                current === 1 ? null : 1,
                            );
                            setErrorMessage(null);
                            setMessage(null);
                        }}
                    />
                    <RecommendationButton
                        active={draftVote === -1}
                        disabled={submitting || deleting}
                        count={notRecommendedCount}
                        tone="negative"
                        icon="down"
                        label={trans('createPost.material_not_recommend', page)}
                        onClick={() => {
                            setDraftVote((current) =>
                                current === -1 ? null : -1,
                            );
                            setErrorMessage(null);
                            setMessage(null);
                        }}
                    />
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm">
                        {errorMessage ? (
                            <p className="text-rose-600">{errorMessage}</p>
                        ) : message ? (
                            <p className="text-emerald-700">{message}</p>
                        ) : (
                            <p className="text-zinc-500">
                                {trans(
                                    'createPost.material_feedback_toggle_hint',
                                    page,
                                )}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {hasSubmittedFeedback ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {
                                    setDraftFeedback(
                                        userFeedback?.feedback ?? '',
                                    );
                                    setDraftVote(userFeedback?.vote ?? null);
                                    setErrorMessage(null);
                                    setMessage(null);
                                }}
                                disabled={submitting || deleting}
                            >
                                {trans(
                                    'createPost.material_feedback_reset',
                                    page,
                                )}
                            </Button>
                        ) : null}
                        <Button
                            type="button"
                            className="rounded-full bg-zinc-950 px-5 text-white hover:bg-zinc-800"
                            onClick={() => {
                                void handleSubmit();
                            }}
                            disabled={submitting || deleting}
                        >
                            {submitting ? (
                                <>
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                    {trans(
                                        'createPost.material_submitting_feedback',
                                        page,
                                    )}
                                </>
                            ) : hasSubmittedFeedback ? (
                                trans(
                                    'createPost.material_feedback_update',
                                    page,
                                )
                            ) : (
                                trans(
                                    'createPost.material_submit_feedback',
                                    page,
                                )
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {entries.length > 0 ? (
                    entries.map((entry) => (
                        <FeedbackCard
                            key={entry.id}
                            page={page}
                            entry={entry}
                            deleting={deleting}
                            onEdit={beginEditing}
                            onDelete={() => {
                                void handleDelete();
                            }}
                        />
                    ))
                ) : (
                    <div className="rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center shadow-sm">
                        <p className="text-sm font-medium text-zinc-700">
                            {trans('createPost.material_feedback_empty', page)}
                        </p>
                        <p className="mt-2 text-sm text-zinc-500">
                            {trans(
                                'createPost.material_feedback_empty_hint',
                                page,
                            )}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

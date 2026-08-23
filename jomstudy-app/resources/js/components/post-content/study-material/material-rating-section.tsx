import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { trans } from '@/component-new/config/post-content-config';
import { cn } from '@/lib/utils';
import type { PostItem } from '@/types';

type MaterialRatingSectionProps = {
    page: unknown;
    post: PostItem;
};

type FeedbackPayload = {
    status: string;
    message?: string;
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

function RatingStars({
    value,
    interactive = false,
    disabled = false,
    onHoverChange,
    onSelect,
}: {
    value: number;
    interactive?: boolean;
    disabled?: boolean;
    onHoverChange?: (value: number) => void;
    onSelect?: (value: number) => void;
}) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((rating) => {
                const filled = rating <= value;

                if (!interactive) {
                    return (
                        <Star
                            key={rating}
                            className={cn(
                                'h-5 w-5',
                                filled
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-zinc-300',
                            )}
                        />
                    );
                }

                return (
                    <button
                        key={rating}
                        type="button"
                        disabled={disabled}
                        onMouseEnter={() => onHoverChange?.(rating)}
                        onMouseLeave={() => onHoverChange?.(0)}
                        onClick={() => onSelect?.(rating)}
                        aria-label={`Rate ${rating} star${rating > 1 ? 's' : ''}`}
                        className="rounded-full p-1 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Star
                            className={cn(
                                'h-7 w-7 transition-colors',
                                filled
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-zinc-300',
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}

export function MaterialRatingSection({
    page,
    post,
}: MaterialRatingSectionProps) {
    const [summary, setSummary] = useState(post.material_feedback_summary);
    const [selectedRating, setSelectedRating] = useState<number | null>(
        post.material_user_feedback?.rating ?? null,
    );
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        setSummary(post.material_feedback_summary);
        setSelectedRating(post.material_user_feedback?.rating ?? null);
        setHoverRating(0);
        setMessage(null);
    }, [post.id, post.material_feedback_summary, post.material_user_feedback]);

    const averageRating = summary?.average_rating ?? 0;
    const ratingCount = summary?.rating_count ?? 0;
    const previewRating = hoverRating || selectedRating || 0;

    const submitRating = async (rating: number) => {
        if (submitting) {
            return;
        }

        setSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch(
                `/posts/${post.id}/material-feedback`,
                {
                    method: 'POST',
                    headers: csrfHeaders(),
                    body: JSON.stringify({ rating }),
                },
            );

            const payload = (await response.json()) as FeedbackPayload;

            if (!response.ok) {
                throw new Error(
                    payload.message ??
                        trans('createPost.material_feedback_error', page),
                );
            }

            setSummary(payload.summary ?? null);
            setSelectedRating(payload.user_feedback?.rating ?? rating);
            setMessage(trans('createPost.material_feedback_submitted', page));
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : trans('createPost.material_feedback_error', page),
            );
        } finally {
            setSubmitting(false);
            setHoverRating(0);
        }
    };

    return (
        <section className="px-4 pt-2 pb-8">
            <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold tracking-wide text-amber-800 uppercase">
                            {trans(
                                'createPost.material_rating_system_title',
                                page,
                            )}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                            <RatingStars value={Math.round(averageRating)} />
                            <p className="text-2xl font-semibold text-zinc-950">
                                {averageRating.toFixed(1)}
                            </p>
                            <span className="text-sm text-zinc-500">/ 5</span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-600">
                            {ratingCount}{' '}
                            {trans('createPost.material_rating_count', page)}
                        </p>
                    </div>

                    <div className="sm:text-right">
                        <p className="text-sm font-medium text-zinc-700">
                            {trans(
                                'createPost.material_rate_this_material',
                                page,
                            )}
                        </p>
                        <div className="mt-2 flex justify-start sm:justify-end">
                            <RatingStars
                                value={previewRating}
                                interactive
                                disabled={submitting}
                                onHoverChange={setHoverRating}
                                onSelect={(rating) => {
                                    void submitRating(rating);
                                }}
                            />
                        </div>
                        {selectedRating ? (
                            <p className="mt-2 text-xs text-zinc-500">
                                {trans('createPost.material_your_rating', page)}
                                : {selectedRating}/5
                            </p>
                        ) : null}
                    </div>
                </div>

                {message ? (
                    <p className="mt-4 text-sm text-zinc-600">{message}</p>
                ) : null}
            </div>
        </section>
    );
}

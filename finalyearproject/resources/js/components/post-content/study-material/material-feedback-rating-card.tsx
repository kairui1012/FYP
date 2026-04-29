import { trans } from '@/components/post-content/post-content-config';

type MaterialFeedbackRatingCardProps = {
    page: unknown;
    hoverRating: number;
    selectedRating: number | null;
    ratingSubmitting: boolean;
    ratingMessage: string | null;
    displayAverageRating: number;
    displayTotalVotes: number;
    displayFeedbackCount: number;
    onHoverRatingChange: (value: number) => void;
    onSubmitRating: (value: number) => void;
};

export function MaterialFeedbackRatingCard({
    page,
    hoverRating,
    selectedRating,
    ratingSubmitting,
    ratingMessage,
    displayAverageRating,
    displayTotalVotes,
    displayFeedbackCount,
    onHoverRatingChange,
    onSubmitRating,
}: MaterialFeedbackRatingCardProps) {
    return (
        <div className="mb-6 space-y-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
                <h3 className="mb-2.5 flex items-center justify-center text-xl font-semibold">
                    {trans('createPost.material_rating_system_title', page)}
                </h3>
                <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => {
                        const isFilled =
                            value <= (hoverRating || selectedRating || 0);

                        return (
                                <button
                                    key={value}
                                    type="button"
                                    onMouseEnter={() => onHoverRatingChange(value)}
                                    onMouseLeave={() => onHoverRatingChange(0)}
                                    onClick={() => {
                                        onSubmitRating(value);
                                    }}
                                    disabled={ratingSubmitting}
                                    className="rounded-md p-1 transition-transform duration-150 hover:scale-110 disabled:opacity-60"
                                    aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                                >
                                    <svg
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className={`h-8 w-8 ${
                                            isFilled
                                                ? 'text-amber-400'
                                                : 'text-zinc-300'
                                        }`}
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.291c.3.922-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.196-1.539-1.118l1.07-3.291a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
                                    </svg>
                                </button>                       
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <div className="min-w-0 rounded-xl border border-zinc-200 bg-white px-2 py-2 text-center sm:p-3">
                    <p className="text-[11px] leading-tight text-zinc-500 sm:text-xs">
                        {trans('createPost.material_average_rating', page)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-zinc-900 sm:text-sm">
                        {displayAverageRating.toFixed(1)} / 5
                    </p>
                </div>
                <div className="min-w-0 rounded-xl border border-zinc-200 bg-white px-2 py-2 text-center sm:p-3">
                    <p className="text-[11px] leading-tight text-zinc-500 sm:text-xs">
                        {trans('createPost.material_total_votes', page)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-zinc-900 sm:text-sm">
                        {displayTotalVotes}
                    </p>
                </div>
                <div className="min-w-0 rounded-xl border border-zinc-200 bg-white px-2 py-2 text-center sm:p-3">
                    <p className="text-[11px] leading-tight text-zinc-500 sm:text-xs">
                        {trans('createPost.material_feedback_count', page)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-zinc-900 sm:text-sm">
                        {displayFeedbackCount}
                    </p>
                </div>
            </div>

            {ratingMessage ? (
                <p className="text-center text-xs text-zinc-500">
                    {ratingMessage}
                </p>
            ) : null}
        </div>
    );
}

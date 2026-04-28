type LearningTrendsEmptyStateProps = {
    message: string;
};

export function LearningTrendsEmptyState({
    message,
}: LearningTrendsEmptyStateProps) {
    return (
        <div className="border border-dashed border-zinc-300 bg-white px-6 py-16 text-center text-3xl text-zinc-500">
            <p>{message}</p>
        </div>
    );
}

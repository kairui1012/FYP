import { TrendingUp } from 'lucide-react';

type LearningTrendsEmptyStateProps = {
    message: string;
};

export function LearningTrendsEmptyState({ message }: LearningTrendsEmptyStateProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-rose-200 bg-linear-to-br from-rose-50 via-white to-sky-50 px-5 py-12 text-center md:px-8 md:py-14">
            <div className="mx-auto flex max-w-lg flex-col items-center">
                <div className="relative mb-5 h-20 w-28">
                    <div className="absolute top-0 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-rose-100">
                        <TrendingUp className="h-7 w-7 text-[#e27193]" />
                    </div>
                    <div className="absolute bottom-0 left-3 h-10 w-10 rounded-full bg-sky-100 ring-4 ring-white" />
                    <div className="absolute right-3 bottom-0 h-10 w-10 rounded-full bg-amber-100 ring-4 ring-white" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900">{message}</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
                    Check back soon — trending posts will appear here.
                </p>
            </div>
        </div>
    );
}

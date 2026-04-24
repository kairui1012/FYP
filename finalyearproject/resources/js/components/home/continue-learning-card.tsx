type ContinueLearningItem = {
    post_id: number;
    title: string;
    subject_name: string | null;
} | null;

type ContinueLearningCardProps = {
    item: ContinueLearningItem;
    text: {
        continueLearningHeading: string;
        continueLearningEmpty: string;
        resumeWith: string;
        continueNow: string;
    };
    onContinue: (postId: number) => void;
};

export function ContinueLearningCard({ item, text, onContinue }: ContinueLearningCardProps) {
    return (
        <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-linear-to-br from-[#fff7f3] via-white to-[#fff1f6] p-6 shadow-[0_24px_70px_-32px_rgba(225,113,147,0.45)] ring-1 ring-[#f3d9e2] lg:col-span-2">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-r from-[#ffd8b8]/60 via-[#ffd3e1]/50 to-[#f6d2ff]/30 blur-2xl" />
            <div className="relative">
                <div className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b85f7b] shadow-sm backdrop-blur">
                    {text.continueLearningHeading}
                </div>
                {item ? (
                    <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-[#c06a85]">
                                {item.subject_name ?? text.continueLearningHeading}
                            </p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                                {item.title}
                            </h2>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
                                {text.resumeWith} {item.title}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#e27193] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-18px_rgba(226,113,147,0.9)] transition hover:-translate-y-0.5 hover:bg-[#cf6385]"
                            onClick={() => onContinue(item.post_id)}
                        >
                            {text.continueNow}
                        </button>
                    </div>
                ) : (
                    <div className="mt-5 rounded-3xl border border-dashed border-[#eac6d2] bg-white/70 p-5">
                        <p className="text-sm leading-6 text-zinc-600">
                            {text.continueLearningEmpty}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

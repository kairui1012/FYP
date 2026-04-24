type RecommendedMaterial = {
    post_id: number;
    lesson_id: number;
    subject_name: string | null;
    title: string;
    reason: string;
};

type RecommendedMaterialsCardProps = {
    materials: RecommendedMaterial[];
    text: {
        recommendedMaterials: string;
        noRecommendation: string;
        continueNow: string;
    };
    onOpenMaterial: (postId: number) => void;
};

export function RecommendedMaterialsCard({
    materials,
    text,
    onOpenMaterial,
}: RecommendedMaterialsCardProps) {
    return (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {text.recommendedMaterials}
            </p>
            {materials.length > 0 ? (
                <ul className="mt-3 space-y-2">
                    {materials.map((material) => (
                        <li key={material.lesson_id}>
                            <button
                                type="button"
                                onClick={() => onOpenMaterial(material.post_id)}
                                className="w-full rounded-lg bg-zinc-50 p-3 text-left transition hover:-translate-y-px hover:bg-zinc-100 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                            >
                                <p className="font-semibold text-zinc-900">
                                    {material.subject_name ?? material.title}
                                </p>
                                <p className="text-xs text-zinc-500">{material.reason}</p>
                                <p className="mt-1 text-xs text-zinc-600">{material.title}</p>
                                <p className="mt-1 text-xs font-medium text-[#e27193]">
                                    {text.continueNow}
                                </p>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-2 text-sm text-zinc-600">
                    {text.noRecommendation}
                </p>
            )}
        </section>
    );
}

import { Scale } from 'lucide-react';

type PointsRulesSectionProps = {
    title: string;
    note: string;
    items: string[];
};

export function PointsRulesSection({
    title,
    note,
    items,
}: PointsRulesSectionProps) {
    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                    <Scale className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{note}</p>
                </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((rule) => (
                    <div
                        key={rule}
                        className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700"
                    >
                        {rule}
                    </div>
                ))}
            </div>
        </section>
    );
}

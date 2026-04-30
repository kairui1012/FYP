import { CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';

type RuleSectionProps = {
    icon: ReactNode;
    title: string;
    summary: string;
    items: string[];
};

export function RuleSection({ icon, title, summary, items }: RuleSectionProps) {
    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{summary}</p>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                {items.map((item) => (
                    <div
                        key={item}
                        className="flex gap-3 text-sm leading-6 text-zinc-700"
                    >
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                        <p>{item}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

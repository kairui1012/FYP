import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type InsightsSectionCardProps = {
    title: string;
    description?: string;
    badgeLabel: string;
    accent: 'rose' | 'amber';
    children: ReactNode;
};

const accentClasses = {
    rose: {
        wrapper:
            'border-2 border-rose-200 bg-linear-to-br from-rose-50 via-white to-pink-50',
        badge: 'border border-rose-200 bg-white text-rose-700',
    },
    amber: {
        wrapper:
            'border-2 border-amber-200 bg-linear-to-br from-amber-50 via-white to-yellow-50',
        badge: 'border border-amber-200 bg-white text-amber-700',
    },
};

export function InsightsSectionCard({
    title,
    description,
    badgeLabel,
    accent,
    children,
}: InsightsSectionCardProps) {
    const tone = accentClasses[accent];

    return (
        <section className={cn('rounded-2xl p-5 shadow-sm', tone.wrapper)}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold text-zinc-900">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-1 text-sm text-zinc-500">
                            {description}
                        </p>
                    ) : null}
                </div>
                <span
                    className={cn(
                        'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                        tone.badge,
                    )}
                >
                    {badgeLabel}
                </span>
            </div>

            <div className="mt-4 rounded-2xl border-2 border-white/80 bg-white/90 p-1 shadow-sm">
                {children}
            </div>
        </section>
    );
}

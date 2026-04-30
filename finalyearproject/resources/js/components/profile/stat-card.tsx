import { cn } from '@/lib/utils';

export function StatCard({
    label,
    value,
    accent,
}: {
    label: string;
    value: number | string;
    accent?: string;
}) {
    return (
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <span className={cn('text-xl font-bold', accent ?? 'text-zinc-900 dark:text-zinc-100')}>
                {value}
            </span>
            <span className="mt-0.5 text-xs text-zinc-500">{label}</span>
        </div>
    );
}

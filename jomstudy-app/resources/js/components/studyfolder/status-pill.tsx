import type { ReactNode } from 'react';

type StatusPillProps = {
    icon: ReactNode;
    label: string;
    value: number | string;
};

export function StatusPill({ icon, label, value }: StatusPillProps) {
    return (
        <div className="inline-flex items-center gap-1.5 text-sm">
            <span className="inline-flex items-center text-zinc-500">
                {icon}
            </span>
            <span className="text-xs font-medium text-zinc-500">{label}</span>
            <span className="text-sm font-semibold text-zinc-900">{value}</span>
        </div>
    );
}

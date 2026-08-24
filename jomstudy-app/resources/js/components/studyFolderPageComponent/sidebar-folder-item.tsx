import type { ReactNode } from 'react';
import type { FolderButtonTone } from '@/components/ts/features/study-folder/study-folder-types';
import { pinkFolderButtonClass } from '@/components/ts/features/study-folder/study-folder-utils';
import { cn } from '@/lib/common-helpers';

type SidebarFolderItemProps = {
    active: boolean;
    icon: ReactNode;
    label: string;
    count?: number;
    tone?: FolderButtonTone;
    compact?: boolean;
    onClick: () => void;
};

export function SidebarFolderItem({
    active,
    icon,
    label,
    count,
    tone = 'default',
    compact = false,
    onClick,
}: SidebarFolderItemProps) {
    const toneClass =
        tone === 'correct'
            ? active
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'text-emerald-700 hover:bg-emerald-50'
            : tone === 'wrong'
              ? active
                  ? 'border border-rose-200 bg-rose-50 text-rose-800'
                  : 'text-rose-700 hover:bg-rose-50'
              : tone === 'quiz'
                ? active
                    ? 'border border-zinc-300 bg-zinc-100 text-zinc-900'
                    : 'text-zinc-700 hover:bg-zinc-50'
                : active
                  ? 'border border-zinc-300 bg-zinc-100 text-zinc-900'
                  : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900';

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                pinkFolderButtonClass,
                compact
                    ? 'w-full justify-between rounded-md border-0 bg-transparent px-2 py-1.5 text-[13px]'
                    : 'w-full justify-between rounded-md border-0 bg-transparent px-2.5 py-2 text-sm',
                toneClass,
            )}
        >
            <span className="inline-flex min-w-0 items-center gap-2">
                {icon}
                <span className="truncate">{label}</span>
            </span>
            {typeof count === 'number' ? (
                <span
                    className={cn(
                        'rounded px-1 py-0.5 text-[11px] font-semibold',
                        tone === 'correct'
                            ? active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-emerald-100 text-emerald-700'
                            : tone === 'wrong'
                              ? active
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-rose-100 text-rose-700'
                              : tone === 'quiz'
                                ? active
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-blue-100 text-blue-700'
                                : active
                                  ? 'bg-white/60 text-zinc-900'
                                  : 'bg-zinc-200 text-zinc-700',
                    )}
                >
                    {count}
                </span>
            ) : null}
        </button>
    );
}

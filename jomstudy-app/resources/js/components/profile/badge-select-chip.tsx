import { reactLang } from '@erag/lang-sync-inertia';
import { Check } from 'lucide-react';
import { getTranslatedBadgeName } from '@/lib/badge-translations';
import { cn } from '@/lib/utils';
import { BadgeIcon } from './badge-icon';
import type { Badge } from './types';

export function BadgeSelectChip({
    badge,
    selected,
    disabled,
    onToggle,
}: {
    badge: Badge;
    selected: boolean;
    disabled: boolean;
    onToggle: () => void;
}) {
    const { trans } = reactLang();

    return (
        <button
            type="button"
            disabled={disabled && !selected}
            onClick={onToggle}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                selected
                    ? 'border-amber-300 bg-linear-to-r from-amber-50 to-yellow-50 text-amber-800 shadow-sm hover:border-amber-400 dark:border-amber-700 dark:from-amber-950/40 dark:text-amber-300'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
                disabled && !selected && 'cursor-not-allowed opacity-40',
            )}
        >
            {selected && <Check className="h-3 w-3 shrink-0 text-amber-600" />}
            <BadgeIcon
                iconKey={badge.icon}
                className={cn('h-3 w-3 shrink-0', selected ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500')}
            />
            <span>{getTranslatedBadgeName(trans, badge)}</span>
        </button>
    );
}

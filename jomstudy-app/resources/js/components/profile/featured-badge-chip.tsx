import { reactLang } from '@erag/lang-sync-inertia';
import { useState } from 'react';
import { getTranslatedBadgeDescription, getTranslatedBadgeName } from '@/lib/badge-translations';
import { BadgeIcon } from './badge-icon';
import type { Badge } from './types';

export function FeaturedBadgeChip({ badge }: { badge: Badge }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const { trans } = reactLang();

    return (
        <span
            className="relative inline-flex cursor-default items-center gap-1.5 rounded-full border border-amber-300 bg-linear-to-r from-amber-50 to-yellow-50 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-sm transition hover:border-amber-400 hover:shadow-amber-100 dark:border-amber-700 dark:from-amber-950/40 dark:to-yellow-950/30 dark:text-amber-300"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <BadgeIcon iconKey={badge.icon} className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span>{getTranslatedBadgeName(trans, badge)}</span>
            {showTooltip && (
                <span className="absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-52 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {getTranslatedBadgeDescription(trans, badge)}
                </span>
            )}
        </span>
    );
}

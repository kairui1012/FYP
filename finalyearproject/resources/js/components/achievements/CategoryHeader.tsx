import { reactLang } from '@erag/lang-sync-inertia';
import { cn } from '@/lib/utils';
import { CATEGORY_CONFIG } from './constants';
import type { AchievementItem } from './types';

type Props = {
    cat: string;
    items: AchievementItem[];
    earnedInCat: number;
};

export function CategoryHeader({ cat, items, earnedInCat }: Props) {
    const { trans } = reactLang();
    const cfg = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.community;
    const total = items.length;

    return (
        <div className="flex items-center gap-3">
            <cfg.Icon className={cn('h-4.5 w-4.5 shrink-0', cfg.iconColor)} aria-hidden />
            <h3 className={cn('text-base font-bold', cfg.textAccent)}>
                {trans(cfg.labelKey)}
            </h3>
            <span
                className={cn(
                    'ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    earnedInCat === total
                        ? [cfg.iconBg, cfg.iconColor]
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800',
                )}
            >
                {earnedInCat} / {total}
            </span>
        </div>
    );
}

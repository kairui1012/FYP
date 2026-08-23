import { reactLang } from '@erag/lang-sync-inertia';
import { cn } from '@/lib/utils';
import { CATEGORY_CONFIG } from './constants';

type Props = {
    presentCategories: string[];
    activeFilter: string;
    onFilterChange: (cat: string) => void;
};

export function CategoryFilterTabs({ presentCategories, activeFilter, onFilterChange }: Props) {
    const { trans } = reactLang();

    return (
        <div className="flex flex-wrap gap-2">
            <button
                type="button"
                onClick={() => onFilterChange('all')}
                className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-semibold transition',
                    activeFilter === 'all'
                        ? 'border-zinc-800 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-900'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
                )}
            >
                {trans('achievement.filter_all')}
            </button>
            {presentCategories.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const isActive = activeFilter === cat;
                return (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => onFilterChange(cat)}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                            isActive
                                ? [cfg.border, cfg.badgeBg, cfg.textAccent]
                                : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900',
                        )}
                    >
                        <cfg.Icon className="h-3.5 w-3.5 shrink-0" />
                        {trans(cfg.labelKey)}
                    </button>
                );
            })}
        </div>
    );
}

import { reactLang } from '@erag/lang-sync-inertia';
import { useState } from 'react';
import { AchievementCard } from '@/components/achievementsPageComponent/achievement-card';
import {
    CATEGORY_CONFIG,
    CATEGORY_ORDER,
} from '@/components/ts/features/achievements/achievement-config';
import type { AchievementItem } from '@/components/ts/features/achievements/achievement-types';
import { cn } from '@/lib/common-helpers';

type AchievementCategoryBrowserProps = {
    achievements: AchievementItem[];
};

export function AchievementCategoryBrowser({
    achievements,
}: AchievementCategoryBrowserProps) {
    const { trans } = reactLang();
    const [activeCategory, setActiveCategory] = useState('all');
    const categories = CATEGORY_ORDER.filter((category) =>
        achievements.some((achievement) => achievement.category === category),
    );
    const visibleCategories =
        activeCategory === 'all'
            ? categories
            : categories.filter((category) => category === activeCategory);

    return (
        <>
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={cn(
                        'rounded-full border px-4 py-1.5 text-sm font-semibold transition',
                        activeCategory === 'all'
                            ? 'border-zinc-800 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-900'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
                    )}
                >
                    {trans('achievement.filter_all')}
                </button>
                {categories.map((category) => {
                    const config = CATEGORY_CONFIG[category];
                    const isActive = activeCategory === category;

                    return (
                        <button
                            key={category}
                            type="button"
                            onClick={() => setActiveCategory(category)}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                                isActive
                                    ? [
                                          config.border,
                                          config.badgeBg,
                                          config.textAccent,
                                      ]
                                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900',
                            )}
                        >
                            <config.Icon className="h-3.5 w-3.5 shrink-0" />
                            {trans(config.labelKey)}
                        </button>
                    );
                })}
            </div>
            <section className="space-y-8">
                {visibleCategories.map((category) => {
                    const items = achievements.filter(
                        (achievement) => achievement.category === category,
                    );
                    const earnedCount = items.filter(
                        (item) => item.achieved,
                    ).length;
                    const config =
                        CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.community;

                    return (
                        <div key={category} className="space-y-3">
                            <div className="flex items-center gap-3">
                                <config.Icon
                                    className={cn(
                                        'h-4.5 w-4.5 shrink-0',
                                        config.iconColor,
                                    )}
                                    aria-hidden
                                />
                                <h3
                                    className={cn(
                                        'text-base font-bold',
                                        config.textAccent,
                                    )}
                                >
                                    {trans(config.labelKey)}
                                </h3>
                                <span
                                    className={cn(
                                        'ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                        earnedCount === items.length
                                            ? [config.iconBg, config.iconColor]
                                            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800',
                                    )}
                                >
                                    {earnedCount} / {items.length}
                                </span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {items.map((item) => (
                                    <AchievementCard
                                        key={item.key}
                                        item={item}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </section>
        </>
    );
}

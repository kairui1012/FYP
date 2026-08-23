import { reactLang } from '@erag/lang-sync-inertia';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { AchievementCard } from '@/components/achievements/achievement-card';
import { AchievementProgressOverview } from '@/components/achievements/achievement-progress-overview';
import {
    CATEGORY_CONFIG,
    CATEGORY_ORDER,
    HIDDEN_ACHIEVEMENT_KEYS,
} from '@/component-new/config/achievement-config';
import { PointsBadgeList } from '@/components/achievements/points-badge-list';
import { QuizAccuracySummary } from '@/components/achievements/quiz-accuracy-summary';
import { AchievementSummary } from '@/components/achievements/achievement-summary';
import type { PageProps } from '@/components/achievements/types';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import AppLayout from '@/layouts/app-layout';
import { getTranslatedBadgeName } from '@/lib/badge-translations';
import { cn } from '@/lib/utils';
import { achievements as achievementsRoute } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Achievements', href: achievementsRoute() },
];

export default function AchievementsPage() {
    const { trans } = reactLang();
    const { summary, badges, next_badge, achievements, user_progress } =
        usePage<PageProps>().props;

    // Achievement totals are computed server-side, so re-fetch on focus to pick
    // up progress earned elsewhere (posting, liking, following, etc.).
    useRefreshOnFocus();

    const [activeFilter, setActiveFilter] = useState('all');

    const visibleAchievements = achievements.filter(
        (achievement) => !HIDDEN_ACHIEVEMENT_KEYS.has(achievement.key),
    );
    const earnedCount = visibleAchievements.filter((a) => a.achieved).length;
    const totalCount = visibleAchievements.length;
    const earnedBadges = badges.filter((b) => b.earned);

    const presentCategories = CATEGORY_ORDER.filter((cat) =>
        visibleAchievements.some((a) => a.category === cat),
    );

    const grouped = CATEGORY_ORDER.reduce<Record<string, typeof achievements>>(
        (acc, cat) => {
            acc[cat] = visibleAchievements.filter((a) => a.category === cat);
            return acc;
        },
        {},
    );

    const displayCategories =
        activeFilter === 'all'
            ? presentCategories
            : presentCategories.filter((c) => c === activeFilter);

    return (
        <>
            <Head title={trans('navigation.achievements')} />

            <div className="w-full max-w-none px-4 pt-6 pb-24 md:px-6 md:pt-8">
                <div className="mx-auto w-full max-w-5xl space-y-8">
                    <AchievementProgressOverview
                        earnedCount={earnedCount}
                        totalCount={totalCount}
                    />

                    <AchievementSummary
                        summary={summary}
                        quizzesCompleted={user_progress?.quizzes_completed ?? 0}
                    />

                    {next_badge &&
                        !HIDDEN_ACHIEVEMENT_KEYS.has(next_badge.key) &&
                        (() => {
                            const pointsNeeded = Math.max(
                                next_badge.points_required - summary.points,
                                0,
                            );
                            const progressPercentage = Math.min(
                                100,
                                Math.round(
                                    (summary.points /
                                        next_badge.points_required) *
                                        100,
                                ),
                            );

                            return (
                                <section className="rounded-2xl bg-linear-to-r from-zinc-900 to-zinc-800 px-5 py-4 text-zinc-100 shadow">
                                    <p className="text-xs tracking-wide text-zinc-400 uppercase">
                                        {trans('achievement.next_badge')}
                                    </p>
                                    <div className="mt-1.5 flex items-center justify-between gap-4">
                                        <p className="font-semibold">
                                            {getTranslatedBadgeName(
                                                trans,
                                                next_badge,
                                            )}
                                        </p>
                                        <p className="shrink-0 text-sm text-amber-400">
                                            {pointsNeeded}{' '}
                                            {trans(
                                                'achievement.points_to_unlock',
                                            )}
                                        </p>
                                    </div>
                                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                                        <div
                                            className="h-full rounded-full bg-linear-to-r from-amber-400 to-yellow-400 transition-all duration-700"
                                            style={{
                                                width: `${progressPercentage}%`,
                                            }}
                                        />
                                    </div>
                                </section>
                            );
                        })()}

                    {user_progress && (
                        <QuizAccuracySummary userProgress={user_progress} />
                    )}

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveFilter('all')}
                            className={cn(
                                'rounded-full border px-4 py-1.5 text-sm font-semibold transition',
                                activeFilter === 'all'
                                    ? 'border-zinc-800 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-900'
                                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
                            )}
                        >
                            {trans('achievement.filter_all')}
                        </button>
                        {presentCategories.map((category) => {
                            const config = CATEGORY_CONFIG[category];
                            const isActive = activeFilter === category;

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setActiveFilter(category)}
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
                        {displayCategories.map((category) => {
                            const items = grouped[category] ?? [];
                            if (items.length === 0) return null;

                            const earnedInCategory = items.filter(
                                (item) => item.achieved,
                            ).length;
                            const config =
                                CATEGORY_CONFIG[category] ??
                                CATEGORY_CONFIG.community;

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
                                                earnedInCategory ===
                                                    items.length
                                                    ? [
                                                          config.iconBg,
                                                          config.iconColor,
                                                      ]
                                                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800',
                                            )}
                                        >
                                            {earnedInCategory} / {items.length}
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

                    <PointsBadgeList
                        badges={badges}
                        earnedBadges={earnedBadges}
                    />
                </div>
            </div>
        </>
    );
}

AchievementsPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

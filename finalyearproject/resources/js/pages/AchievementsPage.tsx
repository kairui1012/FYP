import { reactLang } from '@erag/lang-sync-inertia';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { AchievementsHero } from '@/components/achievements/AchievementsHero';
import { AchievementsSection } from '@/components/achievements/AchievementsSection';
import { CategoryFilterTabs } from '@/components/achievements/CategoryFilterTabs';
import {
    CATEGORY_ORDER,
    HIDDEN_ACHIEVEMENT_KEYS,
} from '@/components/achievements/constants';
import { NextBadgeBanner } from '@/components/achievements/NextBadgeBanner';
import { PointsBadgesSection } from '@/components/achievements/PointsBadgesSection';
import { QuizAccuracyStats } from '@/components/achievements/QuizAccuracyStats';
import { SummaryStats } from '@/components/achievements/SummaryStats';
import type { PageProps } from '@/components/achievements/types';
import AppLayout from '@/layouts/app-layout';
import { achievements as achievementsRoute } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Achievements', href: achievementsRoute() },
];

export default function AchievementsPage() {
    const { trans } = reactLang();
    const { summary, badges, next_badge, achievements, user_progress } =
        usePage<PageProps>().props;

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
                    <AchievementsHero
                        earnedCount={earnedCount}
                        totalCount={totalCount}
                    />

                    <SummaryStats
                        summary={summary}
                        quizzesCompleted={user_progress?.quizzes_completed ?? 0}
                    />

                    {next_badge &&
                        !HIDDEN_ACHIEVEMENT_KEYS.has(next_badge.key) && (
                            <NextBadgeBanner
                                nextBadge={next_badge}
                                currentPoints={summary.points}
                            />
                        )}

                    {user_progress && (
                        <QuizAccuracyStats userProgress={user_progress} />
                    )}

                    <CategoryFilterTabs
                        presentCategories={presentCategories}
                        activeFilter={activeFilter}
                        onFilterChange={setActiveFilter}
                    />

                    <AchievementsSection
                        displayCategories={displayCategories}
                        grouped={grouped}
                    />

                    <PointsBadgesSection
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

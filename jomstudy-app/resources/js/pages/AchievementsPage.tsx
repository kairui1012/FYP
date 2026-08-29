import { reactLang } from '@erag/lang-sync-inertia';
import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AchievementCategoryBrowser } from '@/components/achievementsPageComponent/achievement-category-browser';
import { AchievementProgressOverview } from '@/components/achievementsPageComponent/achievement-progress-overview';
import { AchievementSummary } from '@/components/achievementsPageComponent/achievement-summary';
import { NextAchievementBadgeProgress } from '@/components/achievementsPageComponent/next-achievement-badge-progress';
import { PointsBadgeList } from '@/components/achievementsPageComponent/points-badge-list';
import { QuizAccuracySummary } from '@/components/achievementsPageComponent/quiz-accuracy-summary';
import { HIDDEN_ACHIEVEMENT_KEYS } from '@/components/ts/features/achievements/achievement-config';
import type { PageProps } from '@/components/ts/features/achievements/achievement-types';
import { usePageRefreshOnFocus } from '@/hooks/use-page-refresh-on-focus';
import AppLayout from '@/layouts/app-layout';
import { index as achievementsRoute } from '@/routes/achievements';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Achievements', href: achievementsRoute() },
];

export default function AchievementsPage() {
    const { trans } = reactLang();
    const { summary, badges, next_badge, achievements, user_progress } =
        usePage<PageProps>().props;
    const visibleAchievements = achievements.filter(
        (achievement) => !HIDDEN_ACHIEVEMENT_KEYS.has(achievement.key),
    );
    const nextBadge =
        next_badge && !HIDDEN_ACHIEVEMENT_KEYS.has(next_badge.key)
            ? next_badge
            : null;

    usePageRefreshOnFocus();

    return (
        <>
            <Head title={trans('navigation.achievements')} />
            <div className="w-full max-w-none px-4 pt-6 pb-24 md:px-6 md:pt-8">
                <div className="mx-auto w-full max-w-5xl space-y-8">
                    <AchievementProgressOverview
                        achievements={visibleAchievements}
                    />
                    <AchievementSummary
                        summary={summary}
                        quizzesCompleted={user_progress?.quizzes_completed ?? 0}
                    />
                    {nextBadge && (
                        <NextAchievementBadgeProgress
                            badge={nextBadge}
                            currentPoints={summary.points}
                        />
                    )}
                    {user_progress && (
                        <QuizAccuracySummary userProgress={user_progress} />
                    )}
                    <AchievementCategoryBrowser
                        achievements={visibleAchievements}
                    />
                    <PointsBadgeList badges={badges} />
                </div>
            </div>
        </>
    );
}

AchievementsPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

import { reactLang } from '@erag/lang-sync-inertia';
import { Head, usePage } from '@inertiajs/react';
import { LeaderboardHeaderControls } from '@/components/leaderboard/leaderboard-header-controls';
import { LeaderboardPointsHistory } from '@/components/leaderboard/leaderboard-points-history';
import { LeaderboardRankingSection } from '@/components/leaderboard/leaderboard-ranking-section';
import type {
    LeaderboardPayload,
    LeaderboardUser,
    Period,
} from '@/components/leaderboard/types';
import { useLeaderboardController } from '@/components/leaderboard/use-leaderboard-controller';
import { PodiumCard } from '@/components/PodiumCard';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import AppLayout from '@/layouts/app-layout';
import { leaderboard as leaderboardRoute } from '@/routes';
import type { Auth, BreadcrumbItem } from '@/types';

type LeaderboardProps = {
    leaderboard: LeaderboardPayload;
};

export default function Leaderboard({ leaderboard }: LeaderboardProps) {
    const { trans } = reactLang();
    const { auth } = usePage<{ auth: Auth }>().props;
    const currentUserId = auth.user?.id;
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: trans('leaderboard.title'),
            href: leaderboardRoute().url,
        },
    ];

    const periodTabs: { key: Period; label: string }[] = [
        { key: 'weekly', label: trans('leaderboard.tab_weekly') },
        { key: 'monthly', label: trans('leaderboard.tab_monthly') },
        { key: 'all_time', label: trans('leaderboard.tab_all_time') },
    ];

    const controller = useLeaderboardController({
        activePeriod: leaderboard.activePeriod,
    });

    // Rankings/points are computed server-side and change when others like or
    // follow you, so re-fetch on focus to keep standings current.
    useRefreshOnFocus();

    const isCurrentUser = (user: LeaderboardUser) => user.id === currentUserId;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-zinc-50 pb-10">
                <Head title={trans('leaderboard.title')} />

                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
                    <LeaderboardHeaderControls
                        activePeriod={leaderboard.activePeriod}
                        currentUser={leaderboard.currentUser}
                        periodTabs={periodTabs}
                        trans={trans}
                        onVisitPeriod={controller.visitPeriod}
                        onToggleVisibility={controller.toggleVisibility}
                        onToggleTitleBadge={controller.toggleTitleBadge}
                    />

                    {leaderboard.podium.length > 0 ? (
                        <section className="mx-auto grid w-full max-w-4xl grid-cols-1 items-end gap-3 md:grid-cols-3">
                            {leaderboard.podium.map((user) => (
                                <PodiumCard
                                    key={user.rank}
                                    user={user}
                                    isCurrentUser={isCurrentUser(user)}
                                    rankLabel={trans('leaderboard.rank')}
                                    pointsLabel={trans('leaderboard.points')}
                                    anonymousUserLabel={trans(
                                        'leaderboard.anonymous_user',
                                    )}
                                    currentUserLabel={trans(
                                        'leaderboard.current_user',
                                    )}
                                />
                            ))}
                        </section>
                    ) : null}

                    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_300px]">
                        <LeaderboardRankingSection
                            rows={leaderboard.rows}
                            trans={trans}
                            isCurrentUser={isCurrentUser}
                            onVisitPage={controller.visitPage}
                        />

                        {currentUserId ? (
                            <LeaderboardPointsHistory
                                pointsHistory={leaderboard.pointsHistory}
                                trans={trans}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

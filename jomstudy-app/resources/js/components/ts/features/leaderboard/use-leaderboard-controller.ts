import { router } from '@inertiajs/react';
import { leaderboard as leaderboardRoute } from '@/routes';
import type { Period } from './leaderboard-types';

type UseLeaderboardControllerParams = {
    activePeriod: Period;
};

export function useLeaderboardController({
    activePeriod,
}: UseLeaderboardControllerParams) {
    const toggleVisibility = () => {
        router.post(
            '/leaderboard/toggle-visibility',
            {},
            { preserveScroll: true },
        );
    };

    const toggleTitleBadge = () => {
        router.post(
            '/leaderboard/toggle-title-badge',
            {},
            { preserveScroll: true },
        );
    };

    const visitPeriod = (period: Period) => {
        router.get(
            leaderboardRoute().url,
            { period },
            { preserveScroll: true, preserveState: true },
        );
    };

    const visitPage = (page: number) => {
        router.get(
            leaderboardRoute().url,
            { period: activePeriod, page },
            { preserveScroll: true, preserveState: true },
        );
    };

    return {
        toggleVisibility,
        toggleTitleBadge,
        visitPeriod,
        visitPage,
    };
}

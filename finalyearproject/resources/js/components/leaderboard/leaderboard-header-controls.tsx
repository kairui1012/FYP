import { Award, Eye, EyeOff } from 'lucide-react';
import type { CurrentUserRank, Period } from './types';

type LeaderboardHeaderControlsProps = {
    activePeriod: Period;
    currentUser: CurrentUserRank | null;
    periodTabs: { key: Period; label: string }[];
    trans: (key: string) => string;
    onVisitPeriod: (period: Period) => void;
    onToggleVisibility: () => void;
    onToggleTitleBadge: () => void;
};

export function LeaderboardHeaderControls({
    activePeriod,
    currentUser,
    periodTabs,
    trans,
    onVisitPeriod,
    onToggleVisibility,
    onToggleTitleBadge,
}: LeaderboardHeaderControlsProps) {
    return (
        <>
            <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-zinc-950 md:text-3xl">
                        {trans('leaderboard.title')}
                    </h1>
                    <p className="max-w-2xl text-sm leading-6 text-zinc-600 md:text-base">
                        {trans('leaderboard.subtitle')}
                    </p>
                </div>

                <div className="inline-flex w-full rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-zinc-200 md:w-auto">
                    {periodTabs.map((tab) => {
                        const isActive = activePeriod === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => onVisitPeriod(tab.key)}
                                className={`min-h-9 flex-1 rounded-full px-4 text-sm font-medium transition md:flex-none ${
                                    isActive
                                        ? 'bg-[#e27193] text-white shadow-sm'
                                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </header>

            {currentUser ? (
                <div className="sticky top-3 z-20 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-zinc-950">
                                    {trans('leaderboard.your_rank')}{' '}
                                    <span>#{currentUser.rank}</span>
                                </p>
                                {currentUser.isAnonymous ? (
                                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">
                                        {trans('leaderboard.anonymous_status')}
                                    </span>
                                ) : null}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                                <span>
                                    {trans('leaderboard.points')}:{' '}
                                    <span className="font-medium text-zinc-800">
                                        {currentUser.points}
                                    </span>
                                </span>
                                {currentUser.pointsToNext !== null ? (
                                    <span>
                                        {trans('leaderboard.points_to_next')}:{' '}
                                        <span className="font-medium text-zinc-800">
                                            {currentUser.pointsToNext}
                                        </span>
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={onToggleVisibility}
                                className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium ring-1 transition ${
                                    currentUser.isAnonymous
                                        ? 'bg-[#e27193] text-white  hover:bg-[#f78faf]'
                                        : 'bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50'
                                }`}
                            >
                                {currentUser.isAnonymous ? (
                                    <>
                                        <Eye className="h-4 w-4" />
                                        {trans('leaderboard.show_my_rank')}
                                    </>
                                ) : (
                                    <>
                                        <EyeOff className="h-4 w-4" />
                                        {trans('leaderboard.hide_my_rank')}
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                role="switch"
                                aria-checked={currentUser.showLeaderboardBadge}
                                onClick={onToggleTitleBadge}
                                className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium ring-1 transition ${
                                    currentUser.showLeaderboardBadge
                                        ? 'bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100'
                                        : 'bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50'
                                }`}
                            >
                                <Award className="h-4 w-4" />
                                {trans('leaderboard.title_badge_label')}
                                <span className="text-xs font-semibold opacity-70">
                                    {currentUser.showLeaderboardBadge
                                        ? trans('leaderboard.setting_on')
                                        : trans('leaderboard.setting_off')}
                                </span>
                            </button>
                        </div>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                        {trans('leaderboard.title_badge_description')}
                    </p>
                </div>
            ) : null}
        </>
    );
}

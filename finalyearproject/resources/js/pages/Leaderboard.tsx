import { reactLang } from '@erag/lang-sync-inertia';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Award,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { LeaderboardRow } from '@/components/LeaderboardRow';
import { PodiumCard } from '@/components/PodiumCard';
import AppLayout from '@/layouts/app-layout';
import { leaderboard as leaderboardRoute } from '@/routes';
import type { Auth, BreadcrumbItem } from '@/types';

type Period = 'all_time' | 'weekly' | 'monthly';

type LeaderboardUser = {
    id: number;
    name: string;
    avatar: string | null;
    points: number;
    rank: number;
    is_anonymous: boolean;
    leaderboard_title?: string | null;
};

type CurrentUserRank = {
    rank: number | null;
    points: number;
    pointsToNext: number | null;
    isAnonymous: boolean;
    showLeaderboardBadge: boolean;
};

type PointsHistoryEntry = {
    points: number;
    action: string;
    created_at: string;
};

type PaginatedRows = {
    data: LeaderboardUser[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    from: number | null;
    to: number | null;
    total: number;
};

type LeaderboardProps = {
    leaderboard: {
        activePeriod: Period;
        periods: Period[];
        podium: LeaderboardUser[];
        rows: PaginatedRows;
        currentUser: CurrentUserRank | null;
        pointsHistory: PointsHistoryEntry[];
    };
};

const ACTION_TRANSLATION_KEYS: Record<string, string> = {
    question_asked: 'leaderboard.action_question_asked',
    answer_posted: 'leaderboard.action_answer_posted',
    question_upvoted: 'leaderboard.action_question_upvoted',
    answer_upvoted: 'leaderboard.action_answer_upvoted',
    best_answer_marked: 'leaderboard.action_best_answer_marked',
    resource_uploaded: 'leaderboard.action_resource_uploaded',
    resource_bookmarked: 'leaderboard.action_resource_bookmarked',
    follower_gained: 'leaderboard.action_follower_gained',
    content_downvoted: 'leaderboard.action_content_downvoted',
};

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

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
            { period: leaderboard.activePeriod, page },
            { preserveScroll: true, preserveState: true },
        );
    };

    const isCurrentUser = (user: LeaderboardUser) => user.id === currentUserId;

    const translateAction = (action: string) =>
        ACTION_TRANSLATION_KEYS[action]
            ? trans(ACTION_TRANSLATION_KEYS[action])
            : action;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-zinc-50 pb-10">
                <Head title={trans('leaderboard.title')} />

                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
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
                                const isActive =
                                    leaderboard.activePeriod === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => visitPeriod(tab.key)}
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

                    {leaderboard.currentUser ? (
                        <div className="sticky top-3 z-20 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-zinc-950">
                                            {trans('leaderboard.your_rank')}{' '}
                                            <span>
                                                #{leaderboard.currentUser.rank}
                                            </span>
                                        </p>
                                        {leaderboard.currentUser.isAnonymous ? (
                                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">
                                                {trans(
                                                    'leaderboard.anonymous_status',
                                                )}
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                                        <span>
                                            {trans('leaderboard.points')}:{' '}
                                            <span className="font-medium text-zinc-800">
                                                {leaderboard.currentUser.points}
                                            </span>
                                        </span>
                                        {leaderboard.currentUser
                                            .pointsToNext !== null ? (
                                            <span>
                                                {trans(
                                                    'leaderboard.points_to_next',
                                                )}
                                                :{' '}
                                                <span className="font-medium text-zinc-800">
                                                    {
                                                        leaderboard.currentUser
                                                            .pointsToNext
                                                    }
                                                </span>
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={toggleVisibility}
                                        className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium ring-1 transition ${
                                            leaderboard.currentUser.isAnonymous
                                                ? 'bg-[#e27193] text-white  hover:bg-[#f78faf]'
                                                : 'bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50'
                                        }`}
                                    >
                                        {leaderboard.currentUser.isAnonymous ? (
                                            <>
                                                <Eye className="h-4 w-4" />
                                                {trans(
                                                    'leaderboard.show_my_rank',
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <EyeOff className="h-4 w-4" />
                                                {trans(
                                                    'leaderboard.hide_my_rank',
                                                )}
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={
                                            leaderboard.currentUser
                                                .showLeaderboardBadge
                                        }
                                        onClick={toggleTitleBadge}
                                        className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium ring-1 transition ${
                                            leaderboard.currentUser
                                                .showLeaderboardBadge
                                                ? 'bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100'
                                                : 'bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50'
                                        }`}
                                    >
                                        <Award className="h-4 w-4" />
                                        {trans('leaderboard.title_badge_label')}
                                        <span className="text-xs font-semibold opacity-70">
                                            {leaderboard.currentUser
                                                .showLeaderboardBadge
                                                ? trans(
                                                      'leaderboard.setting_on',
                                                  )
                                                : trans(
                                                      'leaderboard.setting_off',
                                                  )}
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-zinc-500">
                                {trans('leaderboard.title_badge_description')}
                            </p>
                        </div>
                    ) : null}

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
                        {/* ranking table */}
                        <section className="rounded-lg border border-zinc-200 bg-white shadow-xs">
                            <div className="grid grid-cols-[72px_1fr_96px] gap-3 border-b border-zinc-200 px-4 py-3 text-xs font-semibold text-zinc-500 uppercase md:grid-cols-[96px_1fr_140px]">
                                <span>{trans('leaderboard.rank')}</span>
                                <span>{trans('leaderboard.user')}</span>
                                <span className="text-right">
                                    {trans('leaderboard.points')}
                                </span>
                            </div>

                            {leaderboard.rows.data.length > 0 ? (
                                <div className="divide-y divide-zinc-100">
                                    {leaderboard.rows.data.map((user) => (
                                        <LeaderboardRow
                                            key={user.rank}
                                            user={user}
                                            isCurrentUser={isCurrentUser(user)}
                                            anonymousUserLabel={trans(
                                                'leaderboard.anonymous_user',
                                            )}
                                            currentUserLabel={trans(
                                                'leaderboard.current_user',
                                            )}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="px-4 py-12 text-center text-sm text-zinc-500">
                                    {trans('leaderboard.no_users')}
                                </div>
                            )}

                            {leaderboard.rows.last_page > 1 ? (
                                <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            visitPage(
                                                leaderboard.rows.current_page -
                                                    1,
                                            )
                                        }
                                        disabled={
                                            !leaderboard.rows.prev_page_url
                                        }
                                        className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        {trans('leaderboard.previous')}
                                    </button>

                                    <span className="text-sm font-medium text-zinc-600">
                                        {leaderboard.rows.current_page} /{' '}
                                        {leaderboard.rows.last_page}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            visitPage(
                                                leaderboard.rows.current_page +
                                                    1,
                                            )
                                        }
                                        disabled={
                                            !leaderboard.rows.next_page_url
                                        }
                                        className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {trans('leaderboard.next')}
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : null}
                        </section>

                        {/* points history */}
                        {currentUserId ? (
                            <aside className="rounded-lg border border-zinc-200 bg-white shadow-xs">
                                <div className="border-b border-zinc-200 px-4 py-3">
                                    <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                                        {trans('leaderboard.points_history')}
                                    </h2>
                                </div>

                                {leaderboard.pointsHistory.length > 0 ? (
                                    <ul className="divide-y divide-zinc-100">
                                        {leaderboard.pointsHistory.map(
                                            (entry, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center justify-between gap-3 px-4 py-3"
                                                >
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        {entry.points >= 0 ? (
                                                            <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" />
                                                        ) : (
                                                            <TrendingDown className="h-4 w-4 shrink-0 text-red-400" />
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="truncate text-xs font-medium text-zinc-800">
                                                                {translateAction(
                                                                    entry.action,
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-zinc-400">
                                                                {formatDate(
                                                                    entry.created_at,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`shrink-0 text-sm font-semibold ${
                                                            entry.points >= 0
                                                                ? 'text-emerald-600'
                                                                : 'text-red-500'
                                                        }`}
                                                    >
                                                        {entry.points >= 0
                                                            ? '+'
                                                            : ''}
                                                        {entry.points}
                                                    </span>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                ) : (
                                    <div className="px-4 py-10 text-center text-sm text-zinc-400">
                                        {trans('leaderboard.no_points_history')}
                                    </div>
                                )}
                            </aside>
                        ) : null}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

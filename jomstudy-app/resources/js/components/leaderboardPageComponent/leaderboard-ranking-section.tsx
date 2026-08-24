import { ChevronLeft, ChevronRight } from 'lucide-react';
import type {
    LeaderboardUser,
    PaginatedRows,
} from '@/components/ts/features/leaderboard/leaderboard-types';
import { LeaderboardRow } from './leaderboard-row';

type LeaderboardRankingSectionProps = {
    rows: PaginatedRows;
    trans: (key: string) => string;
    isCurrentUser: (user: LeaderboardUser) => boolean;
    onVisitPage: (page: number) => void;
};

export function LeaderboardRankingSection({
    rows,
    trans,
    isCurrentUser,
    onVisitPage,
}: LeaderboardRankingSectionProps) {
    return (
        <section className="rounded-lg border border-zinc-200 bg-white shadow-xs">
            <div className="grid grid-cols-[72px_1fr_96px] gap-3 border-b border-zinc-200 px-4 py-3 text-xs font-semibold text-zinc-500 uppercase md:grid-cols-[96px_1fr_140px]">
                <span>{trans('leaderboard.rank')}</span>
                <span>{trans('leaderboard.user')}</span>
                <span className="text-right">
                    {trans('leaderboard.points')}
                </span>
            </div>

            {rows.data.length > 0 ? (
                <div className="divide-y divide-zinc-100">
                    {rows.data.map((user) => (
                        <LeaderboardRow
                            key={user.rank}
                            user={user}
                            isCurrentUser={isCurrentUser(user)}
                            anonymousUserLabel={trans(
                                'leaderboard.anonymous_user',
                            )}
                            currentUserLabel={trans('leaderboard.current_user')}
                        />
                    ))}
                </div>
            ) : (
                <div className="px-4 py-12 text-center text-sm text-zinc-500">
                    {trans('leaderboard.no_users')}
                </div>
            )}

            {rows.last_page > 1 ? (
                <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
                    <button
                        type="button"
                        onClick={() => onVisitPage(rows.current_page - 1)}
                        disabled={!rows.prev_page_url}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        {trans('leaderboard.previous')}
                    </button>

                    <span className="text-sm font-medium text-zinc-600">
                        {rows.current_page} / {rows.last_page}
                    </span>

                    <button
                        type="button"
                        onClick={() => onVisitPage(rows.current_page + 1)}
                        disabled={!rows.next_page_url}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {trans('leaderboard.next')}
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            ) : null}
        </section>
    );
}

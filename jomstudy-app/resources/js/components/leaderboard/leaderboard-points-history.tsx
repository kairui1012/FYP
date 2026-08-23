import { TrendingDown, TrendingUp } from 'lucide-react';
import type { PointsHistoryEntry } from './types';

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

function translateAction(action: string, trans: (key: string) => string) {
    return ACTION_TRANSLATION_KEYS[action]
        ? trans(ACTION_TRANSLATION_KEYS[action])
        : action;
}

type LeaderboardPointsHistoryProps = {
    pointsHistory: PointsHistoryEntry[];
    trans: (key: string) => string;
};

export function LeaderboardPointsHistory({
    pointsHistory,
    trans,
}: LeaderboardPointsHistoryProps) {
    return (
        <aside className="rounded-lg border border-zinc-200 bg-white shadow-xs">
            <div className="border-b border-zinc-200 px-4 py-3">
                <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                    {trans('leaderboard.points_history')}
                </h2>
            </div>

            {pointsHistory.length > 0 ? (
                <ul className="divide-y divide-zinc-100">
                    {pointsHistory.map((entry, i) => (
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
                                        {translateAction(entry.action, trans)}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        {formatDate(entry.created_at)}
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
                                {entry.points >= 0 ? '+' : ''}
                                {entry.points}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="px-4 py-10 text-center text-sm text-zinc-400">
                    {trans('leaderboard.no_points_history')}
                </div>
            )}
        </aside>
    );
}

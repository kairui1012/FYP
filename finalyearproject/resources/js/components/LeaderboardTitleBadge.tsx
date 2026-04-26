import { reactLang } from '@erag/lang-sync-inertia';
import { Crown, Medal, Trophy } from 'lucide-react';

export type LeaderboardTitle = 'champion' | 'runner_up' | 'third_place';

type LeaderboardTitleBadgeProps = {
    title?: LeaderboardTitle | string | null;
    className?: string;
};

const titleTone: Record<LeaderboardTitle, string> = {
    champion: 'border-amber-200 bg-amber-50 text-amber-700',
    runner_up: 'border-zinc-200 bg-zinc-50 text-zinc-700',
    third_place: 'border-orange-200 bg-orange-50 text-orange-700',
};

const titleIcon = {
    champion: Trophy,
    runner_up: Crown,
    third_place: Medal,
};

function isLeaderboardTitle(title: string): title is LeaderboardTitle {
    return (
        title === 'champion' || title === 'runner_up' || title === 'third_place'
    );
}

export function LeaderboardTitleBadge({
    title,
    className = '',
}: LeaderboardTitleBadgeProps) {
    const { trans } = reactLang();

    if (!title || !isLeaderboardTitle(title)) {
        return null;
    }

    const Icon = titleIcon[title];

    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-none font-semibold ${titleTone[title]} ${className}`}
        >
            <Icon className="h-3 w-3" />
            {trans(`leaderboard.title_${title}`)}
        </span>
    );
}

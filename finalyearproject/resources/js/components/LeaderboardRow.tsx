import { LeaderboardTitleBadge } from '@/components/LeaderboardTitleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type LeaderboardRowUser = {
    id: number;
    name: string;
    avatar: string | null;
    points: number;
    rank: number;
    leaderboard_title?: string | null;
};

type LeaderboardRowProps = {
    user: LeaderboardRowUser;
    isCurrentUser: boolean;
    currentUserLabel: string;
};

function initials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

export function LeaderboardRow({
    user,
    isCurrentUser,
    currentUserLabel,
}: LeaderboardRowProps) {
    return (
        <div
            className={`grid min-h-16 grid-cols-[72px_1fr_96px] items-center gap-3 px-4 py-3 md:grid-cols-[96px_1fr_140px] ${
                isCurrentUser ? 'bg-zinc-100' : ''
            }`}
        >
            <span className="text-sm font-semibold text-zinc-700">
                #{user.rank}
            </span>
            <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage
                        src={user.avatar ?? undefined}
                        alt={user.name}
                    />
                    <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-zinc-950">
                            {user.name}
                        </p>
                        <LeaderboardTitleBadge title={user.leaderboard_title} />
                    </div>
                    {isCurrentUser ? (
                        <p className="text-xs text-zinc-500">
                            {currentUserLabel}
                        </p>
                    ) : null}
                </div>
            </div>
            <span className="text-right text-sm font-semibold text-zinc-950">
                {user.points}
            </span>
        </div>
    );
}

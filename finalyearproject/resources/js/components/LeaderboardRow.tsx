import { router } from '@inertiajs/react';
import { LeaderboardTitleBadge } from '@/components/LeaderboardTitleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { profilePage } from '@/routes';

type LeaderboardRowUser = {
    id: number;
    name: string;
    avatar: string | null;
    points: number;
    rank: number;
    is_anonymous: boolean;
    leaderboard_title?: string | null;
};

type LeaderboardRowProps = {
    user: LeaderboardRowUser;
    isCurrentUser: boolean;
    anonymousUserLabel: string;
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
    anonymousUserLabel,
    currentUserLabel,
}: LeaderboardRowProps) {
    const handleClick = () => {
        if (user.is_anonymous) return;

        router.visit(profilePage({ user: user.id }).url);
    };

    return (
        <div
            onClick={handleClick}
            className={`grid min-h-16 grid-cols-[72px_1fr_96px] items-center gap-3 px-4 py-3 transition-colors md:grid-cols-[96px_1fr_140px] ${
                user.is_anonymous
                    ? 'cursor-default opacity-70'
                    : 'cursor-pointer hover:bg-zinc-50'
            } ${isCurrentUser ? 'bg-zinc-100 hover:bg-zinc-100' : ''}`}
        >
            <span className="text-sm font-semibold text-zinc-700">
                #{user.rank}
            </span>

            <div className="flex min-w-0 items-center gap-3">
                <Avatar
                    key={`${user.id}-${user.is_anonymous ? 'anonymous' : 'public'}-${user.avatar || 'no-avatar'}`}
                    className="h-10 w-10"
                >
                    {user.is_anonymous ? (
                        <AvatarFallback className="bg-zinc-300 text-sm font-semibold text-zinc-500">
                            ?
                        </AvatarFallback>
                    ) : (
                        <>
                            <AvatarImage
                                src={user.avatar || undefined}
                                alt={user.name}
                            />
                            <AvatarFallback>
                                {initials(user.name)}
                            </AvatarFallback>
                        </>
                    )}
                </Avatar>

                <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        {user.is_anonymous ? (
                            <span className="text-sm font-semibold text-zinc-500">
                                {anonymousUserLabel}
                            </span>
                        ) : (
                            <>
                                <p className="truncate text-sm font-medium text-zinc-950 hover:underline">
                                    {user.name}
                                </p>
                                <LeaderboardTitleBadge
                                    title={user.leaderboard_title}
                                />
                            </>
                        )}
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
import { router } from '@inertiajs/react';
import { reactLang } from '@erag/lang-sync-inertia';
import { Medal, Trophy } from 'lucide-react';
import type { LeaderboardUser } from '@/components/leaderboard/types';
import { LeaderboardTitleBadge } from '@/component-new/badge/leaderboard-title-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/component-new/ui/avatar';
import { VerifiedTeacherBadge } from '@/component-new/badge/verified-teacher-badge';
import { isVerifiedTeacher } from '@/lib/verified-teacher';
import { profilePage } from '@/routes';

type PodiumCardProps = {
    user: LeaderboardUser;
    isCurrentUser: boolean;
};

const podiumTone: Record<number, string> = {
    1: 'bg-amber-50 text-amber-950',
    2: 'bg-zinc-100 text-zinc-950',
    3: 'bg-orange-50 text-orange-950',
};

const rankBorderGradient: Record<number, string> = {
    1: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600',
    2: 'bg-gradient-to-br from-slate-300 via-gray-200 to-slate-500',
    3: 'bg-gradient-to-br from-amber-600 via-orange-400 to-amber-800',
};

function initials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

export function PodiumCard({
    user,
    isCurrentUser,
}: PodiumCardProps) {
    const { trans } = reactLang();
    const gradient =
        rankBorderGradient[user.rank] ??
        'bg-gradient-to-br from-zinc-300 to-zinc-400';
    const cardBg = podiumTone[user.rank] ?? 'bg-white text-zinc-950';
    const verifiedTeacher = isVerifiedTeacher(user);

    const handleClick = () => {
        if (user.is_anonymous) return;
        router.visit(profilePage({ user: user.id }).url);
    };

    return (
        <div
            onClick={handleClick}
            className={`rounded-xl ${gradient} ${
                isCurrentUser ? 'p-0.75' : 'p-0.5'
            } shadow-md ${user.is_anonymous ? 'cursor-default opacity-80' : 'cursor-pointer'} ${
                user.rank === 1 ? 'md:order-2' : ''
            } ${user.rank === 2 ? 'md:order-1' : ''} ${user.rank === 3 ? 'md:order-3' : ''}`}
        >
            <article
                className={`h-full rounded-[10px] p-4 ${cardBg} ${
                    user.rank === 1 ? 'md:min-h-52 md:p-5' : ''
                }`}
            >
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {user.rank === 1 ? (
                            <Trophy className="h-5 w-5" />
                        ) : (
                            <Medal className="h-5 w-5" />
                        )}
                        <span className="text-sm font-semibold">
                            {trans('leaderboard.rank')} #{user.rank}
                        </span>
                    </div>
                    <span className="text-sm font-medium">
                        {user.points} {trans('leaderboard.points')}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {user.is_anonymous ? (
                        <Avatar
                            key={`${user.id}-anon`}
                            className={
                                user.rank === 1 ? 'h-16 w-16' : 'h-12 w-12'
                            }
                        >
                            <AvatarFallback className="bg-zinc-300 text-sm font-semibold text-zinc-500">
                                ?
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <Avatar
                            key={`${user.id}-public`}
                            className={
                                user.rank === 1 ? 'h-16 w-16' : 'h-12 w-12'
                            }
                        >
                            <AvatarImage
                                src={user.avatar ?? undefined}
                                alt={user.name}
                            />
                            <AvatarFallback>
                                {initials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            {user.is_anonymous ? (
                                <span className="text-base font-semibold text-zinc-500">
                                    {trans('leaderboard.anonymous_user')}
                                </span>
                            ) : (
                                <>
                                    <p
                                        className={`truncate text-base font-semibold hover:underline ${
                                            verifiedTeacher
                                                ? 'text-blue-600'
                                                : ''
                                        }`}
                                    >
                                        {user.name}
                                    </p>
                                    {verifiedTeacher && (
                                        <VerifiedTeacherBadge />
                                    )}
                                    <LeaderboardTitleBadge
                                        title={user.leaderboard_title}
                                    />
                                </>
                            )}
                        </div>
                        {isCurrentUser ? (
                            <p className="text-xs font-medium opacity-60">
                                {trans('leaderboard.current_user')}
                            </p>
                        ) : null}
                    </div>
                </div>
            </article>
        </div>
    );
}

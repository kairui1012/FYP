import { Crown, Medal, Trophy } from 'lucide-react';

type LeaderboardTitleBadgesProps = {
    championLabel: string;
    runnerUpLabel: string;
    thirdPlaceLabel: string;
};

export function LeaderboardTitleBadges({
    championLabel,
    runnerUpLabel,
    thirdPlaceLabel,
}: LeaderboardTitleBadgesProps) {
    return (
        <section className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-5 shadow-xs md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-md bg-amber-50 px-3 py-3 text-amber-800">
                <Trophy className="h-5 w-5" />
                <span className="text-sm font-semibold">{championLabel}</span>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-zinc-100 px-3 py-3 text-zinc-700">
                <Crown className="h-5 w-5" />
                <span className="text-sm font-semibold">{runnerUpLabel}</span>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-orange-50 px-3 py-3 text-orange-800">
                <Medal className="h-5 w-5" />
                <span className="text-sm font-semibold">{thirdPlaceLabel}</span>
            </div>
        </section>
    );
}

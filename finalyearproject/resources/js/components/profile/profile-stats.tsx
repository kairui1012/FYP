import { StatCard } from './stat-card';

export function ProfileStats({
    learningBadgesCount,
    points,
    followersCount,
    labels,
}: {
    learningBadgesCount: number;
    points: number;
    followersCount: number;
    labels: {
        learningBadges: string;
        points: string;
        followers: string;
    };
}) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            <StatCard
                label={labels.learningBadges}
                value={learningBadgesCount}
                accent="text-[#de6b89]"
            />
            <StatCard label={labels.points} value={points} accent="text-amber-600" />
            <StatCard label={labels.followers} value={followersCount} accent="text-sky-600" />
        </div>
    );
}

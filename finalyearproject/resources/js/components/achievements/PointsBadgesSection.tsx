import { reactLang } from '@erag/lang-sync-inertia';
import { Sparkles } from 'lucide-react';
import { LegacyBadgeCard } from './LegacyBadgeCard';
import type { Badge } from './types';

type Props = {
    badges: Badge[];
    earnedBadges: Badge[];
};

export function PointsBadgesSection({ badges, earnedBadges }: Props) {
    const { trans } = reactLang();

    if (badges.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {trans('achievement.points_badges')}
                </h2>
                <span className="ml-auto text-sm text-zinc-500">
                    {earnedBadges.length} / {badges.length}{' '}
                    {trans('achievement.unlocked')}
                </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {badges.map((badge) => (
                    <LegacyBadgeCard key={badge.id} badge={badge} />
                ))}
            </div>
        </section>
    );
}

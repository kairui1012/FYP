import { reactLang } from '@erag/lang-sync-inertia';
import { Sparkles } from 'lucide-react';
import { PointsBadgeCard } from '@/components/achievementsPageComponent/points-badge-card';
import type { Badge } from '@/components/ts/features/achievements/achievement-types';

export function PointsBadgeList({ badges }: { badges: Badge[] }) {
    const { trans } = reactLang();

    if (badges.length === 0) return null;

    const earnedCount = badges.filter((badge) => badge.earned).length;

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {trans('achievement.points_badges')}
                </h2>
                <span className="ml-auto text-sm text-zinc-500">
                    {earnedCount} / {badges.length}{' '}
                    {trans('achievement.unlocked')}
                </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {badges.map((badge) => (
                    <PointsBadgeCard key={badge.id} badge={badge} />
                ))}
            </div>
        </section>
    );
}

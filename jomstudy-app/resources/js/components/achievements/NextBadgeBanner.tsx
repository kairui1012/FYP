import { reactLang } from '@erag/lang-sync-inertia';
import { getTranslatedBadgeName } from '@/lib/badge-translations';
import type { Badge } from './types';

type Props = {
    nextBadge: Badge;
    currentPoints: number;
};

export function NextBadgeBanner({ nextBadge, currentPoints }: Props) {
    const { trans } = reactLang();
    const pointsNeeded = Math.max(nextBadge.points_required - currentPoints, 0);
    const progressPct = Math.min(100, Math.round((currentPoints / nextBadge.points_required) * 100));

    return (
        <section className="rounded-2xl bg-linear-to-r from-zinc-900 to-zinc-800 px-5 py-4 text-zinc-100 shadow">
            <p className="text-xs tracking-wide text-zinc-400 uppercase">
                {trans('achievement.next_badge')}
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-4">
                <p className="font-semibold">
                    {getTranslatedBadgeName(trans, nextBadge)}
                </p>
                <p className="shrink-0 text-sm text-amber-400">
                    {pointsNeeded} {trans('achievement.points_to_unlock')}
                </p>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                <div
                    className="h-full rounded-full bg-linear-to-r from-amber-400 to-yellow-400 transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                />
            </div>
        </section>
    );
}

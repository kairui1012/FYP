import { reactLang } from '@erag/lang-sync-inertia';
import { Lock, Sparkles, Trophy } from 'lucide-react';
import { badgeIconMap } from '@/components/ts/features/achievements/achievement-config';
import type { Badge } from '@/components/ts/features/achievements/achievement-types';
import {
    getTranslatedBadgeDescription,
    getTranslatedBadgeName,
} from '@/lib/badge-text-helpers';
import { cn } from '@/lib/common-helpers';

export function PointsBadgeCard({ badge }: { badge: Badge }) {
    const { trans } = reactLang();
    const Icon =
        badge.icon && badge.icon in badgeIconMap
            ? badgeIconMap[badge.icon as keyof typeof badgeIconMap]
            : Trophy;

    return (
        <article
            className={cn(
                'relative flex flex-col rounded-2xl border-2 p-4 transition-all duration-300',
                badge.earned
                    ? 'border-amber-300 bg-linear-to-br from-amber-50 via-yellow-50 to-orange-50 shadow-md shadow-amber-100 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-200 dark:border-amber-700 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/30'
                    : 'border-zinc-200 bg-zinc-50 opacity-60 hover:opacity-80 dark:border-zinc-700 dark:bg-zinc-900',
            )}
        >
            {badge.earned && (
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-amber-400/10 via-yellow-300/5 to-transparent" />
            )}
            {!badge.earned && (
                <Lock className="absolute top-3 right-3 h-3.5 w-3.5 text-zinc-400" />
            )}
            <div className="relative z-10">
                <div className="mb-3 flex items-center gap-3">
                    <div
                        className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                            badge.earned
                                ? 'bg-amber-100 dark:bg-amber-900/50'
                                : 'bg-zinc-200 dark:bg-zinc-700',
                        )}
                    >
                        <Icon
                            className={cn(
                                'h-5 w-5',
                                badge.earned
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-zinc-400',
                            )}
                        />
                    </div>
                    <div>
                        <p
                            className={cn(
                                'font-bold',
                                badge.earned
                                    ? 'text-amber-800 dark:text-amber-200'
                                    : 'text-zinc-500',
                            )}
                        >
                            {getTranslatedBadgeName(trans, badge)}
                        </p>
                        {badge.earned ? (
                            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                <Sparkles className="h-3 w-3" />
                                {trans('achievement.unlocked')}
                            </span>
                        ) : (
                            <p className="mt-0.5 text-xs text-zinc-400">
                                {trans('achievement.locked')}
                            </p>
                        )}
                    </div>
                </div>
                <p
                    className={cn(
                        'mb-3 text-sm leading-relaxed',
                        badge.earned
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-zinc-500',
                    )}
                >
                    {getTranslatedBadgeDescription(trans, badge)}
                </p>
                <div
                    className={cn(
                        'rounded-lg px-3 py-1.5 text-center text-xs font-semibold',
                        badge.earned
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800',
                    )}
                >
                    {badge.points_required} {trans('achievement.points')}{' '}
                    {trans('achievement.required')}
                </div>
            </div>
        </article>
    );
}

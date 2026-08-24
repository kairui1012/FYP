import { Sparkles, Trophy } from 'lucide-react';
import type {
    Badge,
    TransFn,
} from '@/components/ts/features/profile/profile-types';
import {
    getTranslatedBadgeDescription,
    getTranslatedBadgeName,
} from '@/lib/badge-text-helpers';
import { cn } from '@/lib/common-helpers';
import { BadgeIcon } from './badge-icon';

export function ProfileBadgesTab({
    earnedBadges,
    featuredBadgeIds,
    pointsLabel,
    noBadgesYetLabel,
    trans,
}: {
    earnedBadges: Badge[];
    featuredBadgeIds: number[];
    pointsLabel: string;
    noBadgesYetLabel: string;
    trans: TransFn;
}) {
    if (earnedBadges.length === 0) {
        return (
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <div className="relative overflow-hidden rounded-2xl border border-dashed border-rose-200 bg-linear-to-br from-rose-50 via-white to-sky-50 px-5 py-12 text-center md:px-8 md:py-14">
                    <div className="mx-auto flex max-w-lg flex-col items-center">
                        <div className="relative mb-5 h-20 w-28">
                            <div className="absolute top-0 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-rose-100">
                                <Trophy className="h-7 w-7 text-[#e27193]" />
                            </div>
                            <div className="absolute bottom-0 left-3 h-10 w-10 rounded-full bg-sky-100 ring-4 ring-white" />
                            <div className="absolute right-3 bottom-0 h-10 w-10 rounded-full bg-amber-100 ring-4 ring-white" />
                        </div>
                        <h2 className="text-lg font-bold text-zinc-900">
                            {noBadgesYetLabel}
                        </h2>
                        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
                            {trans('profile.earn_badges_hint')}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {earnedBadges.map((badge) => {
                    const isFeatured = featuredBadgeIds.includes(badge.id);
                    return (
                        <article
                            key={badge.id}
                            className={cn(
                                'relative rounded-2xl border-2 p-4 transition-all duration-200',
                                isFeatured
                                    ? 'border-amber-300 bg-linear-to-br from-amber-50 via-yellow-50 to-orange-50 shadow-md shadow-amber-100 dark:border-amber-700 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/30'
                                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800',
                            )}
                        >
                            {isFeatured && (
                                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                    <Sparkles className="h-3 w-3" />
                                    {trans('profile.featured')}
                                </span>
                            )}
                            <div className="mb-2 flex items-center gap-2">
                                <div
                                    className={cn(
                                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                                        isFeatured
                                            ? 'bg-amber-100 dark:bg-amber-900/50'
                                            : 'bg-zinc-200 dark:bg-zinc-700',
                                    )}
                                >
                                    <BadgeIcon
                                        iconKey={badge.icon}
                                        className={cn(
                                            'h-4.5 w-4.5',
                                            isFeatured
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-zinc-500',
                                        )}
                                    />
                                </div>
                                <p
                                    className={cn(
                                        'font-bold',
                                        isFeatured
                                            ? 'text-amber-800 dark:text-amber-200'
                                            : 'text-zinc-900 dark:text-zinc-100',
                                    )}
                                >
                                    {getTranslatedBadgeName(trans, badge)}
                                </p>
                            </div>
                            <p
                                className={cn(
                                    'text-xs leading-relaxed',
                                    isFeatured
                                        ? 'text-amber-700 dark:text-amber-300'
                                        : 'text-zinc-600 dark:text-zinc-400',
                                )}
                            >
                                {getTranslatedBadgeDescription(trans, badge)}
                            </p>
                            <p
                                className={cn(
                                    'mt-2 text-xs',
                                    isFeatured
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-zinc-400',
                                )}
                            >
                                {badge.points_required} {pointsLabel}
                            </p>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

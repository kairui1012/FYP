import { Check, Sparkles } from 'lucide-react';
import type { Badge, TransFn } from '@/components/ts/features/profile/profile-types';
import { Button } from '@/components/ui/button';
import { getTranslatedBadgeName } from '@/lib/badge-text-helpers';
import { cn } from '@/lib/common-helpers';
import { BadgeIcon } from './badge-icon';

const MAX_FEATURED_BADGES = 3;
const saveButtonClass =
    'rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] text-white transition-all duration-200 hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black hover:shadow-[0_4px_12px_rgba(227,106,139,0.3)] focus-visible:border-[#d85380] focus-visible:ring-[#e36a8b]/35 dark:border-[#ef99b0] dark:from-[#ef99b0] dark:to-[#e27193] dark:text-white dark:hover:border-[#d85380] dark:hover:from-[#f5c4d6] dark:hover:to-[#f39db8] dark:hover:text-black';

type FeaturedBadgeEditorProps = {
    earnedBadges: Badge[];
    featuredBadgeIds: number[];
    savingBadges: boolean;
    trans: TransFn;
    onBadgeToggle: (badgeId: number) => void;
    onSave: () => void;
};

export function FeaturedBadgeEditor({
    earnedBadges,
    featuredBadgeIds,
    savingBadges,
    trans,
    onBadgeToggle,
    onSave,
}: FeaturedBadgeEditorProps) {
    const reachedLimit = featuredBadgeIds.length >= MAX_FEATURED_BADGES;

    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800 dark:bg-amber-950/20">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-amber-900 dark:text-amber-200">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        {trans('profile.choose_featured_badges')}
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                        {trans('profile.select_up_to').replace(
                            ':max',
                            String(MAX_FEATURED_BADGES),
                        )}{' '}
                        <span className="font-semibold">
                            {featuredBadgeIds.length}/{MAX_FEATURED_BADGES}
                        </span>{' '}
                        {trans('profile.selected')}
                    </p>
                    {reachedLimit ? (
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            ⚠ {trans('profile.max_badges_reached')}
                        </p>
                    ) : null}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={savingBadges}
                    onClick={onSave}
                    className={saveButtonClass}
                >
                    {savingBadges
                        ? trans('profile.saving')
                        : trans('profile.save')}
                </Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {earnedBadges.map((badge) => {
                    const isSelected = featuredBadgeIds.includes(badge.id);
                    const isDisabled = reachedLimit && !isSelected;

                    return (
                        <button
                            key={badge.id}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => onBadgeToggle(badge.id)}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                                isSelected
                                    ? 'border-amber-300 bg-linear-to-r from-amber-50 to-yellow-50 text-amber-800 shadow-sm hover:border-amber-400 dark:border-amber-700 dark:from-amber-950/40 dark:text-amber-300'
                                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
                                isDisabled &&
                                    'cursor-not-allowed opacity-40',
                            )}
                        >
                            {isSelected ? (
                                <Check className="h-3 w-3 shrink-0 text-amber-600" />
                            ) : null}
                            <BadgeIcon
                                iconKey={badge.icon}
                                className={cn(
                                    'h-3 w-3 shrink-0',
                                    isSelected
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-zinc-500',
                                )}
                            />
                            <span>{getTranslatedBadgeName(trans, badge)}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

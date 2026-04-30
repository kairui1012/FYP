import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BadgeSelectChip } from './badge-select-chip';
import type { Badge, TransFn } from './types';

const MAX_FEATURED = 3;

const primaryBtnClass =
    'rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] text-white transition-all duration-200 hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black hover:shadow-[0_4px_12px_rgba(227,106,139,0.3)] focus-visible:border-[#d85380] focus-visible:ring-[#e36a8b]/35 dark:border-[#ef99b0] dark:from-[#ef99b0] dark:to-[#e27193] dark:text-white dark:hover:border-[#d85380] dark:hover:from-[#f5c4d6] dark:hover:to-[#f39db8] dark:hover:text-black';

export function BadgeEditorPanel({
    earnedBadges,
    featuredBadgeIds,
    savingBadges,
    trans,
    onBadgeToggle,
    onSave,
}: {
    earnedBadges: Badge[];
    featuredBadgeIds: number[];
    savingBadges: boolean;
    trans: TransFn;
    onBadgeToggle: (id: number) => void;
    onSave: () => void;
}) {
    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800 dark:bg-amber-950/20">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-amber-900 dark:text-amber-200">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        {trans('profile.choose_featured_badges')}
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                        {trans('profile.select_up_to').replace(':max', String(MAX_FEATURED))}{' '}
                        <span className="font-semibold">
                            {featuredBadgeIds.length}/{MAX_FEATURED}
                        </span>{' '}
                        {trans('profile.selected')}
                    </p>
                    {featuredBadgeIds.length >= MAX_FEATURED && (
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            ⚠ {trans('profile.max_badges_reached')}
                        </p>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={savingBadges}
                    onClick={onSave}
                    className={primaryBtnClass}
                >
                    {savingBadges ? trans('profile.saving') : trans('profile.save')}
                </Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {earnedBadges.map((badge) => (
                    <BadgeSelectChip
                        key={badge.id}
                        badge={badge}
                        selected={featuredBadgeIds.includes(badge.id)}
                        disabled={featuredBadgeIds.length >= MAX_FEATURED}
                        onToggle={() => onBadgeToggle(badge.id)}
                    />
                ))}
            </div>
        </div>
    );
}

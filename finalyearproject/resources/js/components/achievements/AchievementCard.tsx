import { reactLang } from '@erag/lang-sync-inertia';
import { Lock, Sparkles, Trophy } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ACHIEVEMENT_META, CATEGORY_CONFIG, achievementIconMap } from './constants';
import type { AchievementItem } from './types';

export function AchievementCard({ item }: { item: AchievementItem }) {
    const { trans } = reactLang();
    const [hovered, setHovered] = useState(false);

    const meta = ACHIEVEMENT_META[item.key];
    if (!meta) return null;

    const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.community;
    const Icon =
        item.icon in achievementIconMap
            ? achievementIconMap[item.icon as keyof typeof achievementIconMap]
            : Trophy;

    const remaining = item.threshold - item.current;
    const title = trans(meta.titleKey);
    const desc = trans(meta.descKey);
    const unit = trans(meta.unitKey);

    return (
        <article
            className={cn(
                'group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 p-4 transition-all duration-300',
                item.achieved
                    ? [
                          cfg.border,
                          cfg.badgeBg,
                          'shadow-md hover:shadow-lg',
                          cfg.glow,
                          'hover:-translate-y-0.5 hover:scale-[1.02]',
                      ]
                    : [
                          'border-zinc-200 bg-zinc-50 opacity-70 hover:opacity-90 dark:border-zinc-700 dark:bg-zinc-900',
                          'hover:-translate-y-0.5',
                      ],
            )}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {item.achieved && (
                <div
                    className={cn(
                        'pointer-events-none absolute inset-0 bg-linear-to-br opacity-60',
                        cfg.gradient,
                    )}
                />
            )}

            {item.achieved && (
                <div className="absolute top-2.5 right-2.5">
                    <Sparkles className={cn('h-3.5 w-3.5', cfg.iconColor)} aria-hidden />
                </div>
            )}

            {!item.achieved && (
                <div className="absolute top-2.5 right-2.5">
                    <Lock className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                </div>
            )}

            <div className="relative z-10 flex flex-col flex-1">
                <div className="mb-3 flex items-center gap-3">
                    <div
                        className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
                            item.achieved ? cfg.iconBg : 'bg-zinc-200 dark:bg-zinc-700',
                        )}
                    >
                        <Icon
                            className={cn(
                                'h-5 w-5',
                                item.achieved ? cfg.iconColor : 'text-zinc-400',
                            )}
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p
                            className={cn(
                                'font-bold leading-tight',
                                item.achieved ? cfg.textAccent : 'text-zinc-500',
                            )}
                        >
                            {title}
                        </p>
                        {item.achieved && item.achieved_at && (
                            <p className={cn('mt-0.5 text-xs opacity-70', cfg.textAccent)}>
                                {new Date(item.achieved_at).toLocaleDateString()}
                            </p>
                        )}
                        {!item.achieved && (
                            <p className="mt-0.5 text-xs font-medium text-zinc-400">
                                {trans('achievement.locked')}
                            </p>
                        )}
                    </div>
                </div>

                <p
                    className={cn(
                        'mb-4 flex-1 text-sm leading-relaxed',
                        item.achieved ? cfg.textAccent + ' opacity-80' : 'text-zinc-500',
                    )}
                >
                    {desc}
                </p>

                <div className="mt-auto space-y-1.5">
                    <div
                        className={cn(
                            'flex items-center justify-between text-xs font-medium',
                            item.achieved ? cfg.textAccent : 'text-zinc-500',
                        )}
                    >
                        <span>
                            {item.current} / {item.threshold} {unit}
                        </span>
                        <span>{item.progress_pct}%</span>
                    </div>
                    <div
                        className={cn(
                            'h-2 w-full overflow-hidden rounded-full',
                            item.achieved ? 'bg-white/50 dark:bg-black/20' : 'bg-zinc-200 dark:bg-zinc-700',
                        )}
                    >
                        <div
                            className={cn(
                                'h-full rounded-full bg-linear-to-r transition-all duration-700',
                                item.achieved ? cfg.barColor : 'from-zinc-300 to-zinc-400',
                            )}
                            style={{ width: `${item.progress_pct}%` }}
                        />
                    </div>
                </div>
            </div>

            {!item.achieved && hovered && (
                <div className="absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
                    <p className="mb-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {trans('achievement.how_to_unlock')}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{desc}</p>
                    <div className="mt-2 border-t border-zinc-100 pt-2 dark:border-zinc-700">
                        <p className="text-xs text-zinc-500">
                            {trans('achievement.progress_label')}:{' '}
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                {item.current} / {item.threshold} {unit}
                            </span>
                        </p>
                        {remaining > 0 && (
                            <p className="mt-0.5 text-xs text-zinc-400">
                                {remaining} {unit} {trans('achievement.remaining')}
                            </p>
                        )}
                    </div>
                    <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1 rotate-45 border-b border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800" />
                </div>
            )}
        </article>
    );
}

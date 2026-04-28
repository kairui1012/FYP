import { reactLang } from '@erag/lang-sync-inertia';
import { Trophy } from 'lucide-react';

type Props = {
    earnedCount: number;
    totalCount: number;
};

export function AchievementsHero({ earnedCount, totalCount }: Props) {
    const { trans } = reactLang();

    return (
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white px-6 py-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(250,204,21,0.08),transparent_60%)]" />
            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-amber-500" />
                        <h1 className="text-2xl font-bold text-zinc-900 md:text-3xl dark:text-zinc-100">
                            {trans('navigation.achievements')}
                        </h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        {trans('achievement.description')}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <p className="text-4xl font-black text-amber-500">
                        {earnedCount}
                        <span className="text-xl font-semibold text-zinc-400">
                            /{totalCount}
                        </span>
                    </p>
                    <p className="text-xs text-zinc-400">
                        {trans('achievement.achievements_earned')}
                    </p>
                    <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div
                            className="h-full rounded-full bg-linear-to-r from-amber-400 to-amber-500 transition-all duration-700"
                            style={{
                                width: totalCount > 0
                                    ? `${Math.round((earnedCount / totalCount) * 100)}%`
                                    : '0%',
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

import { reactLang } from '@erag/lang-sync-inertia';
import { cn } from '@/lib/utils';
import type { PageProps } from './types';

type Props = {
    summary: PageProps['summary'];
    quizzesCompleted: number;
};

export function AchievementSummary({ summary, quizzesCompleted }: Props) {
    const { trans } = reactLang();

    const stats = [
        {
            label: trans('achievement.points'),
            value: summary.points,
            color: 'text-amber-600',
        },
        {
            label: trans('achievement.posts_created'),
            value: summary.posts_count,
            color: 'text-rose-600',
        },
        {
            label: trans('achievement.likes_received'),
            value: summary.likes_received_count,
            color: 'text-pink-600',
        },
        {
            label: trans('achievement.comments_count'),
            value: summary.comments_count,
            color: 'text-sky-600',
        },
        {
            label: trans('achievement.saves_count'),
            value: summary.saved_posts_count,
            color: 'text-teal-600',
        },
        {
            label: trans('achievement.quizzes_done'),
            value: quizzesCompleted,
            color: 'text-violet-600',
        },
    ];

    return (
        <section className="grid gap-3 sm:grid-cols-3 md:grid-cols-6">
            {stats.map(({ label, value, color }) => (
                <article
                    key={label}
                    className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                    <p className="truncate text-xs tracking-wide text-zinc-500 uppercase">
                        {label}
                    </p>
                    <p className={cn('mt-1 text-2xl font-black', color)}>
                        {value}
                    </p>
                </article>
            ))}
        </section>
    );
}

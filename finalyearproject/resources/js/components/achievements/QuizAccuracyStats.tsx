import { reactLang } from '@erag/lang-sync-inertia';
import { cn } from '@/lib/utils';
import type { UserProgressData } from './types';

type Props = {
    userProgress: UserProgressData;
};

export function QuizAccuracyStats({ userProgress }: Props) {
    const { trans } = reactLang();

    if (userProgress.total_questions_answered === 0) return null;

    const { improvement_score } = userProgress;
    const improvementPositive = improvement_score > 0;
    const improvementNegative = improvement_score < 0;

    return (
        <section className="grid gap-3 sm:grid-cols-2 w-full">
            <article className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30">
                <p className="text-xs tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                    {trans('achievement.accuracy')}
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {userProgress.accuracy_pct}%
                </p>
            </article>

            <article className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-xs tracking-wide text-zinc-500 uppercase">
                    {trans('achievement.correct_answers')}
                </p>
                <p className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-100">
                    {userProgress.correct_answers_count}{' '}
                    <span className="text-base font-normal text-zinc-400">
                        / {userProgress.total_questions_answered}
                    </span>
                </p>
            </article>

           
        </section>
    );
}

import { reactLang } from '@erag/lang-sync-inertia';
import { Head } from '@inertiajs/react';
import {
    Award,
    CheckCircle2,
    Crown,
    Medal,
    Scale,
    Sparkles,
    Trophy,
} from 'lucide-react';
import type { ReactNode } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const ruleRoute = '/rules';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Rules',
        href: ruleRoute,
    },
];

type RuleSectionProps = {
    icon: ReactNode;
    title: string;
    summary: string;
    items: string[];
};

function RuleSection({ icon, title, summary, items }: RuleSectionProps) {
    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-zinc-950">
                        {title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                        {summary}
                    </p>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                {items.map((item) => (
                    <div
                        key={item}
                        className="flex gap-3 text-sm leading-6 text-zinc-700"
                    >
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                        <p>{item}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function RulesPage() {
    const { trans } = reactLang();

    const achievementRules = [
        trans('rules.achievement_1'),
        trans('rules.achievement_2'),
        trans('rules.achievement_3'),
        trans('rules.achievement_4'),
        trans('rules.achievement_5'),
    ];

    const leaderboardRules = [
        trans('rules.leaderboard_1'),
        trans('rules.leaderboard_2'),
        trans('rules.leaderboard_3'),
        trans('rules.leaderboard_4'),
        trans('rules.leaderboard_5'),
    ];

    const bestAnswerRules = [
        trans('rules.best_answer_1'),
        trans('rules.best_answer_2'),
        trans('rules.best_answer_3'),
        trans('rules.best_answer_4'),
        trans('rules.best_answer_5'),
    ];

    const pointRules = [
        trans('rules.points_question_asked'),
        trans('rules.points_answer_posted'),
        trans('rules.points_question_upvoted'),
        trans('rules.points_answer_upvoted'),
        trans('rules.points_best_answer_marked'),
        trans('rules.points_resource_uploaded'),
        trans('rules.points_resource_bookmarked'),
        trans('rules.points_follower_gained'),
        trans('rules.points_content_downvoted'),
    ];

    const titleRules = [
        trans('rules.titles_1'),
        trans('rules.titles_2'),
        trans('rules.titles_3'),
        trans('rules.titles_4'),
        trans('rules.titles_5'),
    ];

    return (
        <div className="min-h-[calc(100dvh-4rem)] bg-zinc-50 pb-28">
            <Head title={trans('rules.title')} />

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
                <header className="border-b border-zinc-200 pb-5">
                    <p className="text-sm font-semibold text-[#de6b89]">
                        {trans('navigation.rules')}
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-zinc-950 md:text-3xl">
                        {trans('rules.title')}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 md:text-base">
                        {trans('rules.subtitle')}
                    </p>
                </header>

                <div className="grid gap-4 lg:grid-cols-2">
                    <RuleSection
                        icon={<Award className="h-5 w-5" />}
                        title={trans('rules.achievement_title')}
                        summary={trans('rules.achievement_summary')}
                        items={achievementRules}
                    />

                    <RuleSection
                        icon={<Trophy className="h-5 w-5" />}
                        title={trans('rules.leaderboard_title')}
                        summary={trans('rules.leaderboard_summary')}
                        items={leaderboardRules}
                    />
                </div>

                <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                            <Scale className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-950">
                                {trans('rules.points_title')}
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-zinc-600">
                                {trans('rules.points_note')}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {pointRules.map((rule) => (
                            <div
                                key={rule}
                                className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700"
                            >
                                {rule}
                            </div>
                        ))}
                    </div>
                </section>

                <RuleSection
                    icon={<Sparkles className="h-5 w-5" />}
                    title={trans('rules.best_answer_title')}
                    summary={trans('rules.best_answer_summary')}
                    items={bestAnswerRules}
                />

                <RuleSection
                    icon={<Crown className="h-5 w-5" />}
                    title={trans('rules.titles_title')}
                    summary={trans('rules.titles_summary')}
                    items={titleRules}
                />

                <section className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-5 shadow-xs md:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-md bg-amber-50 px-3 py-3 text-amber-800">
                        <Trophy className="h-5 w-5" />
                        <span className="text-sm font-semibold">
                            {trans('leaderboard.title_champion')}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-md bg-zinc-100 px-3 py-3 text-zinc-700">
                        <Crown className="h-5 w-5" />
                        <span className="text-sm font-semibold">
                            {trans('leaderboard.title_runner_up')}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-md bg-orange-50 px-3 py-3 text-orange-800">
                        <Medal className="h-5 w-5" />
                        <span className="text-sm font-semibold">
                            {trans('leaderboard.title_third_place')}
                        </span>
                    </div>
                </section>
            </div>
        </div>
    );
}

RulesPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

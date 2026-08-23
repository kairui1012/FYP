import { reactLang } from '@erag/lang-sync-inertia';
import { Head } from '@inertiajs/react';
import { Award, Crown, Sparkles, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { LeaderboardTitleBadges } from '@/components/rules/leaderboard-title-badges';
import { ManualGuide } from '@/components/rules/manual-guide';
import { PointsRulesSection } from '@/components/rules/points-rules-section';
import { RuleSection } from '@/components/rules/rule-section';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const ruleRoute = '/rules';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Rules',
        href: ruleRoute,
    },
];

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

    const manualGuideItems = [
        trans('rules.manual_step_1'),
        trans('rules.manual_step_2'),
        trans('rules.manual_step_3'),
        trans('rules.manual_step_4'),
        trans('rules.manual_step_5'),
        trans('rules.manual_step_6'),
        trans('rules.manual_step_7'),
    ];

    return (
        <div className="min-h-[calc(100dvh-4rem)] bg-zinc-50 pb-28">
            <Head title={trans('rules.title')} />

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
                <header className="border-b border-zinc-200 pb-5">
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

                <PointsRulesSection
                    title={trans('rules.points_title')}
                    note={trans('rules.points_note')}
                    items={pointRules}
                />

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

                <LeaderboardTitleBadges
                    championLabel={trans('leaderboard.title_champion')}
                    runnerUpLabel={trans('leaderboard.title_runner_up')}
                    thirdPlaceLabel={trans('leaderboard.title_third_place')}
                />

                <ManualGuide
                    title={trans('rules.manual_title')}
                    summary={trans('rules.manual_summary')}
                    items={manualGuideItems}
                />
            </div>
        </div>
    );
}

RulesPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

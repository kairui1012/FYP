import { Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    CircleAlert,
    Newspaper,
    Trophy,
    Target,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatTimeAgo, getSubjectLabelFromPage } from '@/lib/post-utils';
import { cn } from '@/lib/utils';
import { achievements } from '@/routes';
import { getPostTypeBadgeProps, transFromPage } from './home-page-text';

export type StudyHomeOverview = {
    learning_milestone?: {
        key: string;
        category: string;
        current: number;
        threshold: number;
        progress_percent: number;
        remaining: number;
        achieved: boolean;
    } | null;
    latest_posts?: {
        source: 'personal' | 'community';
        items: Array<{
            id: number;
            title: string;
            post_type: 'material' | 'question' | 'quiz' | string;
            subject_name: string | null;
            user_name: string | null;
            created_at: string;
        }>;
    };
    today_score?: {
        points: number;
        quizzes_completed: number;
    };
    leaderboard_points?: {
        points: number;
        rank: number | null;
        points_to_next: number | null;
        is_hidden: boolean;
    };
    mistake_review?: Array<{
        id: number;
        post_id: number;
        post_title: string;
        question_index: number;
        question_text: string | null;
        subject_name: string | null;
        selected_answer: string | null;
        correct_answer: string | null;
        attempted_at: string;
    }>;
};

type StudyHomeDashboardText = {
    learningMilestones: string;
    learningMilestonesSubtitle: string;
    latestPosts: string;
    latestPostsSubtitle: string;
    yourRecentPosts: string;
    communityLatestPosts: string;
    noPostsYet: string;
    noPostsHint: string;
    todayScore: string;
    todayScoreSubtitle: string;
    leaderboardPointsTotal: string;
    leaderboardPointUnit: string;
    leaderboardRank: string;
    pointsToNextRank: string;
    rankHidden: string;
    topRank: string;
    quizzesCompletedToday: string;
    pointsPerQuiz: string;
    mistakeReview: string;
    mistakeReviewSubtitle: string;
    noMistakesYet: string;
    noMistakesHint: string;
    reviewAgain: string;
    remainingToUnlock: string;
    milestoneUnlocked: string;
    viewAchievements: string;
    yourAnswer: string;
    correctAnswer: string;
    untitledPost: string;
    createQuiz: string;
    askQuestion: string;
    shareMaterial: string;
};

type StudyHomeDashboardProps = {
    overview?: StudyHomeOverview;
    text: StudyHomeDashboardText;
    onOpenPost: (postId: number) => void;
};

const MILESTONE_META: Record<
    string,
    { titleKey: string; descKey: string; unitKey: string }
> = {
    active_learner: {
        titleKey: 'achievement.active_learner_title',
        descKey: 'achievement.active_learner_desc',
        unitKey: 'achievement.unit_attempts',
    },
    curious_mind: {
        titleKey: 'achievement.curious_mind_title',
        descKey: 'achievement.curious_mind_desc',
        unitKey: 'achievement.unit_posts',
    },
    quiz_master: {
        titleKey: 'achievement.quiz_master_title',
        descKey: 'achievement.quiz_master_desc',
        unitKey: 'achievement.unit_correct',
    },
    high_accuracy: {
        titleKey: 'achievement.high_accuracy_title',
        descKey: 'achievement.high_accuracy_desc',
        unitKey: 'achievement.unit_percent',
    },
    fast_improver: {
        titleKey: 'achievement.fast_improver_title',
        descKey: 'achievement.fast_improver_desc',
        unitKey: 'achievement.unit_percent',
    },
    consistent_growth: {
        titleKey: 'achievement.consistent_growth_title',
        descKey: 'achievement.consistent_growth_desc',
        unitKey: 'achievement.unit_percent',
    },
    helpful_contributor: {
        titleKey: 'achievement.helpful_contributor_title',
        descKey: 'achievement.helpful_contributor_desc',
        unitKey: 'achievement.unit_likes',
    },
    top_contributor: {
        titleKey: 'achievement.top_contributor_title',
        descKey: 'achievement.top_contributor_desc',
        unitKey: 'achievement.unit_likes',
    },
};

const milestoneAccentMap: Record<
    string,
    { icon: string; bar: string; surface: string }
> = {
    question: {
        icon: 'bg-blue-50 text-blue-600',
        bar: 'bg-blue-500',
        surface: 'bg-blue-50/60',
    },
    performance: {
        icon: 'bg-emerald-50 text-emerald-600',
        bar: 'bg-emerald-500',
        surface: 'bg-emerald-50/60',
    },
    improvement: {
        icon: 'bg-amber-50 text-amber-600',
        bar: 'bg-amber-500',
        surface: 'bg-amber-50/60',
    },
    community: {
        icon: 'bg-rose-50 text-rose-600',
        bar: 'bg-rose-500',
        surface: 'bg-rose-50/60',
    },
};

function DashboardCard({
    title,
    description,
    icon,
    children,
}: {
    title: string;
    description: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <Card className="h-full gap-0 border-zinc-200 py-0 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold text-zinc-900 md:text-base">
                        {title}
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500 md:text-sm">
                        {description}
                    </CardDescription>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="px-4 py-4">{children}</CardContent>
        </Card>
    );
}

export function StudyHomeDashboard({
    overview,
    text,
    onOpenPost,
}: StudyHomeDashboardProps) {
    const page = usePage();
    const milestone = overview?.learning_milestone ?? null;
    const latestPosts = overview?.latest_posts?.items ?? [];
    const leaderboardPoints = overview?.leaderboard_points ?? {
        points: 0,
        rank: null,
        points_to_next: null,
        is_hidden: false,
    };
    const mistakes = overview?.mistake_review ?? [];

    const milestoneMeta = milestone ? MILESTONE_META[milestone.key] : null;
    const milestoneAccent = milestone
        ? (milestoneAccentMap[milestone.category] ??
          milestoneAccentMap.performance)
        : null;

    const t = (key: string) => transFromPage(key, page as never);
    const subjectLabel = (subjectName: string | null | undefined) =>
        getSubjectLabelFromPage(subjectName, transFromPage, page);

    return (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <DashboardCard
                title={text.learningMilestones}
                description={text.learningMilestonesSubtitle}
                icon={<Trophy className="h-5 w-5" />}
            >
                {milestone && milestoneMeta && milestoneAccent ? (
                    <div
                        className={cn(
                            'space-y-4 rounded-2xl border border-zinc-200 p-4',
                            milestoneAccent.surface,
                        )}
                    >
                        <div className="flex items-start gap-2.5">
                            <div
                                className={cn(
                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                                    milestoneAccent.icon,
                                )}
                            >
                                <Target className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 space-y-1">
                                <p className="text-xs font-medium text-zinc-500">
                                    {t('achievement.next_badge')}
                                </p>
                                <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                                    {t(milestoneMeta.titleKey)}
                                </h2>
                                <p className="text-sm leading-5 text-zinc-600">
                                    {t(milestoneMeta.descKey)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-2xl font-semibold tracking-tight text-zinc-900">
                                        {milestone.progress_percent}%
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {milestone.achieved
                                            ? text.milestoneUnlocked
                                            : `${milestone.remaining} ${text.remainingToUnlock}`}
                                    </p>
                                </div>
                                <p className="text-xs font-medium text-zinc-600 md:text-sm">
                                    {milestone.current} / {milestone.threshold}{' '}
                                    {t(milestoneMeta.unitKey)}
                                </p>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all duration-500',
                                        milestoneAccent.bar,
                                    )}
                                    style={{
                                        width: `${milestone.progress_percent}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <Link
                            href={achievements()}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 transition hover:text-zinc-950 md:text-sm"
                        >
                            {text.viewAchievements}
                            <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm leading-5 text-zinc-500">
                        {text.learningMilestonesSubtitle}
                    </div>
                )}
            </DashboardCard>

            <DashboardCard
                title={text.latestPosts}
                description={text.latestPostsSubtitle}
                icon={<Newspaper className="h-5 w-5" />}
            >
                <div className="space-y-2.5">
                    {latestPosts.length > 0 ? (
                        <div className="space-y-2">
                            {latestPosts.map((post) => {
                                const { bg, text: badgeTextClass } =
                                    getPostTypeBadgeProps(post.post_type);
                                const typeLabel =
                                    post.post_type === 'quiz'
                                        ? text.createQuiz
                                        : post.post_type === 'question'
                                          ? text.askQuestion
                                          : text.shareMaterial;

                                return (
                                    <button
                                        key={post.id}
                                        type="button"
                                        onClick={() => onOpenPost(post.id)}
                                        className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-left transition hover:border-zinc-300 hover:bg-zinc-50"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 space-y-1.5">
                                                <p className="line-clamp-2 text-sm leading-5 font-semibold text-zinc-900">
                                                    {post.title ||
                                                        text.untitledPost}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 font-medium',
                                                            bg,
                                                            badgeTextClass,
                                                        )}
                                                    >
                                                        {typeLabel}
                                                    </span>
                                                    {post.subject_name ? (
                                                        <span>
                                                            {subjectLabel(
                                                                post.subject_name,
                                                            )}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-[11px] text-zinc-400">
                                                {formatTimeAgo(post.created_at)}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center">
                            <p className="text-sm font-medium text-zinc-700">
                                {text.noPostsYet}
                            </p>
                            <p className="mt-1 text-sm text-zinc-500">
                                {text.noPostsHint}
                            </p>
                        </div>
                    )}
                </div>
            </DashboardCard>

            <DashboardCard
                title={text.todayScore}
                description={text.todayScoreSubtitle}
                icon={<Trophy className="h-5 w-5" />}
            >
                <div className="space-y-3">
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                            {text.leaderboardPointsTotal}
                        </p>
                        <div className="mt-2 flex items-end gap-2">
                            <span className="text-4xl font-semibold tracking-tight text-zinc-950">
                                {leaderboardPoints.points}
                            </span>
                            <span className="pb-0.5 text-sm font-medium text-zinc-500 md:text-base">
                                {text.leaderboardPointUnit}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="rounded-2xl border border-zinc-200 px-3.5 py-3">
                            <p className="text-sm text-zinc-500">
                                {text.leaderboardRank}
                            </p>
                            <p className="mt-1.5 text-xl font-semibold text-zinc-900">
                                {leaderboardPoints.is_hidden
                                    ? text.rankHidden
                                    : leaderboardPoints.rank
                                      ? `#${leaderboardPoints.rank}`
                                      : '-'}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-zinc-200 px-3.5 py-3">
                            <p className="text-sm text-zinc-500">
                                {text.pointsToNextRank}
                            </p>
                            <p className="mt-1.5 text-xl font-semibold text-zinc-900">
                                {leaderboardPoints.is_hidden
                                    ? '-'
                                    : leaderboardPoints.points_to_next === null
                                      ? text.topRank
                                      : leaderboardPoints.points_to_next}
                            </p>
                        </div>
                    </div>
                </div>
            </DashboardCard>

            <DashboardCard
                title={text.mistakeReview}
                description={text.mistakeReviewSubtitle}
                icon={<CircleAlert className="h-5 w-5" />}
            >
                {mistakes.length > 0 ? (
                    <div className="space-y-2.5">
                        {mistakes.map((mistake) => (
                            <button
                                key={mistake.id}
                                type="button"
                                onClick={() => onOpenPost(mistake.post_id)}
                                className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-left transition hover:border-zinc-300 hover:bg-zinc-50"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 space-y-1">
                                        <p className="line-clamp-2 text-sm leading-5 font-semibold text-zinc-900">
                                            {mistake.question_text ||
                                                mistake.post_title ||
                                                text.untitledPost}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                            {mistake.subject_name ? (
                                                <span>
                                                    {subjectLabel(
                                                        mistake.subject_name,
                                                    )}
                                                </span>
                                            ) : null}
                                            <span>
                                                {formatTimeAgo(
                                                    mistake.attempted_at,
                                                )}
                                            </span>
                                        </div>
                                        {mistake.selected_answer ? (
                                            <p className="line-clamp-1 text-xs text-amber-700">
                                                {text.yourAnswer}:{' '}
                                                {mistake.selected_answer}
                                            </p>
                                        ) : null}
                                        {mistake.correct_answer ? (
                                            <p className="line-clamp-1 text-xs text-zinc-600">
                                                {text.correctAnswer}:{' '}
                                                {mistake.correct_answer}
                                            </p>
                                        ) : null}
                                    </div>
                                    <span className="shrink-0 text-[11px] font-medium text-zinc-600 md:text-xs">
                                        {text.reviewAgain}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center">
                        <p className="text-sm font-medium text-zinc-700">
                            {text.noMistakesYet}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                            {text.noMistakesHint}
                        </p>
                    </div>
                )}
            </DashboardCard>
        </div>
    );
}

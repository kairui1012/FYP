import { reactLang } from '@erag/lang-sync-inertia';
import { Head, usePage } from '@inertiajs/react';
import {
    Award,
    BarChart2,
    BookOpen,
    Crown,
    GraduationCap,
    HelpCircle,
    Sparkles,
    Star,
    Target,
    ThumbsUp,
    TrendingUp,
    Trophy,
} from 'lucide-react';
import type { ReactNode } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    getTranslatedBadgeDescription,
    getTranslatedBadgeName,
} from '@/lib/badge-translations';
import { cn } from '@/lib/utils';
import { achievements as achievementsRoute } from '@/routes';
import type { BreadcrumbItem } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type Badge = {
    id: number;
    key: string;
    name: string;
    description: string;
    icon?: string | null;
    points_required: number;
    awarded_at?: string | null;
};

type AchievementItem = {
    key: string;
    category: string;
    icon: string;
    threshold: number;
    current: number;
    progress_pct: number;
    achieved: boolean;
    achieved_at: string | null;
};

type UserProgressData = {
    total_questions_answered: number;
    total_questions_posted: number;
    quizzes_completed: number;
    correct_answers_count: number;
    total_likes_received: number;
    improvement_score: number;
    accuracy_pct: number;
};

type PageProps = {
    summary: {
        points: number;
        posts_count: number;
        likes_received_count: number;
    };
    badges: Badge[];
    next_badge: Badge | null;
    achievements: AchievementItem[];
    user_progress: UserProgressData | null;
};

// ── Icon maps ─────────────────────────────────────────────────────────────────

const achievementIconMap = {
    BookOpen,
    HelpCircle,
    GraduationCap,
    Target,
    TrendingUp,
    BarChart2,
    ThumbsUp,
    Award,
    Trophy,
} as const;

const badgeIconMap = {
    Sparkles,
    Star,
    Trophy,
    Crown,
} as const;

const categoryIconColorMap: Record<string, string> = {
    question: 'text-blue-600',
    performance: 'text-emerald-600',
    improvement: 'text-violet-600',
    community: 'text-amber-600',
};

const categoryBarColorMap: Record<string, string> = {
    question: 'bg-blue-500',
    performance: 'bg-emerald-500',
    improvement: 'bg-violet-500',
    community: 'bg-amber-500',
};

// ── Sub-components ────────────────────────────────────────────────────────────

type AchievementCardProps = {
    item: AchievementItem;
    titleKey: string;
    descKey: string;
    unitKey: string;
};

function AchievementCard({
    item,
    titleKey,
    descKey,
    unitKey,
}: AchievementCardProps) {
    const { trans } = reactLang();
    const Icon =
        item.icon in achievementIconMap
            ? achievementIconMap[item.icon as keyof typeof achievementIconMap]
            : Trophy;

    const defaultIconColor =
        categoryIconColorMap[item.category] ?? 'text-zinc-500';
    const defaultBarColor = categoryBarColorMap[item.category] ?? 'bg-zinc-400';

    const isQ = item.category === 'question';
    const isP = item.category === 'performance';
    const isI = item.category === 'improvement';
    const isC = item.category === 'community';

    return (
        <article
            className={cn(
                'relative flex h-full flex-col rounded-xl border-2 p-3.5 text-left transition-all',

                !item.achieved &&
                    'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600',

                item.achieved &&
                    isQ &&
                    'border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100 hover:shadow-sm dark:border-blue-900 dark:bg-blue-950/30 dark:hover:border-blue-800 dark:hover:bg-blue-900/50',
                item.achieved &&
                    isP &&
                    'border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/50',
                item.achieved &&
                    isI &&
                    'border-violet-200 bg-violet-50 hover:border-violet-300 hover:bg-violet-100 hover:shadow-sm dark:border-violet-900 dark:bg-violet-950/30 dark:hover:border-violet-800 dark:hover:bg-violet-900/50',
                item.achieved &&
                    isC &&
                    'border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100 hover:shadow-sm dark:border-amber-900 dark:bg-amber-950/30 dark:hover:border-amber-800 dark:hover:bg-amber-900/50',
            )}
        >
            <div className="mb-3 flex items-center gap-2">
                <Icon
                    className={cn(
                        'h-5 w-5 shrink-0 transition-colors',
                        !item.achieved && defaultIconColor,
                        item.achieved &&
                            isQ &&
                            'text-blue-600 dark:text-blue-400',
                        item.achieved &&
                            isP &&
                            'text-emerald-600 dark:text-emerald-400',
                        item.achieved &&
                            isI &&
                            'text-violet-600 dark:text-violet-400',
                        item.achieved &&
                            isC &&
                            'text-amber-600 dark:text-amber-400',
                    )}
                />
                <p
                    className={cn(
                        'font-semibold transition-colors',
                        !item.achieved && 'text-zinc-900 dark:text-zinc-100',
                        item.achieved &&
                            isQ &&
                            'text-blue-900 dark:text-blue-100',
                        item.achieved &&
                            isP &&
                            'text-emerald-900 dark:text-emerald-100',
                        item.achieved &&
                            isI &&
                            'text-violet-900 dark:text-violet-100',
                        item.achieved &&
                            isC &&
                            'text-amber-900 dark:text-amber-100',
                    )}
                >
                    {trans(titleKey)}
                </p>
            </div>

            {/* 描述文本 */}
            <p
                className={cn(
                    'mb-4 flex-1 text-sm transition-colors',
                    !item.achieved && 'text-zinc-600 dark:text-zinc-400',
                    item.achieved && isQ && 'text-blue-800 dark:text-blue-300',
                    item.achieved &&
                        isP &&
                        'text-emerald-800 dark:text-emerald-300',
                    item.achieved &&
                        isI &&
                        'text-violet-800 dark:text-violet-300',
                    item.achieved &&
                        isC &&
                        'text-amber-800 dark:text-amber-300',
                )}
            >
                {trans(descKey)}
            </p>

            {/* 进度条区域 */}
            <div className="mt-auto space-y-1.5">
                <div
                    className={cn(
                        'flex justify-between text-xs transition-colors',
                        !item.achieved && 'text-zinc-500 dark:text-zinc-500',
                        item.achieved &&
                            isQ &&
                            'text-blue-700 dark:text-blue-400',
                        item.achieved &&
                            isP &&
                            'text-emerald-700 dark:text-emerald-400',
                        item.achieved &&
                            isI &&
                            'text-violet-700 dark:text-violet-400',
                        item.achieved &&
                            isC &&
                            'text-amber-700 dark:text-amber-400',
                    )}
                >
                    <span>
                        {item.current} / {item.threshold} {trans(unitKey)}
                    </span>
                    <span>{item.progress_pct}%</span>
                </div>
                <div
                    className={cn(
                        'h-2 w-full overflow-hidden rounded-full shadow-inner transition-colors',
                        !item.achieved
                            ? 'bg-zinc-100 dark:bg-zinc-800'
                            : 'bg-white/60 dark:bg-black/20',
                    )}
                >
                    <div
                        className={cn(
                            'h-full rounded-full transition-all duration-500',
                            !item.achieved && defaultBarColor,
                            item.achieved && isQ && 'bg-blue-500',
                            item.achieved && isP && 'bg-emerald-500',
                            item.achieved && isI && 'bg-violet-500',
                            item.achieved && isC && 'bg-amber-500',
                        )}
                        style={{ width: `${item.progress_pct}%` }}
                    />
                </div>
            </div>
        </article>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Achievements', href: achievementsRoute() },
];

const ACHIEVEMENT_META: Record<
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

const CATEGORY_ORDER = ['question', 'performance', 'improvement', 'community'];

export default function AchievementsPage() {
    const { trans } = reactLang();
    const { summary, badges, next_badge, achievements, user_progress } =
        usePage<PageProps>().props;

    const earnedCount = achievements.filter((a) => a.achieved).length;
    const totalCount = achievements.length;

    const grouped = CATEGORY_ORDER.reduce<Record<string, AchievementItem[]>>(
        (acc, cat) => {
            acc[cat] = achievements.filter((a) => a.category === cat);
            return acc;
        },
        {},
    );

    const categoryLabelKey: Record<string, string> = {
        question: 'achievement.category_question',
        performance: 'achievement.category_performance',
        improvement: 'achievement.category_improvement',
        community: 'achievement.category_community',
    };

    return (
        <>
            <Head title={trans('navigation.achievements')} />

            <div className="w-full max-w-none px-4 pt-6 pb-24 md:px-6 md:pt-8 md:pb-24">
                <div className="mx-auto w-full max-w-5xl space-y-8">
                    {/* ── Header ─────────────────────────────────────────────── */}
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900">
                            {trans('navigation.achievements')}
                        </h1>
                        <p className="mt-2 text-zinc-600">
                            {trans('achievement.description')}
                        </p>
                    </div>

                    {/* ── Summary stats ──────────────────────────────────────── */}
                    <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                        {[
                            {
                                label: trans('achievement.points'),
                                value: summary.points,
                            },
                            {
                                label: trans('achievement.posts_created'),
                                value: summary.posts_count,
                            },
                            {
                                label: trans('achievement.likes_received'),
                                value: summary.likes_received_count,
                            },
                            {
                                label: trans('achievement.quizzes_done'),
                                value: user_progress?.quizzes_completed ?? 0,
                            },
                        ].map(({ label, value }) => (
                            <article
                                key={label}
                                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
                            >
                                <p className="text-xs tracking-wide text-zinc-500 uppercase">
                                    {label}
                                </p>
                                <p className="mt-1 text-2xl font-bold text-zinc-900">
                                    {value}
                                </p>
                            </article>
                        ))}
                    </section>

                    {/* ── Quiz accuracy stats ───────────────────────────────── */}
                    {user_progress &&
                        user_progress.total_questions_answered > 0 && (
                            <section className="grid gap-3 sm:grid-cols-3">
                                <article className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                                    <p className="text-xs tracking-wide text-zinc-500 uppercase">
                                        {trans('achievement.accuracy')}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-emerald-600">
                                        {user_progress.accuracy_pct}%
                                    </p>
                                </article>
                                <article className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                                    <p className="text-xs tracking-wide text-zinc-500 uppercase">
                                        {trans('achievement.correct_answers')}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-zinc-900">
                                        {user_progress.correct_answers_count} /{' '}
                                        {user_progress.total_questions_answered}
                                    </p>
                                </article>
                                <article
                                    className={cn(
                                        'rounded-2xl border px-4 py-3 shadow-sm',
                                        user_progress.improvement_score > 0
                                            ? 'border-violet-200 bg-violet-50'
                                            : user_progress.improvement_score <
                                                0
                                              ? 'border-rose-200 bg-rose-50'
                                              : 'border-zinc-200 bg-white',
                                    )}
                                >
                                    <p className="text-xs tracking-wide text-zinc-500 uppercase">
                                        {trans('achievement.improvement')}
                                    </p>
                                    <p
                                        className={cn(
                                            'mt-1 text-2xl font-bold',
                                            user_progress.improvement_score > 0
                                                ? 'text-violet-600'
                                                : user_progress.improvement_score <
                                                    0
                                                  ? 'text-rose-600'
                                                  : 'text-zinc-900',
                                        )}
                                    >
                                        {user_progress.improvement_score > 0
                                            ? '+'
                                            : ''}
                                        {user_progress.improvement_score}%
                                    </p>
                                </article>
                            </section>
                        )}

                    {/* ── Next badge ────────────────────────────────────────── */}
                    {next_badge && (
                        <section className="rounded-2xl bg-zinc-900 px-5 py-4 text-zinc-100">
                            <p className="text-xs tracking-wide text-zinc-400 uppercase">
                                {trans('achievement.next_badge')}
                            </p>
                            <p className="mt-1 font-medium">
                                {getTranslatedBadgeName(trans, next_badge)} ·{' '}
                                {Math.max(
                                    next_badge.points_required - summary.points,
                                    0,
                                )}{' '}
                                {trans('achievement.points_to_unlock')}
                            </p>
                            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
                                <div
                                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                                    style={{
                                        width: `${Math.min(100, Math.round((summary.points / next_badge.points_required) * 100))}%`,
                                    }}
                                />
                            </div>
                        </section>
                    )}

                    {/* ── Achievement progress cards ────────────────────────── */}
                    <section className="space-y-6">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                            <Trophy className="h-5 w-5" />
                            {trans('achievement.your_achievements')}
                            <span className="ml-auto text-sm font-normal text-zinc-500">
                                {earnedCount} / {totalCount}
                            </span>
                        </h2>

                        {CATEGORY_ORDER.map((cat) => {
                            const items = grouped[cat] ?? [];
                            if (items.length === 0) return null;

                            return (
                                <div key={cat} className="space-y-3">
                                    <h3 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
                                        {trans(categoryLabelKey[cat])}
                                    </h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {items.map((item) => {
                                            const meta =
                                                ACHIEVEMENT_META[item.key];
                                            if (!meta) return null;
                                            return (
                                                <AchievementCard
                                                    key={item.key}
                                                    item={item}
                                                    titleKey={meta.titleKey}
                                                    descKey={meta.descKey}
                                                    unitKey={meta.unitKey}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    {/* ── Legacy badges ─────────────────────────────────────── */}
                    {badges.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                                <Sparkles className="h-5 w-5" />
                                {trans('achievement.earned_badges')}
                            </h2>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {badges.map((badge) => {
                                    const Icon =
                                        badge.icon && badge.icon in badgeIconMap
                                            ? badgeIconMap[
                                                  badge.icon as keyof typeof badgeIconMap
                                              ]
                                            : Trophy;

                                    return (
                                        <article
                                            key={badge.id}
                                            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
                                        >
                                            <div className="mb-2 flex items-center gap-2">
                                                <Icon className="h-4 w-4 text-amber-600" />
                                                <p className="font-semibold text-zinc-900">
                                                    {getTranslatedBadgeName(
                                                        trans,
                                                        badge,
                                                    )}
                                                </p>
                                            </div>
                                            <p className="text-sm text-zinc-600">
                                                {getTranslatedBadgeDescription(
                                                    trans,
                                                    badge,
                                                )}
                                            </p>
                                            <p className="mt-2 text-xs text-zinc-400">
                                                {badge.points_required}{' '}
                                                {trans('achievement.points')}
                                            </p>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}

AchievementsPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

import { reactLang } from '@erag/lang-sync-inertia';
import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
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
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { achievements as achievementsRoute } from '@/routes';

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

const categoryColorMap: Record<string, string> = {
    question:    'border-blue-200 bg-blue-50',
    performance: 'border-emerald-200 bg-emerald-50',
    improvement: 'border-violet-200 bg-violet-50',
    community:   'border-amber-200 bg-amber-50',
};

const categoryIconColorMap: Record<string, string> = {
    question:    'text-blue-600',
    performance: 'text-emerald-600',
    improvement: 'text-violet-600',
    community:   'text-amber-600',
};

const categoryBarColorMap: Record<string, string> = {
    question:    'bg-blue-500',
    performance: 'bg-emerald-500',
    improvement: 'bg-violet-500',
    community:   'bg-amber-500',
};

// ── Sub-components ────────────────────────────────────────────────────────────

type AchievementCardProps = {
    item: AchievementItem;
    titleKey: string;
    descKey: string;
    unitKey: string;
};

function AchievementCard({ item, titleKey, descKey, unitKey }: AchievementCardProps) {
    const { trans } = reactLang();
    const Icon = item.icon in achievementIconMap
        ? achievementIconMap[item.icon as keyof typeof achievementIconMap]
        : Trophy;

    const borderBg    = categoryColorMap[item.category]    ?? 'border-zinc-200 bg-zinc-50';
    const iconColor   = categoryIconColorMap[item.category] ?? 'text-zinc-500';
    const barColor    = categoryBarColorMap[item.category]  ?? 'bg-zinc-400';

    return (
        <article
            className={cn(
                'relative rounded-2xl border p-4 transition-all',
                borderBg,
                item.achieved && 'ring-2 ring-offset-1',
                item.achieved && item.category === 'question'    && 'ring-blue-400',
                item.achieved && item.category === 'performance' && 'ring-emerald-400',
                item.achieved && item.category === 'improvement' && 'ring-violet-400',
                item.achieved && item.category === 'community'   && 'ring-amber-400',
            )}
        >
            {item.achieved && (
                <span className="absolute top-3 right-3 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700 shadow-sm">
                    ✓ {trans('achievement.achieved')}
                </span>
            )}

            <div className="mb-3 flex items-center gap-2">
                <Icon className={cn('h-5 w-5 shrink-0', iconColor)} />
                <p className="font-semibold text-zinc-900">{trans(titleKey)}</p>
            </div>

            <p className="mb-4 text-sm text-zinc-600">{trans(descKey)}</p>

            {/* Progress bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-500">
                    <span>
                        {item.current} / {item.threshold} {trans(unitKey)}
                    </span>
                    <span>{item.progress_pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/70 shadow-inner">
                    <div
                        className={cn('h-full rounded-full transition-all duration-500', barColor)}
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

const ACHIEVEMENT_META: Record<string, { titleKey: string; descKey: string; unitKey: string }> = {
    active_learner:      { titleKey: 'achievement.active_learner_title',      descKey: 'achievement.active_learner_desc',      unitKey: 'achievement.unit_attempts' },
    curious_mind:        { titleKey: 'achievement.curious_mind_title',        descKey: 'achievement.curious_mind_desc',        unitKey: 'achievement.unit_posts' },
    quiz_master:         { titleKey: 'achievement.quiz_master_title',         descKey: 'achievement.quiz_master_desc',         unitKey: 'achievement.unit_correct' },
    high_accuracy:       { titleKey: 'achievement.high_accuracy_title',       descKey: 'achievement.high_accuracy_desc',       unitKey: 'achievement.unit_percent' },
    fast_improver:       { titleKey: 'achievement.fast_improver_title',       descKey: 'achievement.fast_improver_desc',       unitKey: 'achievement.unit_percent' },
    consistent_growth:   { titleKey: 'achievement.consistent_growth_title',   descKey: 'achievement.consistent_growth_desc',   unitKey: 'achievement.unit_percent' },
    helpful_contributor: { titleKey: 'achievement.helpful_contributor_title', descKey: 'achievement.helpful_contributor_desc', unitKey: 'achievement.unit_likes' },
    top_contributor:     { titleKey: 'achievement.top_contributor_title',     descKey: 'achievement.top_contributor_desc',     unitKey: 'achievement.unit_likes' },
};

const CATEGORY_ORDER = ['question', 'performance', 'improvement', 'community'];

export default function AchievementsPage() {
    const { trans } = reactLang();
    const { summary, badges, next_badge, achievements, user_progress } =
        usePage<PageProps>().props;

    const earnedCount  = achievements.filter((a) => a.achieved).length;
    const totalCount   = achievements.length;

    const grouped = CATEGORY_ORDER.reduce<Record<string, AchievementItem[]>>(
        (acc, cat) => {
            acc[cat] = achievements.filter((a) => a.category === cat);
            return acc;
        },
        {},
    );

    const categoryLabelKey: Record<string, string> = {
        question:    'achievement.category_question',
        performance: 'achievement.category_performance',
        improvement: 'achievement.category_improvement',
        community:   'achievement.category_community',
    };

    return (
        <>
            <Head title={trans('navigation.achievements')} />

            <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 md:px-6">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900">
                        {trans('navigation.achievements')}
                    </h1>
                    <p className="mt-2 text-zinc-600">{trans('achievement.description')}</p>
                </div>

                {/* ── Summary stats ──────────────────────────────────────── */}
                <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    {[
                        { label: trans('achievement.points'),         value: summary.points },
                        { label: trans('achievement.posts_created'),  value: summary.posts_count },
                        { label: trans('achievement.likes_received'), value: summary.likes_received_count },
                        { label: trans('achievement.quizzes_done'),   value: user_progress?.quizzes_completed ?? 0 },
                    ].map(({ label, value }) => (
                        <article key={label} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
                            <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
                        </article>
                    ))}
                </section>

                {/* ── Quiz accuracy stats ───────────────────────────────── */}
                {user_progress && user_progress.total_questions_answered > 0 && (
                    <section className="grid gap-3 sm:grid-cols-3">
                        <article className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">{trans('achievement.accuracy')}</p>
                            <p className="mt-1 text-2xl font-bold text-emerald-600">{user_progress.accuracy_pct}%</p>
                        </article>
                        <article className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">{trans('achievement.correct_answers')}</p>
                            <p className="mt-1 text-2xl font-bold text-zinc-900">
                                {user_progress.correct_answers_count} / {user_progress.total_questions_answered}
                            </p>
                        </article>
                        <article className={cn(
                            'rounded-2xl border px-4 py-3 shadow-sm',
                            user_progress.improvement_score > 0  ? 'border-violet-200 bg-violet-50' :
                            user_progress.improvement_score < 0  ? 'border-rose-200 bg-rose-50'     :
                                                                    'border-zinc-200 bg-white',
                        )}>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">{trans('achievement.improvement')}</p>
                            <p className={cn(
                                'mt-1 text-2xl font-bold',
                                user_progress.improvement_score > 0 ? 'text-violet-600' :
                                user_progress.improvement_score < 0 ? 'text-rose-600'   : 'text-zinc-900',
                            )}>
                                {user_progress.improvement_score > 0 ? '+' : ''}{user_progress.improvement_score}%
                            </p>
                        </article>
                    </section>
                )}

                {/* ── Next badge ────────────────────────────────────────── */}
                {next_badge && (
                    <section className="rounded-2xl bg-zinc-900 px-5 py-4 text-zinc-100">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">{trans('achievement.next_badge')}</p>
                        <p className="mt-1 font-medium">
                            {next_badge.name} · {Math.max(next_badge.points_required - summary.points, 0)} {trans('achievement.points_to_unlock')}
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
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                                    {trans(categoryLabelKey[cat])}
                                </h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {items.map((item) => {
                                        const meta = ACHIEVEMENT_META[item.key];
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
                                        ? badgeIconMap[badge.icon as keyof typeof badgeIconMap]
                                        : Trophy;

                                return (
                                    <article
                                        key={badge.id}
                                        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
                                    >
                                        <div className="mb-2 flex items-center gap-2">
                                            <Icon className="h-4 w-4 text-amber-600" />
                                            <p className="font-semibold text-zinc-900">{badge.name}</p>
                                        </div>
                                        <p className="text-sm text-zinc-600">{badge.description}</p>
                                        <p className="mt-2 text-xs text-zinc-400">
                                            {badge.points_required} {trans('achievement.points')}
                                        </p>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}

AchievementsPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

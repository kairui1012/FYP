import { reactLang } from '@erag/lang-sync-inertia';
import { Head, usePage } from '@inertiajs/react';
import {
    Award,
    BarChart2,
    BookMarked,
    BookOpen,
    Bookmark,
    Brain,
    CheckCircle2,
    Crown,
    FileText,
    Flame,
    GraduationCap,
    Heart,
    HelpCircle,
    Library,
    Lock,
    MessageCircle,
    MessageSquare,
    MessagesSquare,
    PenLine,
    Search,
    Sparkles,
    Star,
    Target,
    ThumbsUp,
    TrendingUp,
    Trophy,
    Users,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
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
    earned: boolean;
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
        comments_count: number;
        saved_posts_count: number;
        mistakes_reviewed: number;
    };
    badges: Badge[];
    next_badge: Badge | null;
    achievements: AchievementItem[];
    user_progress: UserProgressData | null;
};

// ── Icon maps ─────────────────────────────────────────────────────────────────

const achievementIconMap = {
    // Existing
    BookOpen,
    HelpCircle,
    GraduationCap,
    Target,
    TrendingUp,
    BarChart2,
    ThumbsUp,
    Award,
    Trophy,
    // New
    PenLine,
    FileText,
    Library,
    MessageCircle,
    MessageSquare,
    MessagesSquare,
    Bookmark,
    BookMarked,
    Search,
    Brain,
    Zap,
    Flame,
    Star,
    CheckCircle2,
    Heart,
} as const;

const badgeIconMap = {
    Sparkles,
    Star,
    Trophy,
    Crown,
    Award,
} as const;

// ── Category config ────────────────────────────────────────────────────────────

type CategoryConfig = {
    labelKey: string;
    gradient: string;
    border: string;
    glow: string;
    iconBg: string;
    iconColor: string;
    barColor: string;
    badgeBg: string;
    textAccent: string;
    Icon: LucideIcon;
};

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
    question: {
        labelKey: 'achievement.category_question',
        gradient: 'from-blue-500/20 via-blue-400/10 to-transparent',
        border: 'border-blue-300 dark:border-blue-700',
        glow: 'shadow-blue-200 dark:shadow-blue-900',
        iconBg: 'bg-blue-100 dark:bg-blue-900/50',
        iconColor: 'text-blue-600 dark:text-blue-400',
        barColor: 'from-blue-400 to-blue-600',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
        textAccent: 'text-blue-700 dark:text-blue-300',
        Icon: BookOpen,
    },
    performance: {
        labelKey: 'achievement.category_performance',
        gradient: 'from-emerald-500/20 via-emerald-400/10 to-transparent',
        border: 'border-emerald-300 dark:border-emerald-700',
        glow: 'shadow-emerald-200 dark:shadow-emerald-900',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        barColor: 'from-emerald-400 to-emerald-600',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        textAccent: 'text-emerald-700 dark:text-emerald-300',
        Icon: GraduationCap,
    },
    improvement: {
        labelKey: 'achievement.category_improvement',
        gradient: 'from-violet-500/20 via-violet-400/10 to-transparent',
        border: 'border-violet-300 dark:border-violet-700',
        glow: 'shadow-violet-200 dark:shadow-violet-900',
        iconBg: 'bg-violet-100 dark:bg-violet-900/50',
        iconColor: 'text-violet-600 dark:text-violet-400',
        barColor: 'from-violet-400 to-violet-600',
        badgeBg: 'bg-violet-50 dark:bg-violet-950/40',
        textAccent: 'text-violet-700 dark:text-violet-300',
        Icon: TrendingUp,
    },
    community: {
        labelKey: 'achievement.category_community',
        gradient: 'from-amber-500/20 via-amber-400/10 to-transparent',
        border: 'border-amber-300 dark:border-amber-700',
        glow: 'shadow-amber-200 dark:shadow-amber-900',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50',
        iconColor: 'text-amber-600 dark:text-amber-400',
        barColor: 'from-amber-400 to-amber-600',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
        textAccent: 'text-amber-700 dark:text-amber-300',
        Icon: Users,
    },
    posting: {
        labelKey: 'achievement.category_posting',
        gradient: 'from-rose-500/20 via-rose-400/10 to-transparent',
        border: 'border-rose-300 dark:border-rose-700',
        glow: 'shadow-rose-200 dark:shadow-rose-900',
        iconBg: 'bg-rose-100 dark:bg-rose-900/50',
        iconColor: 'text-rose-600 dark:text-rose-400',
        barColor: 'from-rose-400 to-rose-600',
        badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
        textAccent: 'text-rose-700 dark:text-rose-300',
        Icon: PenLine,
    },
    commenting: {
        labelKey: 'achievement.category_commenting',
        gradient: 'from-sky-500/20 via-sky-400/10 to-transparent',
        border: 'border-sky-300 dark:border-sky-700',
        glow: 'shadow-sky-200 dark:shadow-sky-900',
        iconBg: 'bg-sky-100 dark:bg-sky-900/50',
        iconColor: 'text-sky-600 dark:text-sky-400',
        barColor: 'from-sky-400 to-sky-600',
        badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
        textAccent: 'text-sky-700 dark:text-sky-300',
        Icon: MessageCircle,
    },
    saving: {
        labelKey: 'achievement.category_saving',
        gradient: 'from-teal-500/20 via-teal-400/10 to-transparent',
        border: 'border-teal-300 dark:border-teal-700',
        glow: 'shadow-teal-200 dark:shadow-teal-900',
        iconBg: 'bg-teal-100 dark:bg-teal-900/50',
        iconColor: 'text-teal-600 dark:text-teal-400',
        barColor: 'from-teal-400 to-teal-600',
        badgeBg: 'bg-teal-50 dark:bg-teal-950/40',
        textAccent: 'text-teal-700 dark:text-teal-300',
        Icon: Bookmark,
    },
    mistakes: {
        labelKey: 'achievement.category_mistakes',
        gradient: 'from-orange-500/20 via-orange-400/10 to-transparent',
        border: 'border-orange-300 dark:border-orange-700',
        glow: 'shadow-orange-200 dark:shadow-orange-900',
        iconBg: 'bg-orange-100 dark:bg-orange-900/50',
        iconColor: 'text-orange-600 dark:text-orange-400',
        barColor: 'from-orange-400 to-orange-600',
        badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
        textAccent: 'text-orange-700 dark:text-orange-300',
        Icon: Search,
    },
};

const CATEGORY_ORDER = [
    'posting',
    'question',
    'commenting',
    'performance',
    'improvement',
    'saving',
    'mistakes',
    'community',
];

// ── Achievement meta (i18n keys + unit) ───────────────────────────────────────

const ACHIEVEMENT_META: Record<
    string,
    { titleKey: string; descKey: string; unitKey: string }
> = {
    // Existing
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
    // New — posting
    first_post: {
        titleKey: 'achievement.first_post_title',
        descKey: 'achievement.first_post_desc',
        unitKey: 'achievement.unit_posts',
    },
    active_author: {
        titleKey: 'achievement.active_author_title',
        descKey: 'achievement.active_author_desc',
        unitKey: 'achievement.unit_posts',
    },
    prolific_poster: {
        titleKey: 'achievement.prolific_poster_title',
        descKey: 'achievement.prolific_poster_desc',
        unitKey: 'achievement.unit_posts',
    },
    // New — commenting
    first_comment: {
        titleKey: 'achievement.first_comment_title',
        descKey: 'achievement.first_comment_desc',
        unitKey: 'achievement.unit_comments',
    },
    discussion_starter: {
        titleKey: 'achievement.discussion_starter_title',
        descKey: 'achievement.discussion_starter_desc',
        unitKey: 'achievement.unit_comments',
    },
    community_voice: {
        titleKey: 'achievement.community_voice_title',
        descKey: 'achievement.community_voice_desc',
        unitKey: 'achievement.unit_comments',
    },
    // New — saving
    collector: {
        titleKey: 'achievement.collector_title',
        descKey: 'achievement.collector_desc',
        unitKey: 'achievement.unit_saves',
    },
    bookworm: {
        titleKey: 'achievement.bookworm_title',
        descKey: 'achievement.bookworm_desc',
        unitKey: 'achievement.unit_saves',
    },
    // New — mistakes
    mistake_hunter: {
        titleKey: 'achievement.mistake_hunter_title',
        descKey: 'achievement.mistake_hunter_desc',
        unitKey: 'achievement.unit_mistakes',
    },
    deep_learner: {
        titleKey: 'achievement.deep_learner_title',
        descKey: 'achievement.deep_learner_desc',
        unitKey: 'achievement.unit_mistakes',
    },
    // New — extended question
    quiz_veteran: {
        titleKey: 'achievement.quiz_veteran_title',
        descKey: 'achievement.quiz_veteran_desc',
        unitKey: 'achievement.unit_attempts',
    },
    quiz_legend: {
        titleKey: 'achievement.quiz_legend_title',
        descKey: 'achievement.quiz_legend_desc',
        unitKey: 'achievement.unit_attempts',
    },
    // New — extended performance
    perfect_scorer: {
        titleKey: 'achievement.perfect_scorer_title',
        descKey: 'achievement.perfect_scorer_desc',
        unitKey: 'achievement.unit_percent',
    },
    quiz_completionist: {
        titleKey: 'achievement.quiz_completionist_title',
        descKey: 'achievement.quiz_completionist_desc',
        unitKey: 'achievement.unit_quizzes',
    },
    // New — extended community
    community_star: {
        titleKey: 'achievement.community_star_title',
        descKey: 'achievement.community_star_desc',
        unitKey: 'achievement.unit_likes',
    },
};

// ── Achievement Card ───────────────────────────────────────────────────────────

function AchievementCard({ item }: { item: AchievementItem }) {
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
            {/* Gradient overlay for unlocked cards */}
            {item.achieved && (
                <div
                    className={cn(
                        'pointer-events-none absolute inset-0 bg-linear-to-br opacity-60',
                        cfg.gradient,
                    )}
                />
            )}

            {/* Unlock sparkle for newly earned */}
            {item.achieved && (
                <div className="absolute top-2.5 right-2.5">
                    <Sparkles
                        className={cn('h-3.5 w-3.5', cfg.iconColor)}
                        aria-hidden
                    />
                </div>
            )}

            {/* Lock icon for locked cards */}
            {!item.achieved && (
                <div className="absolute top-2.5 right-2.5">
                    <Lock className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                </div>
            )}

            <div className="relative z-10 flex flex-col flex-1">
                {/* Icon + Title */}
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

                {/* Description */}
                <p
                    className={cn(
                        'mb-4 flex-1 text-sm leading-relaxed',
                        item.achieved ? cfg.textAccent + ' opacity-80' : 'text-zinc-500',
                    )}
                >
                    {desc}
                </p>

                {/* Progress section */}
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
                                item.achieved
                                    ? cfg.barColor
                                    : 'from-zinc-300 to-zinc-400',
                            )}
                            style={{ width: `${item.progress_pct}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Hover tooltip for locked cards */}
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

// ── Legacy Badge Card ──────────────────────────────────────────────────────────

function LegacyBadgeCard({ badge }: { badge: Badge }) {
    const { trans } = reactLang();
    const Icon =
        badge.icon && badge.icon in badgeIconMap
            ? badgeIconMap[badge.icon as keyof typeof badgeIconMap]
            : Trophy;

    return (
        <article
            className={cn(
                'relative flex flex-col rounded-2xl border-2 p-4 transition-all duration-300',
                badge.earned
                    ? 'border-amber-300 bg-linear-to-br from-amber-50 via-yellow-50 to-orange-50 shadow-md shadow-amber-100 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-200 dark:border-amber-700 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/30'
                    : 'border-zinc-200 bg-zinc-50 opacity-60 hover:opacity-80 dark:border-zinc-700 dark:bg-zinc-900',
            )}
        >
            {badge.earned && (
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-amber-400/10 via-yellow-300/5 to-transparent" />
            )}
            {!badge.earned && (
                <Lock className="absolute top-3 right-3 h-3.5 w-3.5 text-zinc-400" />
            )}

            <div className="relative z-10">
                <div className="mb-3 flex items-center gap-3">
                    <div
                        className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                            badge.earned
                                ? 'bg-amber-100 dark:bg-amber-900/50'
                                : 'bg-zinc-200 dark:bg-zinc-700',
                        )}
                    >
                        <Icon
                            className={cn(
                                'h-5 w-5',
                                badge.earned ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400',
                            )}
                        />
                    </div>
                    <div>
                        <p
                            className={cn(
                                'font-bold',
                                badge.earned
                                    ? 'text-amber-800 dark:text-amber-200'
                                    : 'text-zinc-500',
                            )}
                        >
                            {getTranslatedBadgeName(trans, badge)}
                        </p>
                        {badge.earned ? (
                            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                <Sparkles className="h-3 w-3" />
                                {trans('achievement.unlocked')}
                            </span>
                        ) : (
                            <p className="mt-0.5 text-xs text-zinc-400">
                                {trans('achievement.locked')}
                            </p>
                        )}
                    </div>
                </div>

                <p
                    className={cn(
                        'mb-3 text-sm leading-relaxed',
                        badge.earned
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-zinc-500',
                    )}
                >
                    {getTranslatedBadgeDescription(trans, badge)}
                </p>

                <div
                    className={cn(
                        'rounded-lg px-3 py-1.5 text-center text-xs font-semibold',
                        badge.earned
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800',
                    )}
                >
                    {badge.points_required} {trans('achievement.points')} {trans('achievement.required')}
                </div>
            </div>
        </article>
    );
}

// ── Category section header ────────────────────────────────────────────────────

function CategoryHeader({
    cat,
    items,
    earnedInCat,
}: {
    cat: string;
    items: AchievementItem[];
    earnedInCat: number;
}) {
    const { trans } = reactLang();
    const cfg = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.community;
    const total = items.length;

    return (
        <div className="flex items-center gap-3">
            <cfg.Icon className={cn('h-4.5 w-4.5 shrink-0', cfg.iconColor)} aria-hidden />
            <h3
                className={cn(
                    'text-base font-bold',
                    cfg.textAccent,
                )}
            >
                {trans(cfg.labelKey)}
            </h3>
            <span
                className={cn(
                    'ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    earnedInCat === total
                        ? [cfg.iconBg, cfg.iconColor]
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800',
                )}
            >
                {earnedInCat} / {total}
            </span>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Achievements', href: achievementsRoute() },
];

type FilterKey = 'all' | string;

export default function AchievementsPage() {
    const { trans } = reactLang();
    const { summary, badges, next_badge, achievements, user_progress } =
        usePage<PageProps>().props;

    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

    const earnedCount = achievements.filter((a) => a.achieved).length;
    const totalCount = achievements.length;
    const earnedBadges = badges.filter((b) => b.earned);

    // Compute category presence
    const presentCategories = CATEGORY_ORDER.filter((cat) =>
        achievements.some((a) => a.category === cat),
    );

    const grouped = CATEGORY_ORDER.reduce<Record<string, AchievementItem[]>>(
        (acc, cat) => {
            acc[cat] = achievements.filter((a) => a.category === cat);
            return acc;
        },
        {},
    );

    const displayCategories =
        activeFilter === 'all'
            ? presentCategories
            : presentCategories.filter((c) => c === activeFilter);

    return (
        <>
            <Head title={trans('navigation.achievements')} />

            <div className="w-full max-w-none px-4 pt-6 pb-24 md:px-6 md:pt-8">
                <div className="mx-auto w-full max-w-5xl space-y-8">

                    {/* ── Hero header ────────────────────────────────────────── */}
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

                    {/* ── Summary stats ──────────────────────────────────────── */}
                    <section className="grid gap-3 sm:grid-cols-3 md:grid-cols-6">
                        {[
                            { label: trans('achievement.points'), value: summary.points, color: 'text-amber-600' },
                            { label: trans('achievement.posts_created'), value: summary.posts_count, color: 'text-rose-600' },
                            { label: trans('achievement.likes_received'), value: summary.likes_received_count, color: 'text-pink-600' },
                            { label: trans('achievement.comments_count'), value: summary.comments_count, color: 'text-sky-600' },
                            { label: trans('achievement.saves_count'), value: summary.saved_posts_count, color: 'text-teal-600' },
                            { label: trans('achievement.quizzes_done'), value: user_progress?.quizzes_completed ?? 0, color: 'text-violet-600' },
                        ].map(({ label, value, color }) => (
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

                    {/* ── Next badge ────────────────────────────────────────── */}
                    {next_badge && (
                        <section className="rounded-2xl bg-linear-to-r from-zinc-900 to-zinc-800 px-5 py-4 text-zinc-100 shadow">
                            <p className="text-xs tracking-wide text-zinc-400 uppercase">
                                {trans('achievement.next_badge')}
                            </p>
                            <div className="mt-1.5 flex items-center justify-between gap-4">
                                <p className="font-semibold">
                                    {getTranslatedBadgeName(trans, next_badge)}
                                </p>
                                <p className="shrink-0 text-sm text-amber-400">
                                    {Math.max(next_badge.points_required - summary.points, 0)}{' '}
                                    {trans('achievement.points_to_unlock')}
                                </p>
                            </div>
                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                                <div
                                    className="h-full rounded-full bg-linear-to-r from-amber-400 to-yellow-400 transition-all duration-700"
                                    style={{
                                        width: `${Math.min(100, Math.round((summary.points / next_badge.points_required) * 100))}%`,
                                    }}
                                />
                            </div>
                        </section>
                    )}

                    {/* ── Quiz accuracy stats ───────────────────────────────── */}
                    {user_progress && user_progress.total_questions_answered > 0 && (
                        <section className="grid gap-3 sm:grid-cols-3">
                            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30">
                                <p className="text-xs tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                                    {trans('achievement.accuracy')}
                                </p>
                                <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                    {user_progress.accuracy_pct}%
                                </p>
                            </article>
                            <article className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                                <p className="text-xs tracking-wide text-zinc-500 uppercase">
                                    {trans('achievement.correct_answers')}
                                </p>
                                <p className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-100">
                                    {user_progress.correct_answers_count}{' '}
                                    <span className="text-base font-normal text-zinc-400">
                                        / {user_progress.total_questions_answered}
                                    </span>
                                </p>
                            </article>
                            <article
                                className={cn(
                                    'rounded-2xl border px-4 py-3 shadow-sm',
                                    user_progress.improvement_score > 0
                                        ? 'border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30'
                                        : user_progress.improvement_score < 0
                                          ? 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30'
                                          : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900',
                                )}
                            >
                                <p className="text-xs tracking-wide text-zinc-500 uppercase">
                                    {trans('achievement.improvement')}
                                </p>
                                <p
                                    className={cn(
                                        'mt-1 text-2xl font-black',
                                        user_progress.improvement_score > 0
                                            ? 'text-violet-700 dark:text-violet-300'
                                            : user_progress.improvement_score < 0
                                              ? 'text-rose-700 dark:text-rose-300'
                                              : 'text-zinc-900 dark:text-zinc-100',
                                    )}
                                >
                                    {user_progress.improvement_score > 0 ? '+' : ''}
                                    {user_progress.improvement_score}%
                                </p>
                            </article>
                        </section>
                    )}

                    {/* ── Category filter tabs ─────────────────────────────── */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveFilter('all')}
                            className={cn(
                                'rounded-full border px-4 py-1.5 text-sm font-semibold transition',
                                activeFilter === 'all'
                                    ? 'border-zinc-800 bg-zinc-900 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-900'
                                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
                            )}
                        >
                            {trans('achievement.filter_all')}
                        </button>
                        {presentCategories.map((cat) => {
                            const cfg = CATEGORY_CONFIG[cat];
                            const isActive = activeFilter === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveFilter(cat)}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                                        isActive
                                            ? [cfg.border, cfg.badgeBg, cfg.textAccent]
                                            : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900',
                                    )}
                                >
                                    <cfg.Icon className="h-3.5 w-3.5 shrink-0" />
                                    {trans(cfg.labelKey)}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Achievement cards by category ─────────────────────── */}
                    <section className="space-y-8">
                        {displayCategories.map((cat) => {
                            const items = grouped[cat] ?? [];
                            if (items.length === 0) return null;
                            const earnedInCat = items.filter((i) => i.achieved).length;

                            return (
                                <div key={cat} className="space-y-3">
                                    <CategoryHeader
                                        cat={cat}
                                        items={items}
                                        earnedInCat={earnedInCat}
                                    />
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {items.map((item) => (
                                            <AchievementCard key={item.key} item={item} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    {/* ── Points badges (legacy) ────────────────────────────── */}
                    {badges.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                    {trans('achievement.points_badges')}
                                </h2>
                                <span className="ml-auto text-sm text-zinc-500">
                                    {earnedBadges.length} / {badges.length}{' '}
                                    {trans('achievement.unlocked')}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {badges.map((badge) => (
                                    <LegacyBadgeCard key={badge.id} badge={badge} />
                                ))}
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

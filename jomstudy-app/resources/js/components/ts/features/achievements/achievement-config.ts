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
    MessageCircle,
    MessageSquare,
    MessagesSquare,
    PenLine,
    Search,
    Sparkles,
    Star,
    Target,
    ThumbsUp,
    Trophy,
    Users,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const achievementIconMap = {
    BookOpen,
    HelpCircle,
    GraduationCap,
    Target,
    BarChart2,
    ThumbsUp,
    Award,
    Trophy,
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

export const badgeIconMap = {
    Sparkles,
    Star,
    Trophy,
    Crown,
    Award,
} as const;

export type CategoryConfig = {
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

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
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

export const CATEGORY_ORDER = [
    'posting',
    'question',
    'commenting',
    'performance',
    'saving',
    'mistakes',
    'community',
];

export const HIDDEN_ACHIEVEMENT_KEYS = new Set([
    'consistent_growth',
    'fast_improver',
    'quiz_completionist',
]);

export const ACHIEVEMENT_META: Record<
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
    perfect_scorer: {
        titleKey: 'achievement.perfect_scorer_title',
        descKey: 'achievement.perfect_scorer_desc',
        unitKey: 'achievement.unit_percent',
    },
    community_star: {
        titleKey: 'achievement.community_star_title',
        descKey: 'achievement.community_star_desc',
        unitKey: 'achievement.unit_likes',
    },
};

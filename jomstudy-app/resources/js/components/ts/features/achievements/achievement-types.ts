export type Badge = {
    id: number;
    key: string;
    name: string;
    description: string;
    icon?: string | null;
    points_required: number;
    awarded_at?: string | null;
    earned: boolean;
};

export type AchievementItem = {
    key: string;
    category: string;
    icon: string;
    threshold: number;
    current: number;
    progress_pct: number;
    achieved: boolean;
    achieved_at: string | null;
};

export type UserProgressData = {
    total_questions_answered: number;
    total_questions_posted: number;
    quizzes_completed: number;
    correct_answers_count: number;
    total_likes_received: number;
    improvement_score: number;
    accuracy_pct: number;
};

export type PageProps = {
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

export type HomePageContext = 'home' | 'questions' | 'materials';

export type HomeLearningOverview = {
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

export type HomeLearningDashboardText = {
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

export type HomeLearningDashboardProps = {
    overview?: HomeLearningOverview;
    text: HomeLearningDashboardText;
    onOpenPost: (postId: number) => void;
};

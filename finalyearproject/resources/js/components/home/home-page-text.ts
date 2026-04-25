type PageLike = {
    props?: Record<string, unknown>;
};

export function transFromPage(key: string, page: PageLike): string {
    const parts = key.split('.');
    let obj: unknown = page.props?.lang;

    for (const part of parts) {
        if (obj && typeof obj === 'object' && part in obj) {
            obj = (obj as Record<string, unknown>)[part];
        } else {
            return key;
        }
    }

    return typeof obj === 'string' ? obj : key;
}

export function buildHomeText(page: PageLike) {
    return {
        pageTitle: transFromPage('home.page_title', page),
        heroTitle: transFromPage('home.hero_title', page),
        heroSubtitle: transFromPage('home.hero_subtitle', page),
        studyCircleTitle: transFromPage('navigation.following', page),
        studyCircleSubtitle: transFromPage('home.study_circle_subtitle', page),
        learnTab: transFromPage('home.learn_tab', page),
        feedTab: transFromPage('home.feed_tab', page),
        learningMilestones: transFromPage('home.learning_milestones', page),
        learningMilestonesSubtitle: transFromPage(
            'home.learning_milestones_subtitle',
            page,
        ),
        latestPosts: transFromPage('home.latest_posts', page),
        latestPostsSubtitle: transFromPage('home.latest_posts_subtitle', page),
        yourRecentPosts: transFromPage('home.your_recent_posts', page),
        communityLatestPosts: transFromPage(
            'home.community_latest_posts',
            page,
        ),
        noPostsYet: transFromPage('home.no_posts_yet', page),
        noPostsHint: transFromPage('home.no_posts_hint', page),
        todayScore: transFromPage('home.today_score', page),
        todayScoreSubtitle: transFromPage('home.today_score_subtitle', page),
        xpEarnedToday: transFromPage('home.xp_earned_today', page),
        quizzesCompletedToday: transFromPage(
            'home.quizzes_completed_today',
            page,
        ),
        pointsPerQuiz: transFromPage('home.points_per_quiz', page),
        mistakeReview: transFromPage('home.mistake_review', page),
        mistakeReviewSubtitle: transFromPage(
            'home.mistake_review_subtitle',
            page,
        ),
        noMistakesYet: transFromPage('home.no_mistakes_yet', page),
        noMistakesHint: transFromPage('home.no_mistakes_hint', page),
        reviewAgain: transFromPage('home.review_again', page),
        remainingToUnlock: transFromPage('home.remaining_to_unlock', page),
        milestoneUnlocked: transFromPage('home.milestone_unlocked', page),
        viewAchievements: transFromPage('home.view_achievements', page),
        yourAnswer: transFromPage('home.your_answer', page),
        correctAnswer: transFromPage('home.correct_answer', page),
        untitledPost: transFromPage('home.untitled_post', page),
        emptyFeed: transFromPage('home.empty_feed', page),
        createQuiz: transFromPage('createPost.create_quiz', page),
        askQuestion: transFromPage('createPost.ask_question', page),
        shareMaterial: transFromPage('createPost.share_material', page),
        langEn: transFromPage('language_label.en', page),
        langZh: transFromPage('language_label.zh', page),
        langBm: transFromPage('language_label.bm', page),
        unknownUser: transFromPage('home.unknown_user', page),
        userAvatarAlt: transFromPage('home.user_avatar_alt', page),
    };
}

export function getLangBadgeProps(code: string) {
    if (code === 'en') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (code === 'zh') return { bg: 'bg-red-100', text: 'text-red-700' };
    if (code === 'bm' || code === 'my')
        return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-gray-200', text: 'text-gray-700' };
}

export function getPostTypeBadgeProps(type: string) {
    if (type === 'quiz') return { bg: 'bg-amber-100', text: 'text-amber-700' };
    if (type === 'question')
        return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    return { bg: 'bg-violet-100', text: 'text-violet-700' };
}

export function getSubjectBadgeProps() {
    return { bg: 'bg-slate-100', text: 'text-slate-700' };
}

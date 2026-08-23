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
        followingTitle: transFromPage('navigation.following', page),
        followingSubtitle: transFromPage('home.following_subtitle', page),
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
        leaderboardPointsTotal: transFromPage(
            'home.leaderboard_points_total',
            page,
        ),
        leaderboardPointUnit: transFromPage(
            'home.leaderboard_point_unit',
            page,
        ),
        leaderboardRank: transFromPage('home.leaderboard_rank', page),
        pointsToNextRank: transFromPage('home.points_to_next_rank', page),
        rankHidden: transFromPage('home.rank_hidden', page),
        topRank: transFromPage('home.top_rank', page),
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
        emptyFeedTitle: transFromPage('home.empty_feed_title', page),
        emptyFeedSubtitle: transFromPage('home.empty_feed_subtitle', page),
        emptyFeedAction: transFromPage('home.empty_feed_action', page),
        followingEmptyTitle: transFromPage('home.following_empty_title', page),
        followingEmptySubtitle: transFromPage(
            'home.following_empty_subtitle',
            page,
        ),
        followingEmptyAction: transFromPage(
            'home.following_empty_action',
            page,
        ),
        followingEmptySecondaryAction: transFromPage(
            'home.following_empty_secondary_action',
            page,
        ),
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

// Returns the text props for PostFeedSection with hardcoded fallbacks when i18n keys are missing.
export function buildFeedSectionText(homeText: ReturnType<typeof buildHomeText>) {
    const fallback = (value: string, key: string, def: string) =>
        value === key ? def : value;

    return {
        emptyFeed: fallback(homeText.emptyFeed, 'home.empty_feed', 'No posts yet.'),
        emptyFeedTitle: fallback(homeText.emptyFeedTitle, 'home.empty_feed_title', 'No posts yet'),
        emptyFeedSubtitle: fallback(
            homeText.emptyFeedSubtitle,
            'home.empty_feed_subtitle',
            'Fresh posts from the community will appear here.',
        ),
        emptyFeedAction: fallback(
            homeText.emptyFeedAction,
            'home.empty_feed_action',
            'Browse categories',
        ),
        followingEmptyTitle: fallback(
            homeText.followingEmptyTitle,
            'home.following_empty_title',
            'No following updates yet',
        ),
        followingEmptySubtitle: fallback(
            homeText.followingEmptySubtitle,
            'home.following_empty_subtitle',
            'Follow classmates from community posts, then their newest posts will appear here.',
        ),
        followingEmptyAction: fallback(
            homeText.followingEmptyAction,
            'home.following_empty_action',
            'Explore posts',
        ),
        followingEmptySecondaryAction: fallback(
            homeText.followingEmptySecondaryAction,
            'home.following_empty_secondary_action',
            'View trends',
        ),
        createQuiz: homeText.createQuiz,
        askQuestion: homeText.askQuestion,
        shareMaterial: homeText.shareMaterial,
        unknownUser: fallback(homeText.unknownUser, 'home.unknown_user', 'Unknown User'),
        userAvatarAlt: fallback(homeText.userAvatarAlt, 'home.user_avatar_alt', 'User avatar'),
        langEn: fallback(homeText.langEn, 'language_label.en', 'English'),
        langZh: fallback(homeText.langZh, 'language_label.zh', '中文'),
        langBm: fallback(homeText.langBm, 'language_label.bm', 'Bahasa Malaysia'),
    };
}

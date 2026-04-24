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
        continueLearningHeading: transFromPage('home.continue_learning_heading', page),
        continueLearningEmpty: transFromPage('home.continue_learning_empty', page),
        resumeWith: transFromPage('home.resume_with', page),
        continueNow: transFromPage('home.continue_now', page),
        todayGoal: transFromPage('home.today_goal', page),
        currentSubjectExperience: transFromPage('home.current_subject_experience', page),
        xp: transFromPage('home.xp', page),
        level: transFromPage('home.level', page),
        materialsCompleted: transFromPage('home.materials_completed', page),
        questionsPosted: transFromPage('home.questions_posted', page),
        quizzesCompleted: transFromPage('home.quizzes_completed', page),
        quizzesCreated: transFromPage('home.quizzes_created', page),
        recommendedMaterials: transFromPage('home.recommended_materials', page),
        noRecommendation: transFromPage('home.no_recommendation', page),
        achievementGoal: transFromPage('home.achievement_goal', page),
        achievementPoints: transFromPage('home.achievement_points', page),
        lessonsCompleted: transFromPage('home.lessons_completed', page),
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
    if (code === 'bm' || code === 'my') return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-gray-200', text: 'text-gray-700' };
}

export function getPostTypeBadgeProps(type: string) {
    if (type === 'quiz') return { bg: 'bg-amber-100', text: 'text-amber-700' };
    if (type === 'question') return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    return { bg: 'bg-violet-100', text: 'text-violet-700' };
}

export function getSubjectBadgeProps() {
    return { bg: 'bg-slate-100', text: 'text-slate-700' };
}

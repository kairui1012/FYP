import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState, type ReactNode } from 'react';
import { ContinueLearningCard } from '@/components/home/continue-learning-card';
import { HomeFeedSection } from '@/components/home/home-feed-section';
import { HomeHeroSection } from '@/components/home/home-hero-section';
import { SubjectExperiencePanel } from '@/components/home/subject-experience-panel';
import { TodayGoalCard } from '@/components/home/today-goal-card';
import { buildHomeText } from '@/components/home/home-page-text';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import like from '@/routes/like';
import type { BreadcrumbItem, PostItem } from '@/types';

type HomePageProps = {
    posts?: PostItem[];
    learningOverview?: {
        continue_learning?: {
            lesson_id: number;
            post_id: number;
            title: string;
            subject_id: number | null;
            subject_name: string | null;
        } | null;
        current_subject_experience?: {
            subject_id: number | null;
            subject_name: string | null;
            total_xp: number;
            level: number;
            xp_in_level: number;
            xp_per_level: number;
            progress_percent: number;
            completed_materials: number;
            questions_posted: number;
            quizzes_completed: number;
            quizzes_created: number;
        } | null;
        subject_experiences?: Array<{
            subject_id: number | null;
            subject_name: string | null;
            total_xp: number;
            level: number;
            xp_in_level: number;
            xp_per_level: number;
            progress_percent: number;
            completed_materials: number;
            questions_posted: number;
            quizzes_completed: number;
            quizzes_created: number;
        }>;
        recommended_materials?: Array<{
            post_id: number;
            lesson_id: number;
            subject_id: number | null;
            subject_name: string | null;
            title: string;
            reason: string;
        }>;
        today_goal?: {
            target_points: number;
            earned_points: number;
            completed_lessons: number;
            progress_percent: number;
        } | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Home',
        href: homePage(),
    },
];

export default function HomePage({ posts = [], learningOverview }: HomePageProps) {
    const page = usePage();
    const currentUserId = (page.props as { auth?: { user?: { id?: number } } }).auth?.user?.id;
    const pageContext = (page.props as { pageContext?: 'home' | 'following' }).pageContext ?? 'home';
    const isHomePage = pageContext === 'home';
    const isStudyCirclePage = pageContext === 'following';
    const [activeTab, setActiveTab] = useState<'learn' | 'feed'>(isHomePage ? 'learn' : 'feed');

    const [likeStateByPost, setLikeStateByPost] = useState<Record<number, { liked: boolean; likesCount: number }>>(
        () =>
            Object.fromEntries(
                posts.map((post) => [
                    post.id,
                    {
                        liked: Boolean(post.is_liked),
                        likesCount: post.likes_count ?? 0,
                    },
                ])
            )
    );
    const [likingPostIds, setLikingPostIds] = useState<number[]>([]);

    const [saveStateByPost, setSaveStateByPost] = useState<Record<number, { saved: boolean; savesCount: number }>>(
        () =>
            Object.fromEntries(
                posts.map((post) => [
                    post.id,
                    {
                        saved: Boolean(post.is_saved),
                        savesCount: post.saves_count ?? 0,
                    },
                ])
            )
    );
    const [savingPostIds, setSavingPostIds] = useState<number[]>([]);

    const [followStateByUser, setFollowStateByUser] = useState<Record<number, boolean>>(() => {
        const states: Record<number, boolean> = {};
        posts.forEach((post) => {
            if (post.user?.id) {
                states[post.user.id] = Boolean(post.user.is_following);
            }
        });
        return states;
    });
    const [followingUserIds, setFollowingUserIds] = useState<number[]>([]);

    const todayGoal = learningOverview?.today_goal ?? {
        target_points: 10,
        earned_points: 0,
        completed_lessons: 0,
        progress_percent: 0,
    };

    const emptySubjectExperience = {
        subject_id: null,
        subject_name: null,
        total_xp: 0,
        level: 1,
        xp_in_level: 0,
        xp_per_level: 100,
        progress_percent: 0,
        completed_materials: 0,
        questions_posted: 0,
        quizzes_completed: 0,
        quizzes_created: 0,
    };

    const subjectExperiences = learningOverview?.subject_experiences?.length
        ? learningOverview.subject_experiences
        : [learningOverview?.current_subject_experience ?? emptySubjectExperience];

    const continueLearningItem = learningOverview?.continue_learning ?? null;
    const homeText = buildHomeText(page as any);

    useEffect(() => {
        if (!isHomePage) {
            setActiveTab('feed');
        }
    }, [isHomePage]);

    useEffect(() => {
        document.documentElement.classList.remove('nprogress-busy');
        document.body.classList.remove('nprogress-busy');
        document.documentElement.style.cursor = '';
        document.body.style.cursor = '';
    }, []);

    const goToPost = (postId: number) => {
        router.get(`/posts/${postId}`);
    };

    const goToPostComments = (postId: number) => {
        router.visit(`/posts/${postId}?focus=comments`);
    };

    const handleLike = async (postId: number) => {
        if (likingPostIds.includes(postId)) {
            return;
        }

        const previous = likeStateByPost[postId] ?? { liked: false, likesCount: 0 };
        const optimisticLiked = !previous.liked;
        const optimisticLikesCount = Math.max(0, previous.likesCount + (optimisticLiked ? 1 : -1));

        setLikingPostIds((prev) => [...prev, postId]);
        setLikeStateByPost((prev) => ({
            ...prev,
            [postId]: {
                liked: optimisticLiked,
                likesCount: optimisticLikesCount,
            },
        }));

        router.post(
            like.toggle.url({ posts: postId }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    setLikeStateByPost((prev) => ({
                        ...prev,
                        [postId]: previous,
                    }));
                },
                onSuccess: (nextPage) => {
                    const nextPosts = ((nextPage.props as { posts?: PostItem[] }).posts ?? []);
                    setLikeStateByPost(
                        Object.fromEntries(
                            nextPosts.map((post) => [
                                post.id,
                                {
                                    liked: Boolean(post.is_liked),
                                    likesCount: post.likes_count ?? 0,
                                },
                            ])
                        )
                    );
                },
                onFinish: () => {
                    setLikingPostIds((prev) => prev.filter((id) => id !== postId));
                },
            }
        );
    };

    const handleSave = async (postId: number) => {
        if (savingPostIds.includes(postId)) {
            return;
        }

        const previous = saveStateByPost[postId] ?? { saved: false, savesCount: 0 };
        const optimisticSaved = !previous.saved;
        const optimisticSavesCount = Math.max(0, previous.savesCount + (optimisticSaved ? 1 : -1));

        setSavingPostIds((prev) => [...prev, postId]);
        setSaveStateByPost((prev) => ({
            ...prev,
            [postId]: {
                saved: optimisticSaved,
                savesCount: optimisticSavesCount,
            },
        }));

        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

        try {
            const response = await fetch(`/posts/${postId}/save`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to toggle save.');
            }

            const payload = (await response.json()) as { saved: boolean; saves_count: number };
            setSaveStateByPost((prev) => ({
                ...prev,
                [postId]: {
                    saved: payload.saved,
                    savesCount: payload.saves_count,
                },
            }));
        } catch {
            setSaveStateByPost((prev) => ({
                ...prev,
                [postId]: previous,
            }));
        } finally {
            setSavingPostIds((prev) => prev.filter((id) => id !== postId));
        }
    };

    const handleFollowToggle = async (userId: number) => {
        if (followingUserIds.includes(userId)) {
            return;
        }

        const previous = followStateByUser[userId] ?? false;
        const optimistic = !previous;

        setFollowingUserIds((prev) => [...prev, userId]);
        setFollowStateByUser((prev) => ({
            ...prev,
            [userId]: optimistic,
        }));

        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

        try {
            const response = await fetch(`/users/${userId}/follow`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Follow toggle failed.');
            }

            const payload = (await response.json()) as { is_following: boolean };
            setFollowStateByUser((prev) => ({
                ...prev,
                [userId]: payload.is_following,
            }));
        } catch {
            setFollowStateByUser((prev) => ({
                ...prev,
                [userId]: previous,
            }));
        } finally {
            setFollowingUserIds((prev) => prev.filter((id) => id !== userId));
        }
    };

    return (
        <>
            <Head title={homeText.pageTitle} />
            <div className="pb-8">
                <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-6 md:pb-10">
                    <HomeHeroSection
                        isHomePage={isHomePage}
                        isStudyCirclePage={isStudyCirclePage}
                        activeTab={activeTab}
                        onChangeTab={setActiveTab}
                        text={{
                            heroTitle: homeText.heroTitle,
                            heroSubtitle: homeText.heroSubtitle,
                            studyCircleTitle: homeText.studyCircleTitle,
                            studyCircleSubtitle: homeText.studyCircleSubtitle,
                            learnTab: homeText.learnTab,
                            feedTab: homeText.feedTab,
                        }}
                    />

                    {isHomePage && activeTab === 'learn' ? (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <ContinueLearningCard
                                item={continueLearningItem}
                                onContinue={goToPost}
                                text={{
                                    continueLearningHeading: homeText.continueLearningHeading,
                                    continueLearningEmpty: homeText.continueLearningEmpty,
                                    resumeWith: homeText.resumeWith,
                                    continueNow: homeText.continueNow,
                                }}
                            />

                            <TodayGoalCard
                                todayGoal={todayGoal}
                                text={{
                                    todayGoal: homeText.todayGoal,
                                    achievementPoints: homeText.achievementPoints,
                                    achievementGoal: homeText.achievementGoal,
                                    lessonsCompleted: homeText.lessonsCompleted,
                                }}
                            />

                            <SubjectExperiencePanel
                                experiences={subjectExperiences}
                                labels={{
                                    currentSubjectExperience: homeText.currentSubjectExperience,
                                    xp: homeText.xp,
                                    level: homeText.level,
                                    materialsCompleted: homeText.materialsCompleted,
                                    questionsPosted: homeText.questionsPosted,
                                    quizzesCompleted: homeText.quizzesCompleted,
                                    quizzesCreated: homeText.quizzesCreated,
                                }}
                            />
                        </div>
                    ) : (
                        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 md:p-5">
                            <HomeFeedSection
                                posts={posts}
                                currentUserId={currentUserId}
                                likeStateByPost={likeStateByPost}
                                saveStateByPost={saveStateByPost}
                                followStateByUser={followStateByUser}
                                likingPostIds={likingPostIds}
                                savingPostIds={savingPostIds}
                                followingUserIds={followingUserIds}
                                onOpenPost={goToPost}
                                onOpenComments={goToPostComments}
                                onToggleLike={handleLike}
                                onToggleSave={handleSave}
                                onToggleFollow={handleFollowToggle}
                                text={{
                                    emptyFeed: homeText.emptyFeed === 'home.empty_feed' ? 'No posts yet.' : homeText.emptyFeed,
                                    createQuiz: homeText.createQuiz,
                                    askQuestion: homeText.askQuestion,
                                    shareMaterial: homeText.shareMaterial,
                                    unknownUser: homeText.unknownUser === 'home.unknown_user' ? 'Unknown User' : homeText.unknownUser,
                                    userAvatarAlt: homeText.userAvatarAlt === 'home.user_avatar_alt' ? 'User avatar' : homeText.userAvatarAlt,
                                    langEn: homeText.langEn === 'language_label.en' ? 'English' : homeText.langEn,
                                    langZh: homeText.langZh === 'language_label.zh' ? '中文' : homeText.langZh,
                                    langBm: homeText.langBm === 'language_label.bm' ? 'Bahasa Malaysia' : homeText.langBm,
                                }}
                            />
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}

HomePage.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;

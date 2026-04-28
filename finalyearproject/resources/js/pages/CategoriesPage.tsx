import { reactLang } from '@erag/lang-sync-inertia';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
    CONTENT_TYPES,
    hasActiveFilters,
} from '@/components/categories/categories-config';
import { CategoryFiltersPanel } from '@/components/categories/category-filters-panel';
import { CategoryResultsPanel } from '@/components/categories/category-results-panel';
import type {
    CategoriesPageProps,
    ContentTypeKey,
} from '@/components/categories/types';
import AppLayout from '@/layouts/app-layout';
import { categories as categoriesRoute } from '@/routes';
import like from '@/routes/like';
import type { BreadcrumbItem, PostItem } from '@/types';

function csrfHeaders() {
    const csrfToken =
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? '';

    return {
        Accept: 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
    };
}

export default function CategoriesPage() {
    const { trans } = reactLang();
    const page = usePage<CategoriesPageProps>();
    const { props } = page;
    const currentUserId = (page.props as { auth?: { user?: { id?: number } } })
        .auth?.user?.id;

    const languages = useMemo(() => props.languages ?? [], [props.languages]);
    const subjects = useMemo(() => props.subjects ?? [], [props.subjects]);

    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedType, setSelectedType] = useState<ContentTypeKey | ''>('');
    const [view, setView] = useState<'filters' | 'results'>('filters');
    const [localPosts, setLocalPosts] = useState<PostItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [likingPostIds, setLikingPostIds] = useState<number[]>([]);
    const [savingPostIds, setSavingPostIds] = useState<number[]>([]);
    const [likeStateByPost, setLikeStateByPost] = useState<
        Record<number, { liked: boolean; likesCount: number }>
    >({});
    const [saveStateByPost, setSaveStateByPost] = useState<
        Record<number, { saved: boolean; savesCount: number }>
    >({});
    const [followStateByUser, setFollowStateByUser] = useState<
        Record<number, boolean>
    >({});
    const [followingUserIds, setFollowingUserIds] = useState<number[]>([]);

    useEffect(() => {
        if (props.filteredPosts !== undefined) {
            setLocalPosts(props.filteredPosts);
            setLikeStateByPost({});
            setSaveStateByPost({});
            // Seed follow state from server data so toggle handler reads correct initial state
            const states: Record<number, boolean> = {};
            props.filteredPosts.forEach((post) => {
                if (post.user?.id) {
                    states[post.user.id] = Boolean(post.user.is_following);
                }
            });
            setFollowStateByUser(states);
            setFollowingUserIds([]);
            setView('results');
            setIsLoading(false);
        }
    }, [props.filteredPosts]);

    const totalPosts = useMemo(() => {
        const languageCount = languages.reduce(
            (sum, item) => sum + (item.posts_count ?? 0),
            0,
        );
        const subjectCount = subjects.reduce(
            (sum, item) => sum + (item.posts_count ?? 0),
            0,
        );

        return Math.max(languageCount, subjectCount);
    }, [languages, subjects]);

    const isFiltering = hasActiveFilters(
        selectedLanguage,
        selectedSubject,
        selectedType,
    );

    const clearAll = () => {
        setSelectedLanguage('');
        setSelectedSubject('');
        setSelectedType('');
    };

    const fetchPosts = (query: Record<string, string> = {}) => {
        setIsLoading(true);
        router.visit('/categories', {
            method: 'get',
            data: query,
            only: ['filteredPosts'],
            preserveState: true,
            preserveScroll: true,
        });
    };

    const applyFilters = () => {
        const activeType =
            selectedType && selectedType !== 'all'
                ? (CONTENT_TYPES.find((type) => type.key === selectedType)
                      ?.queryValue ?? '')
                : '';

        fetchPosts({
            ...(selectedLanguage ? { language_code: selectedLanguage } : {}),
            ...(selectedSubject ? { subject_id: selectedSubject } : {}),
            ...(activeType ? { post_type: activeType } : {}),
        });
    };

    const handleLike = (postId: number) => {
        if (likingPostIds.includes(postId)) return;

        const post = localPosts.find((item) => item.id === postId);
        const previous = likeStateByPost[postId] ?? {
            liked: Boolean(post?.is_liked),
            likesCount: post?.likes_count ?? 0,
        };
        const optimisticLiked = !previous.liked;
        const optimisticCount = Math.max(
            0,
            previous.likesCount + (optimisticLiked ? 1 : -1),
        );

        setLikingPostIds((prev) => [...prev, postId]);
        setLikeStateByPost((prev) => ({
            ...prev,
            [postId]: { liked: optimisticLiked, likesCount: optimisticCount },
        }));

        router.post(
            like.toggle.url({ posts: postId }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onError: () =>
                    setLikeStateByPost((prev) => ({
                        ...prev,
                        [postId]: previous,
                    })),
                onFinish: () =>
                    setLikingPostIds((prev) =>
                        prev.filter((id) => id !== postId),
                    ),
            },
        );
    };

    const handleSave = async (postId: number) => {
        if (savingPostIds.includes(postId)) return;

        const post = localPosts.find((item) => item.id === postId);
        const previous = saveStateByPost[postId] ?? {
            saved: Boolean(post?.is_saved),
            savesCount: post?.saves_count ?? 0,
        };
        const optimisticSaved = !previous.saved;
        const optimisticCount = Math.max(
            0,
            previous.savesCount + (optimisticSaved ? 1 : -1),
        );

        setSavingPostIds((prev) => [...prev, postId]);
        setSaveStateByPost((prev) => ({
            ...prev,
            [postId]: { saved: optimisticSaved, savesCount: optimisticCount },
        }));

        try {
            const response = await fetch(`/posts/${postId}/save`, {
                method: 'POST',
                headers: csrfHeaders(),
            });
            if (!response.ok) throw new Error();

            const payload = (await response.json()) as {
                saved: boolean;
                saves_count: number;
            };
            setSaveStateByPost((prev) => ({
                ...prev,
                [postId]: {
                    saved: payload.saved,
                    savesCount: payload.saves_count,
                },
            }));
        } catch {
            setSaveStateByPost((prev) => ({ ...prev, [postId]: previous }));
        } finally {
            setSavingPostIds((prev) => prev.filter((id) => id !== postId));
        }
    };

    const handleFollowToggle = async (userId: number) => {
        if (followingUserIds.includes(userId)) return;

        const previous = followStateByUser[userId] ?? false;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        setFollowingUserIds((prev) => [...prev, userId]);
        setFollowStateByUser((prev) => ({ ...prev, [userId]: !previous }));

        try {
            const response = await fetch(`/users/${userId}/follow`, {
                method: 'POST',
                signal: controller.signal,
                headers: csrfHeaders(),
            });
            if (!response.ok) throw new Error();

            const payload = (await response.json()) as {
                is_following: boolean;
            };
            setFollowStateByUser((prev) => ({
                ...prev,
                [userId]: payload.is_following,
            }));
            sessionStorage.setItem('followingPageDirty', '1');
        } catch {
            setFollowStateByUser((prev) => ({ ...prev, [userId]: previous }));
        } finally {
            clearTimeout(timeout);
            setFollowingUserIds((prev) => prev.filter((id) => id !== userId));
        }
    };

    return (
        <>
            <Head title={trans('navigation.categories')} />

            {view === 'results' ? (
                <CategoryResultsPanel
                    languages={languages}
                    subjects={subjects}
                    posts={localPosts}
                    selectedLanguage={selectedLanguage}
                    selectedSubject={selectedSubject}
                    selectedType={selectedType}
                    isLoading={isLoading}
                    currentUserId={currentUserId}
                    likingPostIds={likingPostIds}
                    savingPostIds={savingPostIds}
                    followingUserIds={followingUserIds}
                    likeStateByPost={likeStateByPost}
                    saveStateByPost={saveStateByPost}
                    followStateByUser={followStateByUser}
                    trans={trans}
                    onBackToFilters={() => setView('filters')}
                    onLike={handleLike}
                    onSave={handleSave}
                    onFollowToggle={handleFollowToggle}
                />
            ) : (
                <CategoryFiltersPanel
                    languages={languages}
                    subjects={subjects}
                    selectedLanguage={selectedLanguage}
                    selectedSubject={selectedSubject}
                    selectedType={selectedType}
                    totalPosts={totalPosts}
                    isFiltering={isFiltering}
                    trans={trans}
                    onSelectedLanguageChange={setSelectedLanguage}
                    onSelectedSubjectChange={setSelectedSubject}
                    onSelectedTypeChange={setSelectedType}
                    onClearAll={clearAll}
                    onViewAllPosts={() => fetchPosts()}
                    onApplyFilters={applyFilters}
                />
            )}
        </>
    );
}

function CategoriesPageLayout({ page }: { page: ReactNode }) {
    const { trans } = reactLang();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: trans('navigation.categories'),
            href: categoriesRoute(),
        },
    ];

    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
}

CategoriesPage.layout = (page: ReactNode) => (
    <CategoriesPageLayout page={page} />
);

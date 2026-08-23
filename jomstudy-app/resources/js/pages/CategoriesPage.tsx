import { reactLang } from '@erag/lang-sync-inertia';
import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { CategoryFiltersPanel } from '@/components/categories/category-filters-panel';
import { CategoryResultsPanel } from '@/components/categories/category-results-panel';
import type { CategoriesPageProps } from '@/components/categories/types';
import { useCategoryFilters } from '@/hooks/use-category-filters';
import { usePostInteractions } from '@/hooks/use-post-interactions';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import AppLayout from '@/layouts/app-layout';
import { categories as categoriesRoute } from '@/routes';
import type { BreadcrumbItem } from '@/types';

export default function CategoriesPage() {
    const { trans } = reactLang();
    const page = usePage<CategoriesPageProps>();
    const currentUserId = (page.props as { auth?: { user?: { id?: number } } })
        .auth?.user?.id;

    const {
        languages,
        subjects,
        selectedLanguage,
        setSelectedLanguage,
        selectedSubject,
        setSelectedSubject,
        selectedType,
        setSelectedType,
        view,
        setView,
        localPosts,
        pagination,
        isLoading,
        totalPosts,
        isFiltering,
        clearAll,
        fetchPosts,
        applyFilters,
    } = useCategoryFilters(page.props);

    const {
        likeStateByPost,
        likingPostIds,
        saveStateByPost,
        savingPostIds,
        followStateByUser,
        followingUserIds,
        handleLike,
        handleSave,
        handleFollowToggle,
    } = usePostInteractions(localPosts);

    // Only re-fetch the result list on focus (not the whole page) so the user's
    // chosen filters and view stay intact while like/save/follow state updates.
    useRefreshOnFocus(['filteredPosts']);

    return (
        <>
            <Head title={trans('navigation.categories')} />

            {view === 'results' ? (
                <CategoryResultsPanel
                    languages={languages}
                    subjects={subjects}
                    posts={localPosts}
                    pagination={pagination}
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

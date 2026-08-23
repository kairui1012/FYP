import { reactLang } from '@erag/lang-sync-inertia';
import { Head } from '@inertiajs/react';
import { Bookmark, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { QuizReviewList } from '@/components/studyfolder/quiz-review-list';
import { SavedPostsPanel } from '@/components/studyfolder/saved-posts-panel';
import { SidebarFolderItem } from '@/components/studyfolder/sidebar-folder-item';
import { useStudyFolder } from '@/components/studyfolder/use-study-folder';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My Study Folder', href: '/bookmarks' },
];

export default function StudyFolderPage() {
    const { trans } = reactLang();
    const {
        posts,
        correctCount,
        wrongCount,
        quizReviewItems,
        activeQuizMode,
        isQuizFolder,
        totalSaves,
        savedQuizzesCount,
        savingPostIds,
        refreshSavedPosts,
        navigateQuizFolder,
        handleToggleSave,
    } = useStudyFolder();

    // Saved-post lists are loaded server-side; re-fetch on focus so saves
    // toggled on other pages show up here without a manual refresh.
    useRefreshOnFocus();

    return (
        <>
            <Head title={trans('navigation.bookmarks')} />

            <div className="w-full max-w-none p-4 pb-24 md:p-6 md:pb-24">
                <div className="mx-auto w-full max-w-6xl space-y-5">
                    <section className="px-1 py-2">
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div className="max-w-2xl">
                                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                                    {trans('navigation.bookmarks')}
                                </h1>
                                <p className="mt-2 text-sm leading-6 text-zinc-600">
                                    {trans('bookmark.description')}
                                </p>
                            </div>

                            <div className="flex w-full flex-wrap items-center gap-2.5 lg:justify-end">
                                <div className="inline-flex items-center gap-1.5 text-sm">
                                    <span className="inline-flex items-center text-zinc-500">
                                        <Bookmark className="h-4 w-4" />
                                    </span>
                                    <span className="text-xs font-medium text-zinc-500">
                                        {trans('bookmark.saved_items')}
                                    </span>
                                    <span className="text-sm font-semibold text-zinc-900">
                                        {totalSaves}
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 text-sm">
                                    <span className="inline-flex items-center text-zinc-500">
                                        <BookOpen className="h-4 w-4" />
                                    </span>
                                    <span className="text-xs font-medium text-zinc-500">
                                        {trans('bookmark.saved_quizzes')}
                                    </span>
                                    <span className="text-sm font-semibold text-zinc-900">
                                        {savedQuizzesCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
                        <aside className="space-y-5">
                            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                                    {trans('bookmark.study_folder_all')}
                                </p>
                                <div className="mt-3 space-y-1">
                                    <SidebarFolderItem
                                        active={!isQuizFolder}
                                        icon={
                                            <Bookmark className="h-3.5 w-3.5" />
                                        }
                                        label={trans(
                                            'bookmark.study_folder_all',
                                        )}
                                        count={totalSaves}
                                        onClick={refreshSavedPosts}
                                    />
                                    <SidebarFolderItem
                                        active={isQuizFolder}
                                        icon={
                                            <BookOpen className="h-3.5 w-3.5" />
                                        }
                                        label={trans('bookmark.quiz_folder')}
                                        tone="quiz"
                                        onClick={() =>
                                            navigateQuizFolder(activeQuizMode)
                                        }
                                    />
                                    {isQuizFolder ? (
                                        <div className="mt-1 ml-5 space-y-1 border-l border-zinc-200 pl-3">
                                            <SidebarFolderItem
                                                active={
                                                    activeQuizMode === 'correct'
                                                }
                                                icon={
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                }
                                                label={trans(
                                                    'bookmark.study_folder_correct',
                                                )}
                                                count={correctCount}
                                                tone="correct"
                                                compact
                                                onClick={() =>
                                                    navigateQuizFolder(
                                                        'correct',
                                                    )
                                                }
                                            />
                                            <SidebarFolderItem
                                                active={
                                                    activeQuizMode === 'wrong'
                                                }
                                                icon={
                                                    <XCircle className="h-3.5 w-3.5" />
                                                }
                                                label={trans(
                                                    'bookmark.study_folder_wrong',
                                                )}
                                                count={wrongCount}
                                                tone="wrong"
                                                compact
                                                onClick={() =>
                                                    navigateQuizFolder('wrong')
                                                }
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            </section>
                        </aside>

                        <main className="space-y-6">
                            {isQuizFolder ? (
                                <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm md:p-7">
                                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-4">
                                        <div>
                                            <h2 className="text-xl font-semibold text-zinc-900">
                                                {activeQuizMode === 'correct'
                                                    ? trans(
                                                          'bookmark.study_folder_correct',
                                                      )
                                                    : trans(
                                                          'bookmark.study_folder_wrong',
                                                      )}
                                            </h2>
                                            <p className="mt-1 text-sm text-zinc-500">
                                                {activeQuizMode === 'correct'
                                                    ? trans(
                                                          'bookmark.quiz_correct_description',
                                                      )
                                                    : trans(
                                                          'bookmark.quiz_wrong_description',
                                                      )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <QuizReviewList
                                            items={quizReviewItems}
                                            mode={activeQuizMode}
                                            trans={trans}
                                        />
                                    </div>
                                </section>
                            ) : (
                                <SavedPostsPanel
                                    posts={posts}
                                    savingPostIds={savingPostIds}
                                    trans={trans}
                                    onToggleSave={handleToggleSave}
                                />
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}

StudyFolderPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

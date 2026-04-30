import { reactLang } from '@erag/lang-sync-inertia';
import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { QuizFolderPanel } from '@/components/studyfolder/quiz-folder-panel';
import { SavedPostsPanel } from '@/components/studyfolder/saved-posts-panel';
import { StudyFolderHeader } from '@/components/studyfolder/study-folder-header';
import { StudyFolderSidebar } from '@/components/studyfolder/study-folder-sidebar';
import { useStudyFolder } from '@/components/studyfolder/use-study-folder';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'My Study Folder', href: '/bookmarks' }];

export default function StudyFolderPage() {
    const { trans } = reactLang();
    const {
        folders,
        posts,
        completedCount,
        correctCount,
        wrongCount,
        quizReviewItems,
        activeFolderId,
        activeFolder,
        activeQuizMode,
        isQuizFolder,
        totalSaves,
        savedQuizzesCount,
        creatingFolder,
        showCreateFolderForm,
        folderName,
        renamingFolderId,
        renameValue,
        savingPostIds,
        movingPostIds,
        setShowCreateFolderForm,
        setFolderName,
        setRenameValue,
        refreshCurrentFolder,
        navigateQuizFolder,
        cancelCreateFolder,
        startRenameFolder,
        cancelRenameFolder,
        handleCreateFolder,
        handleRenameFolder,
        handleDeleteFolder,
        handleToggleSave,
        handleMovePost,
    } = useStudyFolder();

    return (
        <>
            <Head title={trans('navigation.bookmarks')} />

            <div className="w-full max-w-none p-4 pb-24 md:p-6 md:pb-24">
                <div className="mx-auto w-full max-w-6xl space-y-5">
                    <StudyFolderHeader
                        totalSaves={totalSaves}
                        savedQuizzesCount={savedQuizzesCount}
                        trans={trans}
                    />

                    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
                        <StudyFolderSidebar
                            folders={folders}
                            activeFolderId={activeFolderId}
                            isQuizFolder={isQuizFolder}
                            activeQuizMode={activeQuizMode}
                            totalSaves={totalSaves}
                            completedCount={completedCount}
                            correctCount={correctCount}
                            wrongCount={wrongCount}
                            creatingFolder={creatingFolder}
                            showCreateFolderForm={showCreateFolderForm}
                            folderName={folderName}
                            renamingFolderId={renamingFolderId}
                            renameValue={renameValue}
                            trans={trans}
                            onNavigateFolder={refreshCurrentFolder}
                            onNavigateQuizFolder={navigateQuizFolder}
                            onToggleCreateFolderForm={() =>
                                setShowCreateFolderForm((prev) => !prev)
                            }
                            onFolderNameChange={setFolderName}
                            onSubmitCreateFolder={handleCreateFolder}
                            onCancelCreateFolder={cancelCreateFolder}
                            onStartRenameFolder={startRenameFolder}
                            onRenameValueChange={setRenameValue}
                            onConfirmRenameFolder={(folderId) => {
                                void handleRenameFolder(folderId);
                            }}
                            onCancelRenameFolder={cancelRenameFolder}
                            onDeleteFolder={(folderId) => {
                                void handleDeleteFolder(folderId);
                            }}
                        />

                        <main className="space-y-6">
                            {isQuizFolder ? (
                                <QuizFolderPanel
                                    activeQuizMode={activeQuizMode}
                                    posts={posts}
                                    quizReviewItems={quizReviewItems}
                                    savingPostIds={savingPostIds}
                                    trans={trans}
                                    onToggleSave={handleToggleSave}
                                />
                            ) : (
                                <SavedPostsPanel
                                    posts={posts}
                                    folders={folders}
                                    activeFolder={activeFolder}
                                    activeFolderId={activeFolderId}
                                    movingPostIds={movingPostIds}
                                    savingPostIds={savingPostIds}
                                    trans={trans}
                                    onMove={handleMovePost}
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

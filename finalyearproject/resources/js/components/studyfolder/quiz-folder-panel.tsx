import type { PostItem } from '@/types';
import { QuizReviewList } from './quiz-review-list';
import { StudyPostList } from './study-post-list';
import type { QuizFolderMode, QuizReviewItem, TransFn } from './types';

type QuizFolderPanelProps = {
    activeQuizMode: QuizFolderMode;
    posts: PostItem[];
    quizReviewItems: QuizReviewItem[];
    savingPostIds: number[];
    trans: TransFn;
    onToggleSave: (id: number) => void;
};

export function QuizFolderPanel({
    activeQuizMode,
    posts,
    quizReviewItems,
    savingPostIds,
    trans,
    onToggleSave,
}: QuizFolderPanelProps) {
    return (
        <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                    <h2 className="text-xl font-semibold text-zinc-900">
                        {activeQuizMode === 'completed'
                            ? trans('bookmark.study_folder_completed')
                            : activeQuizMode === 'correct'
                              ? trans('bookmark.study_folder_correct')
                              : trans('bookmark.study_folder_wrong')}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                        {activeQuizMode === 'completed'
                            ? trans('bookmark.quiz_completed_description')
                            : activeQuizMode === 'correct'
                              ? trans('bookmark.quiz_correct_description')
                              : trans('bookmark.quiz_wrong_description')}
                    </p>
                </div>
            </div>

            <div className="mt-6">
                {activeQuizMode === 'completed' ? (
                    <StudyPostList
                        posts={posts}
                        studyMode={activeQuizMode}
                        trans={trans}
                        savingPostIds={savingPostIds}
                        onToggleSave={onToggleSave}
                    />
                ) : (
                    <QuizReviewList
                        items={quizReviewItems}
                        mode={activeQuizMode}
                        trans={trans}
                    />
                )}
            </div>
        </section>
    );
}

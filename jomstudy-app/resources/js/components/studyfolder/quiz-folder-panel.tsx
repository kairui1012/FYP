import { QuizReviewList } from './quiz-review-list';
import type { QuizFolderMode, QuizReviewItem, TransFn } from './types';

type QuizFolderPanelProps = {
    activeQuizMode: QuizFolderMode;
    quizReviewItems: QuizReviewItem[];
    trans: TransFn;
};

export function QuizFolderPanel({
    activeQuizMode,
    quizReviewItems,
    trans,
}: QuizFolderPanelProps) {
    return (
        <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                    <h2 className="text-xl font-semibold text-zinc-900">
                        {activeQuizMode === 'correct'
                            ? trans('bookmark.study_folder_correct')
                            : trans('bookmark.study_folder_wrong')}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                        {activeQuizMode === 'correct'
                            ? trans('bookmark.quiz_correct_description')
                            : trans('bookmark.quiz_wrong_description')}
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
    );
}

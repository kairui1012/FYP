import { reactLang } from '@erag/lang-sync-inertia';
import { Link2 } from 'lucide-react';
import type { LinkedQuizOption } from './create-post-config';

type MaterialQuizLinkSectionProps = {
    quizzes: LinkedQuizOption[];
    selectedQuizIds: number[];
    onToggleQuiz: (quizId: number) => void;
    hint: string;
    emptyLabel: string;
};

export function MaterialQuizLinkSection({
    quizzes,
    selectedQuizIds,
    onToggleQuiz,
    hint,
    emptyLabel,
}: MaterialQuizLinkSectionProps) {
    const { trans } = reactLang();

    return (
        <section className="space-y-3 rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Link2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-amber-900">
                        {trans('createPost.material_attach_quiz_title')}
                    </p>
                    <p className="text-sm text-amber-700">{hint}</p>
                </div>
            </div>

            {quizzes.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-white p-3 text-sm text-amber-800">
                    {emptyLabel}
                </p>
            ) : (
                <div className="space-y-2">
                    {quizzes.map((quiz) => {
                        const checked = selectedQuizIds.includes(quiz.id);

                        return (
                            <label
                                key={quiz.id}
                                className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200 bg-white p-3"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => onToggleQuiz(quiz.id)}
                                    className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                                />
                                <div className="min-w-0 space-y-1">
                                    <p className="text-sm font-semibold text-zinc-800">
                                        {quiz.title}
                                    </p>
                                    <p className="text-xs text-zinc-600">
                                        {quiz.publisher.name} • {quiz.questionCount}{' '}
                                        {trans('createPost.material_quiz_questions')}
                                    </p>
                                </div>
                            </label>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

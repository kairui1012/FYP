import { BtnAiAns } from '@/components/ui/btn-ai-ans';
import type { PostContentTransFn, QuizData, QuizResultState } from './types';

type PostQuizPanelProps = {
    postId: number;
    postTitle: string;
    page: unknown;
    quizData: QuizData | null;
    selectedAnswers: Record<number, string>;
    resultStates: Record<number, QuizResultState>;
    trans: PostContentTransFn;
    onAnswerSelect: (questionIndex: number, value: string) => void;
    onCheckAnswer: (questionIndex: number) => void;
};

export function PostQuizPanel({
    postId,
    postTitle,
    page,
    quizData,
    selectedAnswers,
    resultStates,
    trans,
    onAnswerSelect,
    onCheckAnswer,
}: PostQuizPanelProps) {
    if (!quizData) {
        return null;
    }

    return (
        <div className="mx-4 mb-7 space-y-4">
            {quizData.questions.map((question, questionIndex) => {
                const selected = selectedAnswers[questionIndex] ?? '';
                const result = resultStates[questionIndex] ?? null;

                return (
                    <div
                        key={questionIndex}
                        className="rounded-2xl border-[1.5px] border-amber-300 bg-amber-50/40 p-4"
                    >
                        {quizData.questions.length > 1 && (
                            <p className="mb-1 text-xs font-bold tracking-wider text-amber-600 uppercase">
                                Q{questionIndex + 1}
                            </p>
                        )}
                        {question.question && (
                            <p className="mb-2 text-sm font-semibold text-zinc-800">
                                {question.question}
                            </p>
                        )}
                        <p className="text-sm font-semibold text-amber-800">
                            {trans('createPost.quiz_take_label', page)}
                        </p>
                        <div className="mt-3 space-y-2">
                            {question.options.map((option, index) => {
                                const optionLabel = String.fromCharCode(
                                    65 + index,
                                );

                                return (
                                    <label
                                        key={optionLabel}
                                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-zinc-700"
                                    >
                                        <input
                                            type="radio"
                                            name={`quiz-option-${postId}-${questionIndex}`}
                                            value={index}
                                            checked={selected === String(index)}
                                            onChange={(event) =>
                                                onAnswerSelect(
                                                    questionIndex,
                                                    event.target.value,
                                                )
                                            }
                                            className="h-4 w-4 accent-amber-600"
                                        />
                                        <span className="font-semibold text-amber-700">
                                            {optionLabel}.
                                        </span>
                                        <span>{option}</span>
                                    </label>
                                );
                            })}
                        </div>

                        <BtnAiAns
                            page={page}
                            trans={trans}
                            question={question.question ?? postTitle}
                            options={question.options}
                            creatorAnswer={question.creatorAnswer}
                            selected={selected}
                            manualResult={result}
                            onCheckAnswer={() => onCheckAnswer(questionIndex)}
                        />

                        {selected === '' && (
                            <p className="mt-2 text-xs text-amber-700">
                                {trans('createPost.quiz_select_required', page)}
                            </p>
                        )}
                        {result === 'correct' && (
                            <p className="mt-3 text-sm font-semibold text-emerald-700">
                                {trans('createPost.quiz_correct', page)}
                            </p>
                        )}
                        {result === 'wrong' && (
                            <p className="mt-3 text-sm font-semibold text-rose-700">
                                {trans('createPost.quiz_wrong', page)}{' '}
                                {trans(
                                    'createPost.quiz_correct_answer_prefix',
                                    page,
                                )}{' '}
                                {String.fromCharCode(65 + question.answerIndex)}
                                .
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

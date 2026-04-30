import { Loader2, Plus, Sparkles, Trash2, X } from 'lucide-react';
import type { QuizAiAnswerPlacement, QuizItem } from './create-post-config';

const MAX_OPTIONS = 8;
const MIN_OPTIONS = 2;

type QuizSetupSectionProps = {
    quizzes: QuizItem[];
    canUseAiQuizTools: boolean;
    onAddQuiz: () => void;
    onRemoveQuiz: (qIndex: number) => void;
    onUpdateQuestion: (qIndex: number, value: string) => void;
    onUpdateOption: (qIndex: number, optIndex: number, value: string) => void;
    onUpdateAnswerIndex: (qIndex: number, value: string) => void;
    onUpdateAiAnswerPlacement: (
        qIndex: number,
        value: QuizAiAnswerPlacement,
    ) => void;
    onAddOption: (qIndex: number) => void;
    onRemoveOption: (qIndex: number, optIndex: number) => void;
    onGenerateQuizOptions: (qIndex: number) => void;
    generatingQuizOptionIds: number[];
    quizOptionErrors: Record<number, string>;
    text: {
        quizSectionTitle: string;
        quizSectionHint: string;
        quizNumberLabel: string;
        quizQuestionInputLabel: string;
        quizQuestionPlaceholder: string;
        quizOptionLabel: string;
        quizOptionPlaceholder: string;
        quizAddOption: string;
        quizRemoveOption: string;
        quizAddQuiz: string;
        quizRemoveQuiz: string;
        quizAnswerLabel: string;
        quizAnswerPlaceholder: string;
        quizRequiredHint: string;
        quizAiAddOptions: string;
        quizAiAddingOptions: string;
        quizAiAnswerPlacementLabel: string;
        quizAiAnswerPlacementRandom: string;
    };
};

export function QuizSetupSection({
    quizzes,
    canUseAiQuizTools,
    onAddQuiz,
    onRemoveQuiz,
    onUpdateQuestion,
    onUpdateOption,
    onUpdateAnswerIndex,
    onUpdateAiAnswerPlacement,
    onAddOption,
    onRemoveOption,
    onGenerateQuizOptions,
    generatingQuizOptionIds,
    quizOptionErrors,
    text,
}: QuizSetupSectionProps) {
    return (
        <div className="space-y-4">
            <div>
                <p className="text-base font-semibold text-amber-800 dark:text-amber-300">
                    {text.quizSectionTitle}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                    {text.quizSectionHint}
                </p>
            </div>

            <div className="space-y-4">
                {quizzes.map((quiz, qIndex) => {
                    const canRemoveOption = quiz.options.length > MIN_OPTIONS;
                    const canAddOption = quiz.options.length < MAX_OPTIONS;
                    const isGeneratingOptions =
                        generatingQuizOptionIds.includes(qIndex);
                    const answerPlacementOptions: QuizAiAnswerPlacement[] = [
                        'A',
                        'B',
                        'C',
                        'D',
                        'random',
                    ];

                    return (
                        <div
                            key={qIndex}
                            className="rounded-xl border-2 border-amber-200 bg-amber-50/40 p-4 dark:border-amber-700/50 dark:bg-amber-950/20"
                        >
                            {/* Quiz block header */}
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                    {text.quizNumberLabel} {qIndex + 1}
                                </span>
                                <div className="flex items-center gap-2">
                                    {canUseAiQuizTools ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onGenerateQuizOptions(qIndex)
                                            }
                                            disabled={isGeneratingOptions}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:border-amber-500 hover:bg-amber-100 disabled:pointer-events-none disabled:opacity-60 dark:border-amber-700 dark:bg-zinc-900 dark:text-amber-300 dark:hover:bg-amber-950/40"
                                        >
                                            {isGeneratingOptions ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Sparkles className="h-3.5 w-3.5" />
                                            )}
                                            {isGeneratingOptions
                                                ? text.quizAiAddingOptions
                                                : text.quizAiAddOptions}
                                        </button>
                                    ) : null}
                                    {quizzes.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => onRemoveQuiz(qIndex)}
                                            title={text.quizRemoveQuiz}
                                            className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-500 transition-all hover:scale-110 hover:bg-red-200 active:scale-95 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Question input */}
                            <div className="mb-4 space-y-1">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {text.quizQuestionInputLabel}
                                </label>
                                <textarea
                                    value={quiz.question}
                                    onChange={(e) =>
                                        onUpdateQuestion(qIndex, e.target.value)
                                    }
                                    placeholder={text.quizQuestionPlaceholder}
                                    rows={3}
                                    className="min-h-24 w-full resize-y rounded-xl border-0 bg-white px-4 py-3 text-sm text-zinc-800 transition outline-none placeholder:text-zinc-500 focus:bg-zinc-100 focus:ring-0 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-700"
                                />
                            </div>

                            {canUseAiQuizTools ? (
                                <div className="mb-4 space-y-2">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        {text.quizAiAnswerPlacementLabel}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {answerPlacementOptions.map((placement) => {
                                            const isSelected =
                                                quiz.aiAnswerPlacement ===
                                                placement;
                                            const label =
                                                placement === 'random'
                                                    ? text.quizAiAnswerPlacementRandom
                                                    : placement;

                                            return (
                                                <button
                                                    key={placement}
                                                    type="button"
                                                    onClick={() =>
                                                        onUpdateAiAnswerPlacement(
                                                            qIndex,
                                                            placement,
                                                        )
                                                    }
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                                        isSelected
                                                            ? 'border-amber-600 bg-amber-500 text-white shadow-sm'
                                                            : 'border-amber-300 bg-white text-amber-700 hover:border-amber-500 hover:bg-amber-100 dark:border-amber-700 dark:bg-zinc-900 dark:text-amber-300 dark:hover:bg-amber-950/40'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : null}

                            {/* Options grid */}
                            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {quiz.options.map((option, optIndex) => {
                                    const optionLabel = String.fromCharCode(
                                        65 + optIndex,
                                    );
                                    return (
                                        <div
                                            key={optIndex}
                                            className="group relative space-y-1"
                                        >
                                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                                {text.quizOptionLabel}{' '}
                                                {optionLabel}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) =>
                                                        onUpdateOption(
                                                            qIndex,
                                                            optIndex,
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={`${text.quizOptionPlaceholder} ${optionLabel}`}
                                                    className="w-full rounded-xl border-0 bg-white px-4 py-3 pr-9 text-sm text-zinc-800 transition outline-none placeholder:text-zinc-500 focus:bg-zinc-100 focus:ring-0 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-700"
                                                />
                                                {canRemoveOption && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onRemoveOption(
                                                                qIndex,
                                                                optIndex,
                                                            )
                                                        }
                                                        title={
                                                            text.quizRemoveOption
                                                        }
                                                        className="absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-red-900/40 dark:hover:text-red-400"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Add option button in the grid */}
                                {canAddOption && (
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => onAddOption(qIndex)}
                                            className="group flex h-11.5 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-300 bg-transparent text-sm font-medium text-amber-600 transition-all hover:border-amber-500 hover:bg-amber-50 active:scale-95 dark:border-amber-700 dark:text-amber-400 dark:hover:border-amber-500 dark:hover:bg-amber-950/40"
                                        >
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-amber-700 transition-all group-hover:scale-110 group-hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-300 dark:group-hover:bg-amber-700">
                                                <Plus className="h-3.5 w-3.5" />
                                            </span>
                                            {text.quizAddOption}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Correct answer selector */}
                            <div className="space-y-1">
                                <label
                                    htmlFor={`quiz-answer-${qIndex}`}
                                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    {text.quizAnswerLabel}
                                </label>
                                <select
                                    id={`quiz-answer-${qIndex}`}
                                    value={quiz.answerIndex}
                                    onChange={(e) =>
                                        onUpdateAnswerIndex(
                                            qIndex,
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-zinc-800 transition outline-none focus:bg-zinc-100 focus:ring-0 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-700"
                                >
                                    <option value="">
                                        {text.quizAnswerPlaceholder}
                                    </option>
                                    {quiz.options.map((_, optIndex) => {
                                        const optionLabel = String.fromCharCode(
                                            65 + optIndex,
                                        );
                                        return (
                                            <option
                                                key={optIndex}
                                                value={optIndex}
                                            >
                                                {optionLabel}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            {quizOptionErrors[qIndex] ? (
                                <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
                                    {quizOptionErrors[qIndex]}
                                </p>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            {/* Add Quiz button */}
            <button
                type="button"
                onClick={onAddQuiz}
                title={text.quizAddQuiz}
                className="group flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-amber-300 py-3 text-sm font-semibold text-amber-600 transition-all hover:border-amber-500 hover:bg-amber-50 active:scale-[0.99] dark:border-amber-700 dark:text-amber-400 dark:hover:border-amber-500 dark:hover:bg-amber-950/40"
            >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-200 text-amber-700 transition-all group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-white active:scale-95 dark:bg-amber-800 dark:text-amber-300 dark:group-hover:bg-amber-600">
                    <Plus className="h-4 w-4" />
                </span>
                {text.quizAddQuiz}
            </button>

            <p className="text-xs text-amber-700 dark:text-amber-400">
                {text.quizRequiredHint}
            </p>
        </div>
    );
}

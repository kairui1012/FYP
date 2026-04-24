type QuizSetupSectionProps = {
    quizOptions: string[];
    quizAnswerIndex: string;
    onChangeOption: (index: number, value: string) => void;
    onChangeAnswerIndex: (value: string) => void;
    text: {
        quizSectionTitle: string;
        quizSectionHint: string;
        quizOptionLabel: string;
        quizOptionPlaceholder: string;
        quizAnswerLabel: string;
        quizAnswerPlaceholder: string;
        quizRequiredHint: string;
    };
};

export function QuizSetupSection({
    quizOptions,
    quizAnswerIndex,
    onChangeOption,
    onChangeAnswerIndex,
    text,
}: QuizSetupSectionProps) {
    return (
        <div className="space-y-3 rounded-xl border-2 border-amber-200 bg-amber-50/40 p-4">
            <div>
                <p className="text-base font-semibold text-amber-800">{text.quizSectionTitle}</p>
                <p className="text-sm text-amber-700">{text.quizSectionHint}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {quizOptions.map((option, index) => {
                    const optionLabel = String.fromCharCode(65 + index);

                    return (
                        <div key={optionLabel} className="space-y-1">
                            <label className="text-sm font-medium text-zinc-700">
                                {text.quizOptionLabel} {optionLabel}
                            </label>
                            <input
                                type="text"
                                value={option}
                                onChange={(event) => onChangeOption(index, event.target.value)}
                                placeholder={`${text.quizOptionPlaceholder} ${optionLabel}`}
                                className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-500 focus:bg-zinc-100 focus:ring-0"
                            />
                        </div>
                    );
                })}
            </div>

            <div className="space-y-1">
                <label htmlFor="quiz-answer" className="text-sm font-medium text-zinc-700">
                    {text.quizAnswerLabel}
                </label>
                <select
                    id="quiz-answer"
                    value={quizAnswerIndex}
                    onChange={(event) => onChangeAnswerIndex(event.target.value)}
                    className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:bg-zinc-100 focus:ring-0"
                >
                    <option value="">{text.quizAnswerPlaceholder}</option>
                    {quizOptions.map((_, index) => {
                        const optionLabel = String.fromCharCode(65 + index);
                        return (
                            <option key={optionLabel} value={index}>
                                {optionLabel}
                            </option>
                        );
                    })}
                </select>
            </div>

            <p className="text-xs text-amber-700">{text.quizRequiredHint}</p>
        </div>
    );
}

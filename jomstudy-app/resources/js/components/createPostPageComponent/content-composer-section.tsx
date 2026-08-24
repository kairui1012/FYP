import type { RefObject } from 'react';

type ContentComposerSectionProps = {
    isQuizSelected: boolean;
    content: string;
    onChangeContent: (value: string) => void;
    contentTextareaRef: RefObject<HTMLTextAreaElement | null>;
    maxContentLength: number;
    contentLabel: string;
    quizQuestionLabel: string;
    contentPlaceholder: string;
    quizQuestionPlaceholder: string;
    helperText: string;
    remainingContentChars: number;
    charsLeft: string;
};

export function ContentComposerSection({
    isQuizSelected,
    content,
    onChangeContent,
    contentTextareaRef,
    maxContentLength,
    contentLabel,
    quizQuestionLabel,
    contentPlaceholder,
    quizQuestionPlaceholder,
    helperText,
    remainingContentChars,
    charsLeft,
}: ContentComposerSectionProps) {
    return (
        <div className="space-y-3">
            <label
                htmlFor="content"
                className="text-base font-medium text-zinc-700"
            >
                {isQuizSelected ? quizQuestionLabel : contentLabel}
            </label>
            <textarea
                ref={contentTextareaRef}
                id="content"
                value={content}
                onChange={(event) => onChangeContent(event.target.value)}
                maxLength={maxContentLength}
                placeholder={
                    isQuizSelected
                        ? quizQuestionPlaceholder
                        : contentPlaceholder
                }
                className="min-h-44 w-full resize-y rounded-xl border-0 bg-zinc-100 px-5 py-4 text-base leading-7 text-zinc-800 transition outline-none placeholder:text-zinc-500 focus:bg-zinc-200/80 focus:ring-0"
            />

            <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">{helperText}</span>
                <span
                    className={
                        remainingContentChars < 80
                            ? 'font-medium text-rose-600'
                            : 'text-zinc-500'
                    }
                >
                    {remainingContentChars} {charsLeft}
                </span>
            </div>
        </div>
    );
}

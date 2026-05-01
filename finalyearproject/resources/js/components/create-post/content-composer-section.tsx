import type { RefObject } from 'react';

type FormulaPreset = {
    key: string;
    label: string;
    snippet: string;
};

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
    isMathSubjectSelected: boolean;
    isPhysicsSubjectSelected: boolean;
    isChemistrySubjectSelected: boolean;
    mathFormulaPresets: FormulaPreset[];
    physicsSymbolPresets: FormulaPreset[];
    chemistrySymbolPresets: FormulaPreset[];
    onInsertSnippet: (snippet: string) => void;
    showSymbolPreview: boolean;
    symbolPreviewTitle: string;
    symbolPreviewHint: string;
    previewContent: string;
    helperText: string;
    remainingContentChars: number;
    charsLeft: string;
    mathToolTitle: string;
    mathToolHint: string;
    physicsToolTitle: string;
    physicsToolHint: string;
    chemistryToolTitle: string;
    chemistryToolHint: string;
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
    isMathSubjectSelected,
    isPhysicsSubjectSelected,
    isChemistrySubjectSelected,
    mathFormulaPresets,
    physicsSymbolPresets,
    chemistrySymbolPresets,
    onInsertSnippet,
    showSymbolPreview,
    symbolPreviewTitle,
    symbolPreviewHint,
    previewContent,
    helperText,
    remainingContentChars,
    charsLeft,
    mathToolTitle,
    mathToolHint,
    physicsToolTitle,
    physicsToolHint,
    chemistryToolTitle,
    chemistryToolHint,
}: ContentComposerSectionProps) {
    return (
        <div className="space-y-3">
            <label htmlFor="content" className="text-base font-medium text-zinc-700">
                {isQuizSelected ? quizQuestionLabel : contentLabel}
            </label>
            <textarea
                ref={contentTextareaRef}
                id="content"
                value={content}
                onChange={(event) => onChangeContent(event.target.value)}
                maxLength={maxContentLength}
                placeholder={isQuizSelected ? quizQuestionPlaceholder : contentPlaceholder}
                className="min-h-44 w-full resize-y rounded-xl border-0 bg-zinc-100 px-5 py-4 text-base leading-7 text-zinc-800 outline-none transition placeholder:text-zinc-500 focus:bg-zinc-200/80 focus:ring-0"
            />

            {isMathSubjectSelected ? (
                <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-3">
                    <p className="text-sm font-semibold text-emerald-800">{mathToolTitle}</p>
                    <p className="mt-1 text-xs text-emerald-700">{mathToolHint}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {mathFormulaPresets.map((preset) => (
                            <button
                                key={preset.key}
                                type="button"
                                onClick={() => onInsertSnippet(preset.snippet)}
                                className="rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-500 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            {isPhysicsSubjectSelected ? (
                <div className="rounded-xl border-2 border-sky-200 bg-sky-50/60 p-3">
                    <p className="text-sm font-semibold text-sky-800">{physicsToolTitle}</p>
                    <p className="mt-1 text-xs text-sky-700">{physicsToolHint}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {physicsSymbolPresets.map((preset) => (
                            <button
                                key={preset.key}
                                type="button"
                                onClick={() => onInsertSnippet(preset.snippet)}
                                className="rounded-full border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-500 hover:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            {isChemistrySubjectSelected ? (
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50/60 p-3">
                    <p className="text-sm font-semibold text-amber-800">{chemistryToolTitle}</p>
                    <p className="mt-1 text-xs text-amber-700">{chemistryToolHint}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {chemistrySymbolPresets.map((preset) => (
                            <button
                                key={preset.key}
                                type="button"
                                onClick={() => onInsertSnippet(preset.snippet)}
                                className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:border-amber-500 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            {showSymbolPreview ? (
                <div className="rounded-xl border-2 border-zinc-200 bg-white p-3">
                    <p className="text-sm font-semibold text-zinc-800">{symbolPreviewTitle}</p>
                    <p className="mt-1 text-xs text-zinc-500">{symbolPreviewHint}</p>
                    <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm leading-7 whitespace-pre-wrap text-zinc-700">
                        {previewContent || content || '...'}
                    </div>
                </div>
            ) : null}

            <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">{helperText}</span>
                <span className={remainingContentChars < 80 ? 'font-medium text-rose-600' : 'text-zinc-500'}>
                    {remainingContentChars} {charsLeft}
                </span>
            </div>
        </div>
    );
}

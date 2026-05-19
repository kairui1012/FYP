import { BtnAiTranslate } from '@/components/ui/btn-ai-translate';

type PostTranslateActionsProps = {
    page: unknown;
    title: string;
    content: string;
    texts?: string[];
    onTranslate: (result: { title: string; content: string }) => void;
    onTranslateTexts?: (translations: Record<string, string>) => void;
};

export function PostTranslateActions({
    title,
    content,
    texts,
    onTranslate,
    onTranslateTexts,
}: PostTranslateActionsProps) {
    return (
        <div className="my-3 px-4">
            <div className="flex flex-wrap items-center gap-3">
                <BtnAiTranslate
                    className="my-0"
                    title={title}
                    content={content}
                    texts={texts}
                    onTranslate={onTranslate}
                    onTranslateTexts={onTranslateTexts}
                />
            </div>
        </div>
    );
}

import { BtnAiTranslate } from '@/components/ui/btn-ai-translate';

type PostTranslateActionsProps = {
    title: string;
    content: string;
    onTranslate: (result: { title: string; content: string }) => void;
};

export function PostTranslateActions({
    title,
    content,
    onTranslate,
}: PostTranslateActionsProps) {
    return (
        <div className="my-3 flex flex-wrap items-center gap-3 px-4">
            <BtnAiTranslate
                className="my-0"
                title={title}
                content={content}
                onTranslate={onTranslate}
            />
        </div>
    );
}

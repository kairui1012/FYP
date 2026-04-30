import { BtnAiTranslate } from '@/components/ui/btn-ai-translate';
import { PostLearningObjectives } from '@/components/post-learning-objectives';

type PostTranslateActionsProps = {
    page: unknown;
    title: string;
    content: string;
    texts?: string[];
    postType?: string;
    onTranslate: (result: { title: string; content: string }) => void;
    onTranslateTexts?: (translations: Record<string, string>) => void;
};

export function PostTranslateActions({
    page,
    title,
    content,
    texts,
    postType,
    onTranslate,
    onTranslateTexts,
}: PostTranslateActionsProps) {
    const shouldShowLearningObjectives = false;

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
                {shouldShowLearningObjectives ? (
                    <PostLearningObjectives
                        className="m-0"
                        page={page}
                        postTitle={title}
                        postContent={content}
                        postType={postType}
                    />
                ) : null}
            </div>
        </div>
    );
}

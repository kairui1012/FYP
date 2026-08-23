import { CommentSection } from '@/component-new/shared/comment-section';
import type { PostItem } from '@/types';

type QuizCommentSectionProps = {
    post: PostItem;
    onCommentsCountChange?: (count: number) => void;
};

export function QuizCommentSection({
    post,
    onCommentsCountChange,
}: QuizCommentSectionProps) {
    return (
        <CommentSection
            post={post}
            variant="quiz"
            onCommentsCountChange={onCommentsCountChange}
        />
    );
}

import { CommentSection } from '@/components/postContentPageComponent/comment-section';
import type { PostItem } from '@/types';

type QaCommentSectionProps = {
    post: PostItem;
    onCommentsCountChange?: (count: number) => void;
};

export function QaCommentSection({
    post,
    onCommentsCountChange,
}: QaCommentSectionProps) {
    return (
        <CommentSection
            post={post}
            variant="qna"
            onCommentsCountChange={onCommentsCountChange}
        />
    );
}

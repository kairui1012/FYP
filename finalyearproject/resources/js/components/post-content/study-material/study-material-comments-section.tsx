import { CommentSection } from '@/components/comment-section';
import { MaterialRatingSection } from '@/components/post-content/study-material/material-rating-section';
import type { PostItem } from '@/types';

type StudyMaterialCommentsSectionProps = {
    page: unknown;
    post: PostItem;
    onCommentsCountChange: (count: number) => void;
};

export function StudyMaterialCommentsSection({
    page,
    post,
    onCommentsCountChange,
}: StudyMaterialCommentsSectionProps) {
    return (
        <>
            <MaterialRatingSection page={page} post={post} />
            <CommentSection
                post={post}
                variant="material"
                onCommentsCountChange={onCommentsCountChange}
            />
        </>
    );
}

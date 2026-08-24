import { CommentSection } from '@/components/postContentPageComponent/comment-section';
import { MaterialRatingSection } from '@/components/postContentPageComponent/material-rating-section';
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

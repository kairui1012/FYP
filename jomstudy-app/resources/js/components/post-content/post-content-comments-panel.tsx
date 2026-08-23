import { QaCommentSection } from '@/components/post-content/qna/post-qna-comment-section';
import { QuizCommentSection } from '@/components/post-content/quiz/post-quiz-comment-section';
import { StudyMaterialCommentsSection } from '@/components/post-content/study-material/study-material-comments-section';
import type { PostItem } from '@/types';

type PostContentCommentsPanelProps = {
    page: unknown;
    post: PostItem;
    onCommentsCountChange: (count: number) => void;
};

export function PostContentCommentsPanel({
    page,
    post,
    onCommentsCountChange,
}: PostContentCommentsPanelProps) {
    return (
        <div
            id="comments"
            className="scroll-mt-20 pb-16 sm:scroll-mt-40 sm:pb-32"
        >
            {post.post_type === 'material' ? (
                <StudyMaterialCommentsSection
                    page={page}
                    post={post}
                    onCommentsCountChange={onCommentsCountChange}
                />
            ) : post.post_type === 'quiz' ? (
                <QuizCommentSection
                    post={post}
                    onCommentsCountChange={onCommentsCountChange}
                />
            ) : (
                <QaCommentSection
                    post={post}
                    onCommentsCountChange={onCommentsCountChange}
                />
            )}
        </div>
    );
}

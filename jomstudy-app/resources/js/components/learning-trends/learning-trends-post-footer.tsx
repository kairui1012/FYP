import { BtnComment } from '@/components/ui/btn-comment';
import { BtnLike } from '@/components/ui/btn-like';
import { BtnSave } from '@/components/ui/btn-save';
import { BtnShare } from '@/components/ui/btn-share';

type LearningTrendsPostFooterProps = {
    likes: number;
    liked: boolean;
    loading?: boolean;
    saves: number;
    saved: boolean;
    saveLoading?: boolean;
    comments: number;
    postId: number;
    onLike: (postId: number) => void;
    onComment: (postId: number) => void;
    onSave: (postId: number) => void;
};

export function LearningTrendsPostFooter({
    likes,
    liked,
    loading = false,
    saves,
    saved,
    saveLoading = false,
    comments,
    postId,
    onLike,
    onComment,
    onSave,
}: LearningTrendsPostFooterProps) {
    return (
        <div className="mt-2 flex items-center gap-3 text-sm text-zinc-900">
            <BtnLike
                count={likes}
                liked={liked}
                loading={loading}
                className="mb-2"
                onClick={() => onLike(postId)}
            />
            <BtnComment
                count={comments}
                className="mb-2"
                onClick={() => onComment(postId)}
            />
            <BtnSave
                count={saves}
                saved={saved}
                loading={saveLoading}
                className="mb-2"
                onClick={() => onSave(postId)}
            />
            <BtnShare className="mb-2" />
        </div>
    );
}

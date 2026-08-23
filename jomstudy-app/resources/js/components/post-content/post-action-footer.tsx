import { BtnComment } from '@/component-new/button/btn-comment';
import { BtnLike } from '@/component-new/button/btn-like';
import { BtnSave } from '@/component-new/button/btn-save';
import { BtnShare } from '@/component-new/button/btn-share';

type PostActionFooterProps = {
    postId: number;
    likes: number;
    saves: number;
    liked: boolean;
    saved: boolean;
    loading?: boolean;
    saveLoading?: boolean;
    onLike: (postId: number) => void;
    onSave: (postId: number) => void;
    onComment: () => void;
    comments: number;
    isOwner: boolean;
    canReport: boolean;
    reportLoading?: boolean;
    reported?: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onReport: () => void;
    editLabel: string;
    deleteLabel: string;
    reportLabel: string;
    reportedLabel: string;
};

export function PostActionFooter({
    postId,
    likes,
    saves,
    liked,
    saved,
    loading = false,
    saveLoading = false,
    onLike,
    onSave,
    comments,
    onComment,
    isOwner,
    canReport,
    reportLoading = false,
    reported = false,
    onEdit,
    onDelete,
    onReport,
    editLabel,
    deleteLabel,
    reportLabel,
    reportedLabel,
}: PostActionFooterProps) {
    return (
        <div className="mt-7 mb-3 flex flex-wrap items-center gap-5 px-4 text-sm text-zinc-900">
            <BtnLike
                count={likes}
                liked={liked}
                loading={loading}
                onClick={() => onLike(postId)}
            />
            <BtnComment count={comments} onClick={onComment} />
            <BtnSave
                count={saves}
                saved={saved}
                loading={saveLoading}
                onClick={() => onSave(postId)}
            />
            <BtnShare postId={postId} />
            {!isOwner && canReport ? (
                <button
                    type="button"
                    onClick={onReport}
                    disabled={reportLoading || reported}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-200 px-3.5 py-1.5 text-sm font-semibold text-zinc-600 transition-colors select-none hover:bg-linear-to-r hover:from-amber-300 hover:to-amber-400 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {reported ? reportedLabel : reportLabel}
                </button>
            ) : null}
            {isOwner && (
                <>
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-200 px-3.5 py-1.5 text-sm font-semibold text-zinc-600 transition-colors select-none hover:bg-linear-to-r hover:from-blue-400 hover:to-blue-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                    >
                        {editLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-200 px-3.5 py-1.5 text-sm font-semibold text-zinc-600 transition-colors select-none hover:bg-linear-to-r hover:from-rose-400 hover:to-rose-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                    >
                        {deleteLabel}
                    </button>
                </>
            )}
        </div>
    );
}

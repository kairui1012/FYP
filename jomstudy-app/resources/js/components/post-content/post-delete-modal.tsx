import type { PostContentTransFn } from './types';

type PostDeleteModalProps = {
    page: unknown;
    loading: boolean;
    trans: PostContentTransFn;
    onCancel: () => void;
    onConfirm: () => void;
};

export function PostDeleteModal({
    page,
    loading,
    trans,
    onCancel,
    onConfirm,
}: PostDeleteModalProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => {
                if (!loading) onCancel();
            }}
        >
            <div
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
                onClick={(event) => event.stopPropagation()}
            >
                <h2 className="mb-2 text-lg font-bold text-zinc-900">
                    {trans('createPost.delete_confirm_title', page)}
                </h2>
                <p className="mb-6 text-sm text-zinc-600">
                    {trans('createPost.delete_confirm_message', page)}
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-full bg-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-300 disabled:opacity-60"
                    >
                        {trans('createPost.cancel', page)}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                    >
                        {loading
                            ? trans('createPost.deleting', page)
                            : trans('createPost.delete_confirm_yes', page)}
                    </button>
                </div>
            </div>
        </div>
    );
}

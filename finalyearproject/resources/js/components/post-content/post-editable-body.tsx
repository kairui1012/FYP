import type { PostContentTransFn } from './types';

type PostEditableBodyProps = {
    page: unknown;
    isEditing: boolean;
    title: string;
    content: string;
    editTitle: string;
    editContent: string;
    editErrors: Record<string, string>;
    editLoading: boolean;
    trans: PostContentTransFn;
    onEditTitleChange: (value: string) => void;
    onEditContentChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
};

export function PostEditableBody({
    page,
    isEditing,
    title,
    content,
    editTitle,
    editContent,
    editErrors,
    editLoading,
    trans,
    onEditTitleChange,
    onEditContentChange,
    onSave,
    onCancel,
}: PostEditableBodyProps) {
    return (
        <>
            {isEditing ? (
                <div className="px-4 pt-2 pb-4">
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(event) =>
                            onEditTitleChange(event.target.value)
                        }
                        maxLength={150}
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-2xl font-bold text-zinc-950 focus:border-[#e27193] focus:outline-none"
                    />
                    {editErrors.title && (
                        <p className="mt-1 text-sm text-rose-600">
                            {editErrors.title}
                        </p>
                    )}
                </div>
            ) : (
                <h1 className="px-4 pt-2 pb-7 text-2xl leading-snug font-bold text-zinc-950">
                    {title}
                </h1>
            )}

            {isEditing ? (
                <div className="px-4 pb-6">
                    <textarea
                        value={editContent}
                        onChange={(event) =>
                            onEditContentChange(event.target.value)
                        }
                        maxLength={2000}
                        rows={10}
                        className="w-full resize-y rounded-xl border border-zinc-300 px-3 py-2 text-base leading-7 text-zinc-700 focus:border-[#e27193] focus:outline-none"
                    />
                    {editErrors.content && (
                        <p className="mt-1 text-sm text-rose-600">
                            {editErrors.content}
                        </p>
                    )}
                    <div className="mt-3 flex gap-3">
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={editLoading}
                            className="rounded-full bg-[#e27193] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#d05a7e] disabled:opacity-60"
                        >
                            {editLoading
                                ? trans('createPost.saving', page)
                                : trans('createPost.save_changes', page)}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={editLoading}
                            className="rounded-full bg-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-300 disabled:opacity-60"
                        >
                            {trans('createPost.cancel', page)}
                        </button>
                    </div>
                </div>
            ) : (
                content && (
                    <p className="px-4 pb-7 text-base leading-7 whitespace-pre-wrap text-zinc-700">
                        {content}
                    </p>
                )
            )}
        </>
    );
}

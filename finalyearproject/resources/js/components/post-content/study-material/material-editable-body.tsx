import {
    ArrowDown,
    ArrowUp,
    FileText,
    Image,
    Link as LinkIcon,
    Plus,
    Save,
    Text,
    Trash2,
    X,
} from 'lucide-react';
import type { PostContentTransFn } from '../types';

export type EditableMaterialBlockType = 'text' | 'image' | 'document' | 'video';

export type EditableMaterialBlock = {
    id: string;
    type: EditableMaterialBlockType;
    text: string;
    url: string;
    file: File | null;
    preview: string | null;
    existingPath: string | null;
    existingName: string | null;
    existingMime: string | null;
};

type MaterialEditableBodyProps = {
    page: unknown;
    editTitle: string;
    blocks: EditableMaterialBlock[];
    editErrors: Record<string, string>;
    editLoading: boolean;
    trans: PostContentTransFn;
    onEditTitleChange: (value: string) => void;
    onAddBlock: (type: EditableMaterialBlockType) => void;
    onUpdateBlock: (
        id: string,
        updates: Partial<EditableMaterialBlock>,
    ) => void;
    onUpdateBlockFile: (id: string, file: File | null) => void;
    onRemoveBlock: (id: string) => void;
    onMoveBlock: (id: string, direction: -1 | 1) => void;
    onSave: () => void;
    onCancel: () => void;
};

const blockOptions: Array<{
    type: EditableMaterialBlockType;
    icon: typeof Text;
    labelKey:
        | 'material_text_block'
        | 'material_image_block'
        | 'material_document_block'
        | 'material_video_block';
}> = [
    { type: 'text', icon: Text, labelKey: 'material_text_block' },
    { type: 'image', icon: Image, labelKey: 'material_image_block' },
    { type: 'document', icon: FileText, labelKey: 'material_document_block' },
    { type: 'video', icon: LinkIcon, labelKey: 'material_video_block' },
];

function assetUrl(path: string) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    return `/storage/${path}`;
}

export function MaterialEditableBody({
    page,
    editTitle,
    blocks,
    editErrors,
    editLoading,
    trans,
    onEditTitleChange,
    onAddBlock,
    onUpdateBlock,
    onUpdateBlockFile,
    onRemoveBlock,
    onMoveBlock,
    onSave,
    onCancel,
}: MaterialEditableBodyProps) {
    return (
        <section className="mx-4 mt-4 rounded-xl border border-violet-200 bg-violet-50/50 p-5">
            <div className="flex flex-col gap-4">
                <div>
                    <label
                        htmlFor="material-edit-title"
                        className="text-sm font-semibold text-violet-900"
                    >
                        {trans('createPost.title_label', page)}
                    </label>
                    <input
                        id="material-edit-title"
                        type="text"
                        value={editTitle}
                        onChange={(event) =>
                            onEditTitleChange(event.target.value)
                        }
                        maxLength={150}
                        className="mt-2 w-full rounded-lg border border-violet-200 bg-white px-4 py-3 text-xl font-semibold text-zinc-950 transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                    {editErrors.title ? (
                        <p className="mt-1 text-sm text-rose-600">
                            {editErrors.title}
                        </p>
                    ) : null}
                </div>

                <div>
                    <p className="text-base font-semibold text-violet-900">
                        {trans('createPost.material_editor_title', page)}
                    </p>
                    <p className="mt-1 text-sm text-violet-700">
                        {trans('createPost.material_editor_hint', page)}
                    </p>
                </div>

                <div className="space-y-3">
                    {blocks.map((block, index) => (
                        <div
                            key={block.id}
                            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
                        >
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                                        {index + 1}
                                    </span>
                                    {block.type === 'text'
                                        ? trans(
                                              'createPost.material_text_block',
                                              page,
                                          )
                                        : block.type === 'image'
                                          ? trans(
                                                'createPost.material_image_block',
                                                page,
                                            )
                                          : block.type === 'document'
                                            ? trans(
                                                  'createPost.material_document_block',
                                                  page,
                                              )
                                            : trans(
                                                  'createPost.material_video_block',
                                                  page,
                                              )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onMoveBlock(block.id, -1)
                                        }
                                        disabled={index === 0 || editLoading}
                                        title={trans(
                                            'createPost.material_move_up',
                                            page,
                                        )}
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-30"
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onMoveBlock(block.id, 1)}
                                        disabled={
                                            index === blocks.length - 1 ||
                                            editLoading
                                        }
                                        title={trans(
                                            'createPost.material_move_down',
                                            page,
                                        )}
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-30"
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveBlock(block.id)}
                                        disabled={editLoading}
                                        title={trans(
                                            'createPost.material_remove_block',
                                            page,
                                        )}
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-50 disabled:pointer-events-none disabled:opacity-40"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {block.type === 'text' ? (
                                <textarea
                                    value={block.text}
                                    onChange={(event) =>
                                        onUpdateBlock(block.id, {
                                            text: event.target.value,
                                        })
                                    }
                                    rows={5}
                                    disabled={editLoading}
                                    placeholder={trans(
                                        'createPost.material_text_placeholder',
                                        page,
                                    )}
                                    className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-800 transition outline-none placeholder:text-zinc-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 disabled:opacity-70"
                                />
                            ) : null}

                            {block.type === 'video' ? (
                                <input
                                    type="url"
                                    value={block.url}
                                    onChange={(event) =>
                                        onUpdateBlock(block.id, {
                                            url: event.target.value,
                                        })
                                    }
                                    disabled={editLoading}
                                    placeholder={trans(
                                        'createPost.material_video_placeholder',
                                        page,
                                    )}
                                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 transition outline-none placeholder:text-zinc-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 disabled:opacity-70"
                                />
                            ) : null}

                            {block.type === 'image' ||
                            block.type === 'document' ? (
                                <div className="space-y-3">
                                    {block.existingPath ? (
                                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                                            <p className="text-xs font-semibold text-zinc-500 uppercase">
                                                {trans(
                                                    'createPost.material_current_file',
                                                    page,
                                                )}
                                            </p>
                                            <p className="mt-1 truncate text-sm font-medium text-zinc-800">
                                                {block.existingName ??
                                                    block.existingPath}
                                            </p>
                                            {block.type === 'image' ? (
                                                <img
                                                    src={assetUrl(
                                                        block.existingPath,
                                                    )}
                                                    alt={
                                                        block.existingName ?? ''
                                                    }
                                                    className="mt-3 max-h-64 w-full rounded-lg object-contain"
                                                />
                                            ) : null}
                                        </div>
                                    ) : null}

                                    <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-center transition hover:border-violet-300 hover:bg-violet-50">
                                        <input
                                            type="file"
                                            accept={
                                                block.type === 'image'
                                                    ? 'image/*'
                                                    : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,application/pdf'
                                            }
                                            className="hidden"
                                            disabled={editLoading}
                                            onChange={(event) =>
                                                onUpdateBlockFile(
                                                    block.id,
                                                    event.target.files?.[0] ??
                                                        null,
                                                )
                                            }
                                        />
                                        <Plus className="h-5 w-5 text-violet-600" />
                                        <span className="mt-2 text-sm font-semibold text-zinc-700">
                                            {block.type === 'image'
                                                ? trans(
                                                      'createPost.material_choose_image',
                                                      page,
                                                  )
                                                : trans(
                                                      'createPost.material_choose_document',
                                                      page,
                                                  )}
                                        </span>
                                        {block.file ? (
                                            <span className="mt-1 text-xs text-zinc-500">
                                                {block.file.name}
                                            </span>
                                        ) : null}
                                    </label>

                                    {block.preview ? (
                                        <img
                                            src={block.preview}
                                            alt={block.file?.name ?? ''}
                                            className="max-h-64 w-full rounded-lg object-contain"
                                        />
                                    ) : null}
                                </div>
                            ) : null}

                            {editErrors[`material_blocks.${index}.file`] ? (
                                <p className="mt-2 text-sm text-rose-600">
                                    {
                                        editErrors[
                                            `material_blocks.${index}.file`
                                        ]
                                    }
                                </p>
                            ) : null}
                        </div>
                    ))}
                </div>

                {editErrors.material_blocks ? (
                    <p className="text-sm text-rose-600">
                        {editErrors.material_blocks}
                    </p>
                ) : null}

                <div className="rounded-lg border border-dashed border-violet-300 bg-white p-3">
                    <p className="mb-3 text-sm font-semibold text-zinc-700">
                        {trans('createPost.material_add_block', page)}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {blockOptions.map(({ type, icon: Icon, labelKey }) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => onAddBlock(type)}
                                disabled={editLoading}
                                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:pointer-events-none disabled:opacity-50"
                            >
                                <Icon className="h-4 w-4" />
                                {trans(`createPost.${labelKey}`, page)}
                            </button>
                        ))}
                    </div>
                    <p className="mt-3 text-xs text-zinc-500">
                        {trans('createPost.material_empty_hint', page)}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-violet-100 pt-4">
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={editLoading}
                        className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:pointer-events-none disabled:opacity-60"
                    >
                        <Save className="h-4 w-4" />
                        {editLoading
                            ? trans('createPost.saving', page)
                            : trans('createPost.save_changes', page)}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={editLoading}
                        className="inline-flex items-center gap-2 rounded-full bg-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-300 disabled:pointer-events-none disabled:opacity-60"
                    >
                        <X className="h-4 w-4" />
                        {trans('createPost.cancel', page)}
                    </button>
                </div>
            </div>
        </section>
    );
}

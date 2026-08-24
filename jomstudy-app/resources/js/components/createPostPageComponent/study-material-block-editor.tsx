import {
    ArrowDown,
    ArrowUp,
    FileText,
    Image,
    Plus,
    Text,
    Trash2,
} from 'lucide-react';
import type {
    CreatePostText,
    MaterialBlockType,
    MaterialContentBlock,
} from '../ts/features/create-post/create-post-config';

type StudyMaterialBlockEditorProps = {
    blocks: MaterialContentBlock[];
    text: CreatePostText;
    onAddBlock: (type: MaterialBlockType) => void;
    onUpdateBlock: (id: string, updates: Partial<MaterialContentBlock>) => void;
    onUpdateBlockFile: (id: string, file: File | null) => void;
    onRemoveBlock: (id: string) => void;
    onMoveBlock: (id: string, direction: -1 | 1) => void;
    blockError: string | null;
};

const blockOptions: Array<{
    type: MaterialBlockType;
    icon: typeof Text;
    labelKey:
        | 'materialTextBlock'
        | 'materialImageBlock'
        | 'materialDocumentBlock';
}> = [
    { type: 'text', icon: Text, labelKey: 'materialTextBlock' },
    { type: 'image', icon: Image, labelKey: 'materialImageBlock' },
    { type: 'document', icon: FileText, labelKey: 'materialDocumentBlock' },
];

export function StudyMaterialBlockEditor({
    blocks,
    text,
    onAddBlock,
    onUpdateBlock,
    onUpdateBlockFile,
    onRemoveBlock,
    onMoveBlock,
    blockError,
}: StudyMaterialBlockEditorProps) {
    return (
        <section className="space-y-4 rounded-lg border border-violet-200 bg-violet-50/40 p-4">
            <div>
                <p className="text-base font-semibold text-violet-900">
                    {text.materialEditorTitle}
                </p>
                <p className="mt-1 text-sm text-violet-700">
                    {text.materialEditorHint}
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
                                    ? text.materialTextBlock
                                    : block.type === 'image'
                                      ? text.materialImageBlock
                                      : text.materialDocumentBlock}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => onMoveBlock(block.id, -1)}
                                    disabled={index === 0}
                                    title={text.materialMoveUp}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-30"
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onMoveBlock(block.id, 1)}
                                    disabled={index === blocks.length - 1}
                                    title={text.materialMoveDown}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-30"
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onRemoveBlock(block.id)}
                                    title={text.materialRemoveBlock}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-50"
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
                                placeholder={text.materialTextPlaceholder}
                                className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-800 transition outline-none placeholder:text-zinc-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                            />
                        ) : null}

                        {block.type === 'image' || block.type === 'document' ? (
                            <div className="space-y-3">
                                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-center transition hover:border-violet-300 hover:bg-violet-50">
                                    <input
                                        type="file"
                                        accept={
                                            block.type === 'image'
                                                ? 'image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif'
                                                : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,application/pdf'
                                        }
                                        className="hidden"
                                        onChange={(event) =>
                                            onUpdateBlockFile(
                                                block.id,
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                    <Plus className="h-5 w-5 text-violet-600" />
                                    <span className="mt-2 text-sm font-semibold text-zinc-700">
                                        {block.type === 'image'
                                            ? text.materialChooseImage
                                            : text.materialChooseDocument}
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
                                        className="max-h-64 w-full rounded-lg object-cover"
                                    />
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>

            <div className="rounded-lg border border-dashed border-violet-300 bg-white p-3">
                <p className="mb-3 text-sm font-semibold text-zinc-700">
                    {text.materialAddBlock}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {blockOptions.map(({ type, icon: Icon, labelKey }) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => onAddBlock(type)}
                            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                        >
                            <Icon className="h-4 w-4" />
                            {text[labelKey]}
                        </button>
                    ))}
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                    {text.materialEmptyHint}
                </p>
            </div>

            {blockError ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                    {blockError}
                </p>
            ) : null}
        </section>
    );
}

import { Button } from '@/components/ui/button';
import { FileText, ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import { ChangeEvent, RefObject } from 'react';

type LocalAttachment = {
    file: File;
    preview: string | null;
    type: 'image' | 'pdf';
};

type AttachmentsSectionProps = {
    fileInputRef: RefObject<HTMLInputElement | null>;
    acceptedFileTypes: string;
    attachments: LocalAttachment[];
    fileError: string | null;
    isDragging: boolean;
    onSelectFiles: (event: ChangeEvent<HTMLInputElement>) => void;
    onSetDragging: (isDragging: boolean) => void;
    onDropFiles: (event: React.DragEvent<HTMLDivElement>) => void;
    onRemoveAttachment: (index: number) => void;
    pillActionButton: string;
    pillIconButton: string;
    text: {
        mediaLabel: string;
        addFiles: string;
        dragDropTitle: string;
        dragDropSubtitle: string;
        supportedFormat: string;
        previewAlt: string;
    };
};

export function AttachmentsSection({
    fileInputRef,
    acceptedFileTypes,
    attachments,
    fileError,
    isDragging,
    onSelectFiles,
    onSetDragging,
    onDropFiles,
    onRemoveAttachment,
    pillActionButton,
    pillIconButton,
    text,
}: AttachmentsSectionProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-700">{text.mediaLabel}</p>
                <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={pillActionButton}
                >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {text.addFiles}
                </Button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFileTypes}
                multiple
                className="hidden"
                onChange={onSelectFiles}
            />

            <div
                className={`mt-4 rounded-xl border-2 border-dashed p-6 text-center ${
                    isDragging ? 'border-rose-500 bg-rose-50/50' : 'border-zinc-300'
                }`}
                onDragOver={(event) => {
                    event.preventDefault();
                    onSetDragging(true);
                }}
                onDragLeave={() => onSetDragging(false)}
                onDrop={onDropFiles}
            >
                <UploadCloud className="mx-auto h-10 w-10 text-zinc-400" />
                <p className="mt-4 font-medium text-zinc-700">{text.dragDropTitle}</p>
                <p className="mt-2 text-sm text-zinc-500">{text.dragDropSubtitle}</p>
                <p className="mt-1 text-xs text-zinc-500">{text.supportedFormat}</p>
            </div>

            {fileError && (
                <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                    {fileError}
                </div>
            )}

            <div className="mt-4 space-y-3">
                {attachments.map((attachment, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between rounded-xl border border-zinc-300 bg-white p-3"
                    >
                        <div className="flex items-center">
                            {attachment.type === 'pdf' ? (
                                <FileText className="h-10 w-10 text-rose-500" />
                            ) : (
                                <img
                                    src={attachment.preview || ''}
                                    alt={text.previewAlt}
                                    className="h-10 w-10 rounded-md object-cover"
                                />
                            )}
                            <div className="ml-3">
                                <p className="text-sm font-medium text-zinc-700">{attachment.file.name}</p>
                                <p className="text-xs text-zinc-500">
                                    {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemoveAttachment(index)}
                            className={pillIconButton}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

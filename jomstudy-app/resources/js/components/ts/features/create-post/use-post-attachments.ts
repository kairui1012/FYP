import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { MAX_FILE_SIZE, MAX_TOTAL_SIZE } from './create-post-config';
import type { CreatePostText, LocalAttachment } from './create-post-config';
import {
    getAttachmentKind,
    isSupportedDocument,
    isSupportedImage,
} from './create-post-file-utils';

export function usePostAttachments(t: CreatePostText) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const attachmentsRef = useRef<LocalAttachment[]>([]);
    const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);

    useEffect(() => {
        attachmentsRef.current = attachments;
    }, [attachments]);

    useEffect(
        () => () => {
            attachmentsRef.current.forEach((attachment) => {
                if (attachment.preview) URL.revokeObjectURL(attachment.preview);
            });
        },
        [],
    );

    const appendFiles = (incomingFiles: FileList | File[]) => {
        setFileError(null);
        const validFiles = Array.from(incomingFiles).filter((file) => {
            if (!(isSupportedImage(file) || isSupportedDocument(file))) {
                return false;
            }
            if (file.size > MAX_FILE_SIZE) {
                setFileError(t.fileTooLarge);
                return false;
            }
            return true;
        });

        const selectedKinds = new Set(
            validFiles.map((file) => getAttachmentKind(file)),
        );
        if (selectedKinds.size > 1) {
            setFileError(t.fileTypeLimit);
            return;
        }
        if (validFiles.length === 0) {
            setFileError(t.noValidFiles);
            return;
        }

        setAttachments((previous) => {
            const currentKind = previous[0]?.type;
            if (
                currentKind &&
                currentKind !== getAttachmentKind(validFiles[0])
            ) {
                setFileError(t.fileTypeLimit);
                return previous;
            }

            const existingKeys = new Set(
                previous.map(
                    ({ file }) =>
                        `${file.name}-${file.size}-${file.lastModified}`,
                ),
            );
            let totalSize = previous.reduce(
                (sum, attachment) => sum + attachment.file.size,
                0,
            );
            const nextAttachments: LocalAttachment[] = [];

            validFiles.forEach((file) => {
                if (totalSize + file.size > MAX_TOTAL_SIZE) {
                    setFileError(t.totalSizeExceeded);
                    return;
                }
                const key = `${file.name}-${file.size}-${file.lastModified}`;
                if (existingKeys.has(key)) return;

                const type = getAttachmentKind(file);
                nextAttachments.push({
                    file,
                    type,
                    preview:
                        type === 'image' ? URL.createObjectURL(file) : null,
                });
                totalSize += file.size;
            });

            return [...previous, ...nextAttachments];
        });
    };

    const onSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) appendFiles(event.target.files);
        event.target.value = '';
    };

    const onDropFiles = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (event.dataTransfer.files.length > 0) {
            appendFiles(event.dataTransfer.files);
        }
    };

    const removeAttachment = (indexToRemove: number) => {
        setAttachments((previous) => {
            const target = previous[indexToRemove];
            if (target?.preview) URL.revokeObjectURL(target.preview);
            return previous.filter((_, index) => index !== indexToRemove);
        });
    };

    const clearAttachments = () => {
        attachmentsRef.current.forEach((attachment) => {
            if (attachment.preview) URL.revokeObjectURL(attachment.preview);
        });
        setAttachments([]);
    };

    return {
        fileInputRef,
        attachments,
        isDragging,
        setIsDragging,
        fileError,
        setFileError,
        onSelectFiles,
        onDropFiles,
        removeAttachment,
        clearAttachments,
    };
}

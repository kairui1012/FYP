import { useState } from 'react';
import { MAX_FILE_SIZE } from './create-post-config';
import type {
    CreatePostText,
    MaterialBlockType,
    MaterialContentBlock,
} from './create-post-config';
import {
    isSupportedDocument,
    isSupportedImage,
} from './create-post-file-utils';

function createMaterialBlock(type: MaterialBlockType): MaterialContentBlock {
    return {
        id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        text: '',
        file: null,
        preview: null,
    };
}

export function useStudyMaterialBlocks(t: CreatePostText) {
    const [materialBlocks, setMaterialBlocks] = useState<
        MaterialContentBlock[]
    >([createMaterialBlock('text')]);
    const [materialBlockError, setMaterialBlockError] = useState<string | null>(
        null,
    );

    const addMaterialBlock = (type: MaterialBlockType) => {
        setMaterialBlocks((previous) => [
            ...previous,
            createMaterialBlock(type),
        ]);
    };

    const updateMaterialBlock = (
        blockId: string,
        updates: Partial<MaterialContentBlock>,
    ) => {
        setMaterialBlocks((previous) =>
            previous.map((block) =>
                block.id === blockId ? { ...block, ...updates } : block,
            ),
        );
    };

    const updateMaterialBlockFile = (blockId: string, file: File | null) => {
        setMaterialBlockError(null);
        const targetBlock = materialBlocks.find(
            (block) => block.id === blockId,
        );

        if (file) {
            if (targetBlock?.type === 'image' && !isSupportedImage(file)) {
                setMaterialBlockError(t.noValidFiles);
                return;
            }
            if (
                targetBlock?.type === 'document' &&
                !isSupportedDocument(file)
            ) {
                setMaterialBlockError(t.noValidFiles);
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                setMaterialBlockError(t.fileTooLarge);
                return;
            }
        }

        setMaterialBlocks((previous) =>
            previous.map((block) => {
                if (block.id !== blockId) return block;
                if (block.preview) URL.revokeObjectURL(block.preview);

                return {
                    ...block,
                    file,
                    preview:
                        file && file.type.startsWith('image/')
                            ? URL.createObjectURL(file)
                            : null,
                };
            }),
        );
    };

    const removeMaterialBlock = (blockId: string) => {
        setMaterialBlocks((previous) => {
            const target = previous.find((block) => block.id === blockId);
            if (target?.preview) URL.revokeObjectURL(target.preview);
            const next = previous.filter((block) => block.id !== blockId);
            return next.length > 0 ? next : [createMaterialBlock('text')];
        });
    };

    const moveMaterialBlock = (blockId: string, direction: -1 | 1) => {
        setMaterialBlocks((previous) => {
            const index = previous.findIndex((block) => block.id === blockId);
            const nextIndex = index + direction;
            if (index < 0 || nextIndex < 0 || nextIndex >= previous.length) {
                return previous;
            }
            const next = [...previous];
            const [block] = next.splice(index, 1);
            next.splice(nextIndex, 0, block);
            return next;
        });
    };

    const resetMaterialBlocks = () => {
        materialBlocks.forEach((block) => {
            if (block.preview) URL.revokeObjectURL(block.preview);
        });
        setMaterialBlocks([createMaterialBlock('text')]);
        setMaterialBlockError(null);
    };

    return {
        materialBlocks,
        materialBlockError,
        setMaterialBlockError,
        addMaterialBlock,
        updateMaterialBlock,
        updateMaterialBlockFile,
        removeMaterialBlock,
        moveMaterialBlock,
        resetMaterialBlocks,
    };
}

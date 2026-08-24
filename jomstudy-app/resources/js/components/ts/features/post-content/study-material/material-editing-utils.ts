import type {
    EditableMaterialBlock,
    EditableMaterialBlockType,
} from '@/components/postContentPageComponent/material-editable-body';
import type { MaterialContentBlock } from '@/types';

export function createEditableMaterialBlock(
    type: EditableMaterialBlockType,
): EditableMaterialBlock {
    return {
        id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        text: '',
        file: null,
        preview: null,
        existingPath: null,
        existingName: null,
        existingMime: null,
    };
}

export function normalizeEditableMaterialBlocks(
    blocks: MaterialContentBlock[] | null | undefined,
    fallbackContent: string,
): EditableMaterialBlock[] {
    if (!blocks || blocks.length === 0) {
        return [
            {
                ...createEditableMaterialBlock('text'),
                text: fallbackContent,
            },
        ];
    }

    return blocks.map((block) => {
        if (block.type === 'text') {
            return {
                ...createEditableMaterialBlock('text'),
                text: block.text ?? '',
            };
        }

        return {
            ...createEditableMaterialBlock(block.type),
            existingPath: block.path ?? null,
            existingName: block.name ?? null,
            existingMime: block.mime ?? null,
        };
    });
}

export function revokeMaterialBlockPreviews(blocks: EditableMaterialBlock[]) {
    blocks.forEach((block) => {
        if (block.preview) {
            URL.revokeObjectURL(block.preview);
        }
    });
}

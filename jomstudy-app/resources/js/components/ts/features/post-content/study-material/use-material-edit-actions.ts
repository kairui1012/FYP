import { router } from '@inertiajs/react';
import type { MutableRefObject } from 'react';
import type { EditableMaterialBlock } from '@/components/postContentPageComponent/material-editable-body';
import {
    createEditableMaterialBlock,
    revokeMaterialBlockPreviews,
} from './material-editing-utils';

type UseMaterialEditActionsProps = {
    canManageMaterial: boolean;
    postId: number;
    editTitle: string;
    materialEditBlocks: EditableMaterialBlock[];
    materialEditBlocksRef: MutableRefObject<EditableMaterialBlock[]>;
    setMaterialEditBlocks: React.Dispatch<
        React.SetStateAction<EditableMaterialBlock[]>
    >;
    setEditLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setEditErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useMaterialEditActions({
    canManageMaterial,
    postId,
    editTitle,
    materialEditBlocks,
    materialEditBlocksRef,
    setMaterialEditBlocks,
    setEditLoading,
    setEditErrors,
    setIsEditing,
}: UseMaterialEditActionsProps) {
    const updateMaterialEditBlock = (
        id: string,
        updates: Partial<EditableMaterialBlock>,
    ) => {
        setMaterialEditBlocks((prev) =>
            prev.map((block) =>
                block.id === id ? { ...block, ...updates } : block,
            ),
        );
    };

    const updateMaterialEditBlockFile = (id: string, file: File | null) => {
        setMaterialEditBlocks((prev) =>
            prev.map((block) => {
                if (block.id !== id) return block;

                if (block.preview) {
                    URL.revokeObjectURL(block.preview);
                }

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

    const removeMaterialEditBlock = (id: string) => {
        setMaterialEditBlocks((prev) => {
            const target = prev.find((block) => block.id === id);
            if (target?.preview) {
                URL.revokeObjectURL(target.preview);
            }

            const next = prev.filter((block) => block.id !== id);
            return next.length > 0
                ? next
                : [createEditableMaterialBlock('text')];
        });
    };

    const moveMaterialEditBlock = (id: string, direction: -1 | 1) => {
        setMaterialEditBlocks((prev) => {
            const index = prev.findIndex((block) => block.id === id);
            const nextIndex = index + direction;
            if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) {
                return prev;
            }

            const next = [...prev];
            const [block] = next.splice(index, 1);
            next.splice(nextIndex, 0, block);
            return next;
        });
    };

    const handleMaterialEditSave = () => {
        if (!canManageMaterial) {
            return;
        }

        setEditLoading(true);
        setEditErrors({});

        const formData = new FormData();
        formData.append('_method', 'PATCH');
        formData.append('title', editTitle.trim());
        formData.append('content', '');

        materialEditBlocks.forEach((block, index) => {
            formData.append(`material_blocks[${index}][type]`, block.type);

            if (block.type === 'text') {
                formData.append(
                    `material_blocks[${index}][text]`,
                    block.text.trim(),
                );
            } else {
                if (block.file) {
                    formData.append(
                        `material_blocks[${index}][file]`,
                        block.file,
                    );
                }

                if (block.existingPath) {
                    formData.append(
                        `material_blocks[${index}][existing_path]`,
                        block.existingPath,
                    );
                }

                if (block.existingName) {
                    formData.append(
                        `material_blocks[${index}][existing_name]`,
                        block.existingName,
                    );
                }

                if (block.existingMime) {
                    formData.append(
                        `material_blocks[${index}][existing_mime]`,
                        block.existingMime,
                    );
                }
            }
        });

        router.post(`/posts/${postId}`, formData, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setIsEditing(false);
                revokeMaterialBlockPreviews(materialEditBlocksRef.current);
                setMaterialEditBlocks([]);
            },
            onError: (errors) => {
                setEditErrors(errors as Record<string, string>);
            },
            onFinish: () => {
                setEditLoading(false);
            },
        });
    };

    return {
        updateMaterialEditBlock,
        updateMaterialEditBlockFile,
        removeMaterialEditBlock,
        moveMaterialEditBlock,
        handleMaterialEditSave,
    };
}

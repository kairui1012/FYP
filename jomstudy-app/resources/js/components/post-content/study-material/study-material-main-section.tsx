import { MaterialEditableBody } from '@/components/post-content/study-material/material-editable-body';
import type {
    EditableMaterialBlock,
    EditableMaterialBlockType,
} from '@/components/post-content/study-material/material-editable-body';
import { MaterialPostSections } from '@/components/post-content/study-material/material-post-sections';
import type { PostContentTransFn } from '@/components/post-content/types';
import type { MaterialContentBlock, PostItem } from '@/types';

type StudyMaterialMainSectionProps = {
    page: unknown;
    post: PostItem;
    translatedTitle: string;
    displayedContent: string;
    displayedMaterialBlocks: MaterialContentBlock[] | null;
    canViewLearningAnalytics: boolean;
    isEditing: boolean;
    linkedQuizzes: PostItem[];
    analytics: PostItem['learning_analytics'];
    editTitle: string;
    materialEditBlocks: EditableMaterialBlock[];
    editErrors: Record<string, string>;
    editLoading: boolean;
    trans: PostContentTransFn;
    onEditTitleChange: (value: string) => void;
    onAddMaterialBlock: (type: EditableMaterialBlockType) => void;
    onUpdateMaterialBlock: (
        id: string,
        updates: Partial<EditableMaterialBlock>,
    ) => void;
    onUpdateMaterialBlockFile: (id: string, file: File | null) => void;
    onRemoveMaterialBlock: (id: string) => void;
    onMoveMaterialBlock: (id: string, direction: -1 | 1) => void;
    onSaveMaterialEdit: () => void;
    onCancelEdit: () => void;
};

export function StudyMaterialMainSection({
    page,
    post,
    translatedTitle,
    displayedContent,
    displayedMaterialBlocks,
    canViewLearningAnalytics,
    isEditing,
    linkedQuizzes,
    analytics,
    editTitle,
    materialEditBlocks,
    editErrors,
    editLoading,
    trans,
    onEditTitleChange,
    onAddMaterialBlock,
    onUpdateMaterialBlock,
    onUpdateMaterialBlockFile,
    onRemoveMaterialBlock,
    onMoveMaterialBlock,
    onSaveMaterialEdit,
    onCancelEdit,
}: StudyMaterialMainSectionProps) {
    return (
        <>
            <MaterialPostSections
                page={page}
                post={post}
                translatedTitle={translatedTitle}
                displayedContent={displayedContent}
                displayedMaterialBlocks={displayedMaterialBlocks}
                canViewLearningAnalytics={canViewLearningAnalytics}
                isEditing={isEditing}
                linkedQuizzes={linkedQuizzes}
                analytics={analytics}
            />

            {isEditing ? (
                <MaterialEditableBody
                    page={page}
                    editTitle={editTitle}
                    blocks={materialEditBlocks}
                    editErrors={editErrors}
                    editLoading={editLoading}
                    trans={trans}
                    onEditTitleChange={onEditTitleChange}
                    onAddBlock={onAddMaterialBlock}
                    onUpdateBlock={onUpdateMaterialBlock}
                    onUpdateBlockFile={onUpdateMaterialBlockFile}
                    onRemoveBlock={onRemoveMaterialBlock}
                    onMoveBlock={onMoveMaterialBlock}
                    onSave={onSaveMaterialEdit}
                    onCancel={onCancelEdit}
                />
            ) : null}
        </>
    );
}

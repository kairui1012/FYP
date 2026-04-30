import { PostEditableBody } from '@/components/post-content/post-editable-body';
import { PostVideoEmbed } from '@/components/post-content/post-video-embed';
import { PostQuizPanel } from '@/components/post-content/quiz/post-quiz-panel';
import type {
    EditableMaterialBlock,
    EditableMaterialBlockType,
} from '@/components/post-content/study-material/material-editable-body';
import { StudyMaterialMainSection } from '@/components/post-content/study-material/study-material-main-section';
import type {
    PostContentTransFn,
    QuizData,
    QuizResultState,
} from '@/components/post-content/types';
import type { PostItem } from '@/types';
import type { MaterialContentBlock } from '@/types';

type PostContentMainSectionProps = {
    page: unknown;
    post: PostItem;
    translatedTitle: string;
    displayedContent: string;
    displayedMaterialBlocks: MaterialContentBlock[] | null;
    isAdmin: boolean;
    isEditing: boolean;
    linkedQuizzes: PostItem[];
    analytics: PostItem['learning_analytics'];
    quizData: QuizData | null;
    selectedAnswers: Record<number, string>;
    resultStates: Record<number, QuizResultState>;
    editTitle: string;
    editContent: string;
    materialEditBlocks: EditableMaterialBlock[];
    editErrors: Record<string, string>;
    editLoading: boolean;
    trans: PostContentTransFn;
    onEditTitleChange: (value: string) => void;
    onEditContentChange: (value: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onAddMaterialBlock: (type: EditableMaterialBlockType) => void;
    onUpdateMaterialBlock: (
        id: string,
        updates: Partial<EditableMaterialBlock>,
    ) => void;
    onUpdateMaterialBlockFile: (id: string, file: File | null) => void;
    onRemoveMaterialBlock: (id: string) => void;
    onMoveMaterialBlock: (id: string, direction: -1 | 1) => void;
    onSaveMaterialEdit: () => void;
    onAnswerSelect: (questionIndex: number, value: string) => void;
    onCheckAnswer: (questionIndex: number) => void;
};

export function PostContentMainSection({
    page,
    post,
    translatedTitle,
    displayedContent,
    displayedMaterialBlocks,
    isAdmin,
    isEditing,
    linkedQuizzes,
    analytics,
    quizData,
    selectedAnswers,
    resultStates,
    editTitle,
    editContent,
    materialEditBlocks,
    editErrors,
    editLoading,
    trans,
    onEditTitleChange,
    onEditContentChange,
    onSaveEdit,
    onCancelEdit,
    onAddMaterialBlock,
    onUpdateMaterialBlock,
    onUpdateMaterialBlockFile,
    onRemoveMaterialBlock,
    onMoveMaterialBlock,
    onSaveMaterialEdit,
    onAnswerSelect,
    onCheckAnswer,
}: PostContentMainSectionProps) {
    return (
        <>
            {post.post_type === 'material' ? (
                <StudyMaterialMainSection
                    page={page}
                    post={post}
                    translatedTitle={translatedTitle}
                    displayedContent={displayedContent}
                    displayedMaterialBlocks={displayedMaterialBlocks}
                    isAdmin={isAdmin}
                    isEditing={isEditing}
                    linkedQuizzes={linkedQuizzes}
                    analytics={analytics}
                    editTitle={editTitle}
                    materialEditBlocks={materialEditBlocks}
                    editErrors={editErrors}
                    editLoading={editLoading}
                    trans={trans}
                    onEditTitleChange={onEditTitleChange}
                    onAddMaterialBlock={onAddMaterialBlock}
                    onUpdateMaterialBlock={onUpdateMaterialBlock}
                    onUpdateMaterialBlockFile={onUpdateMaterialBlockFile}
                    onRemoveMaterialBlock={onRemoveMaterialBlock}
                    onMoveMaterialBlock={onMoveMaterialBlock}
                    onSaveMaterialEdit={onSaveMaterialEdit}
                    onCancelEdit={onCancelEdit}
                />
            ) : (
                <>
                    <PostEditableBody
                        page={page}
                        isEditing={isEditing}
                        title={translatedTitle}
                        content={displayedContent}
                        editTitle={editTitle}
                        editContent={editContent}
                        editErrors={editErrors}
                        editLoading={editLoading}
                        trans={trans}
                        onEditTitleChange={onEditTitleChange}
                        onEditContentChange={onEditContentChange}
                        onSave={onSaveEdit}
                        onCancel={onCancelEdit}
                    />

                    <PostVideoEmbed videoUrl={post.video_url} />
                </>
            )}

            {post.post_type === 'quiz' ? (
                <PostQuizPanel
                    postId={post.id}
                    postTitle={post.title}
                    page={page}
                    quizData={quizData}
                    selectedAnswers={selectedAnswers}
                    resultStates={resultStates}
                    trans={trans}
                    onAnswerSelect={onAnswerSelect}
                    onCheckAnswer={onCheckAnswer}
                />
            ) : null}
        </>
    );
}

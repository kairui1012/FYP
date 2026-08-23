import { reactLang } from '@erag/lang-sync-inertia';
import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AnonymousToggleSection } from '@/components/create-post/anonymous-toggle-section';
import { AttachmentsSection } from '@/components/create-post/attachments-section';
import { ContentComposerSection } from '@/components/create-post/content-composer-section';
import {
    ACCEPTED_FILE_TYPES,
    MAX_CONTENT_LENGTH,
    MAX_TITLE_LENGTH,
    buildCreatePostText,
    pillActionButton,
    pillChoiceActive,
    pillChoiceBase,
    pillChoiceIdle,
    pillIconButton,
    pillSubmitButton,
} from '@/components/create-post/create-post-config';
import type { LearningMaterialOption } from '@/components/create-post/create-post-config';
import { CreatePostHeaderSection } from '@/components/create-post/create-post-header-section';
import { LanguageSection } from '@/components/create-post/language-section';
import { MaterialLinkSection } from '@/components/create-post/material-link-section';
import { PostTypeSection } from '@/components/create-post/post-type-section';
import { QuizSetupSection } from '@/components/create-post/quiz-setup-section';
import { StudyMaterialBlockEditor } from '@/components/create-post/study-material-block-editor';
import { SubjectSection } from '@/components/create-post/subject-section';
import { SubmitPostButton } from '@/components/create-post/submit-post-button';
import { TitleInputSection } from '@/components/create-post/title-input-section';
import { useCreatePostForm } from '@/components/create-post/use-create-post-form';
import { VideoLinkSection } from '@/components/create-post/video-link-section';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { PostSubject } from '@/types';

type CreatePostPageProps = {
    subjects?: PostSubject[];
    learningMaterials?: LearningMaterialOption[];
    canPublishStudyMaterial?: boolean;
};

export default function CreatePostPage() {
    const { trans } = reactLang();
    const t = buildCreatePostText(trans);
    const {
        subjects = [],
        learningMaterials = [],
        canPublishStudyMaterial = false,
        auth,
    } = usePage<
        CreatePostPageProps & {
            auth?: { user?: { role?: string } };
        }
    >().props;
    const normalizedRole = (auth?.user?.role ?? '')
        .toString()
        .trim()
        .toLowerCase();
    const canUseAiQuizTools =
        normalizedRole === 'teacher' || normalizedRole === 'admin';

    const {
        fileInputRef,
        contentTextareaRef,
        title,
        setTitle,
        content,
        setContent,
        materialBlocks,
        materialBlockError,
        addMaterialBlock,
        updateMaterialBlock,
        updateMaterialBlockFile,
        removeMaterialBlock,
        moveMaterialBlock,
        isAnonymous,
        setIsAnonymous,
        quizzes,
        addQuiz,
        removeQuiz,
        updateQuizQuestion,
        updateQuizOption,
        updateQuizAnswerIndex,
        updateQuizAiAnswerPlacement,
        generateQuizOptions,
        generatingQuizOptionIds,
        quizOptionErrors,
        selectedMaterialId,
        setSelectedMaterialId,
        generatingMaterialQuiz,
        materialQuizError,
        generateQuizFromMaterial,
        selectedPostType,
        setSelectedPostType,
        selectedSubject,
        setSelectedSubject,
        selectedLanguage,
        setSelectedLanguage,
        attachments,
        videoUrl,
        setVideoUrl,
        isSubmitting,
        isDragging,
        setIsDragging,
        fileError,
        remainingTitleChars,
        remainingContentChars,
        isMathSubjectSelected,
        isPhysicsSubjectSelected,
        isChemistrySubjectSelected,
        showSymbolPreview,
        previewContent,
        isQuizSelected,
        isMaterialSelected,
        mathFormulaPresets,
        physicsSymbolPresets,
        chemistrySymbolPresets,
        canSubmit,
        postTypeOptions,
        subjectOptions,
        languageOptions,
        onSelectFiles,
        onDropFiles,
        removeAttachment,
        insertMathSnippet,
        onSubmit,
    } = useCreatePostForm({
        subjects,
        learningMaterials,
        canPublishStudyMaterial,
        t,
        trans,
    });

    return (
        <>
            <Head title={t.pageTitle} />

            <div className="pb-8">
                <div className="mx-auto w-full max-w-3xl space-y-2 p-4 md:p-6 md:pb-10">
                    <form onSubmit={onSubmit} className="space-y-7">
                        <CreatePostHeaderSection
                            heading={t.heading}
                            subtitle={t.subtitle}
                        />

                        <PostTypeSection
                            postTypeLabel={t.postTypeLabel}
                            postTypeRequired={t.postTypeRequired}
                            selectedPostType={selectedPostType}
                            onSelectPostType={setSelectedPostType}
                            options={postTypeOptions}
                            pillChoiceBase={pillChoiceBase}
                        />

                        {selectedPostType === 'question' ? (
                            <AnonymousToggleSection
                                isAnonymous={isAnonymous}
                                onToggle={() => setIsAnonymous((prev) => !prev)}
                                label={t.anonymousLabel}
                                hint={t.anonymousHint}
                            />
                        ) : null}

                        {!canPublishStudyMaterial ? (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                                {t.studentPostHint}
                            </div>
                        ) : null}

                        <TitleInputSection
                            value={title}
                            onChange={setTitle}
                            maxLength={MAX_TITLE_LENGTH}
                            label={t.titleLabel}
                            placeholder={t.titlePlaceholder}
                            remainingChars={remainingTitleChars}
                            charsLeftText={t.charsLeft}
                        />

                        {isMaterialSelected ? (
                            <StudyMaterialBlockEditor
                                blocks={materialBlocks}
                                text={t}
                                onAddBlock={addMaterialBlock}
                                onUpdateBlock={updateMaterialBlock}
                                onUpdateBlockFile={updateMaterialBlockFile}
                                onRemoveBlock={removeMaterialBlock}
                                onMoveBlock={moveMaterialBlock}
                                blockError={materialBlockError}
                            />
                        ) : (
                            <ContentComposerSection
                                isQuizSelected={false}
                                content={content}
                                onChangeContent={setContent}
                                contentTextareaRef={contentTextareaRef}
                                maxContentLength={MAX_CONTENT_LENGTH}
                                contentLabel={t.contentLabel}
                                quizQuestionLabel={t.quizQuestionLabel}
                                contentPlaceholder={t.contentPlaceholder}
                                quizQuestionPlaceholder={
                                    t.quizQuestionPlaceholder
                                }
                                isMathSubjectSelected={isMathSubjectSelected}
                                isPhysicsSubjectSelected={
                                    isPhysicsSubjectSelected
                                }
                                isChemistrySubjectSelected={
                                    isChemistrySubjectSelected
                                }
                                mathFormulaPresets={mathFormulaPresets}
                                physicsSymbolPresets={physicsSymbolPresets}
                                chemistrySymbolPresets={chemistrySymbolPresets}
                                onInsertSnippet={insertMathSnippet}
                                showSymbolPreview={showSymbolPreview}
                                symbolPreviewTitle={t.symbolPreviewTitle}
                                symbolPreviewHint={t.symbolPreviewHint}
                                previewContent={previewContent}
                                helperText={t.helperText}
                                remainingContentChars={remainingContentChars}
                                charsLeft={t.charsLeft}
                                mathToolTitle={t.mathToolTitle}
                                mathToolHint={t.mathToolHint}
                                physicsToolTitle={t.physicsToolTitle}
                                physicsToolHint={t.physicsToolHint}
                                chemistryToolTitle={t.chemistryToolTitle}
                                chemistryToolHint={t.chemistryToolHint}
                            />
                        )}

                        {isQuizSelected ? (
                            <QuizSetupSection
                                quizzes={quizzes}
                                canUseAiQuizTools={canUseAiQuizTools}
                                onAddQuiz={addQuiz}
                                onRemoveQuiz={removeQuiz}
                                onUpdateQuestion={updateQuizQuestion}
                                onUpdateOption={updateQuizOption}
                                onUpdateAnswerIndex={updateQuizAnswerIndex}
                                onUpdateAiAnswerPlacement={
                                    updateQuizAiAnswerPlacement
                                }
                                onGenerateQuizOptions={generateQuizOptions}
                                generatingQuizOptionIds={
                                    generatingQuizOptionIds
                                }
                                quizOptionErrors={quizOptionErrors}
                                text={{
                                    quizSectionTitle: t.quizSectionTitle,
                                    quizSectionHint: t.quizSectionHint,
                                    quizNumberLabel: t.quizNumberLabel,
                                    quizQuestionInputLabel:
                                        t.quizQuestionInputLabel,
                                    quizQuestionPlaceholder:
                                        t.quizQuestionPlaceholder,
                                    quizOptionLabel: t.quizOptionLabel,
                                    quizOptionPlaceholder:
                                        t.quizOptionPlaceholder,
                                    quizAddQuiz: t.quizAddQuiz,
                                    quizRemoveQuiz: t.quizRemoveQuiz,
                                    quizAnswerLabel: t.quizAnswerLabel,
                                    quizAnswerPlaceholder:
                                        t.quizAnswerPlaceholder,
                                    quizRequiredHint: t.quizRequiredHint,
                                    quizAiAddOptions: t.quizAiAddOptions,
                                    quizAiAddingOptions: t.quizAiAddingOptions,
                                    quizAiAnswerPlacementLabel:
                                        t.quizAiAnswerPlacementLabel,
                                    quizAiAnswerPlacementRandom:
                                        t.quizAiAnswerPlacementRandom,
                                }}
                            />
                        ) : null}

                        <MaterialLinkSection
                            materials={learningMaterials}
                            selectedMaterialId={selectedMaterialId}
                            selectedPostType={selectedPostType}
                            canUseAiQuizTools={canUseAiQuizTools}
                            onSelectMaterial={setSelectedMaterialId}
                            onGenerateMaterialQuiz={generateQuizFromMaterial}
                            generatingMaterialQuiz={generatingMaterialQuiz}
                            materialQuizError={materialQuizError}
                        />

                        <SubjectSection
                            subjectLabel={t.subjectLabel}
                            subjectHint={t.subjectHint}
                            subjectRequired={t.subjectRequired}
                            selectedLabel={t.selected}
                            tapToChooseLabel={t.tapToChoose}
                            selectedSubject={selectedSubject}
                            onSelectSubject={setSelectedSubject}
                            subjects={subjectOptions}
                            pillChoiceBase={pillChoiceBase}
                            pillChoiceActive={pillChoiceActive}
                            pillChoiceIdle={pillChoiceIdle}
                        />

                        <LanguageSection
                            languageLabel={t.languageLabel}
                            languageRequired={t.languageRequired}
                            selectedLanguage={selectedLanguage}
                            onSelectLanguage={setSelectedLanguage}
                            options={languageOptions}
                            pillChoiceBase={pillChoiceBase}
                        />

                        {!isMaterialSelected ? (
                            <>
                                <AttachmentsSection
                                    fileInputRef={fileInputRef}
                                    acceptedFileTypes={ACCEPTED_FILE_TYPES}
                                    attachments={attachments}
                                    fileError={fileError}
                                    isDragging={isDragging}
                                    onSelectFiles={onSelectFiles}
                                    onSetDragging={setIsDragging}
                                    onDropFiles={onDropFiles}
                                    onRemoveAttachment={removeAttachment}
                                    pillActionButton={pillActionButton}
                                    pillIconButton={pillIconButton}
                                    text={{
                                        mediaLabel: t.mediaLabel,
                                        addFiles: t.addFiles,
                                        dragDropTitle: t.dragDropTitle,
                                        dragDropSubtitle: t.dragDropSubtitle,
                                        supportedFormat: t.supportedFormat,
                                        previewAlt: t.previewAlt,
                                    }}
                                />

                                <VideoLinkSection
                                    videoUrl={videoUrl}
                                    onChangeVideoUrl={setVideoUrl}
                                    pillIconButton={pillIconButton}
                                />
                            </>
                        ) : null}

                        <div className="pt-4">
                            <SubmitPostButton
                                canSubmit={canSubmit}
                                isSubmitting={isSubmitting}
                                publishingText={t.publishing}
                                publishText={t.publishPost}
                                className={pillSubmitButton}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

function CreatePostLayout({ children }: { children: ReactNode }) {
    const { trans } = reactLang();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: trans('createPost.page_title'),
            href: homePage(),
        },
    ];

    return <AppLayout breadcrumbs={breadcrumbs}>{children}</AppLayout>;
}

CreatePostPage.layout = (page: ReactNode) => (
    <CreatePostLayout>{page}</CreatePostLayout>
);

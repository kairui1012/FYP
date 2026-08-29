import { reactLang } from '@erag/lang-sync-inertia';
import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AnonymousToggleSection } from '@/components/createPostPageComponent/anonymous-toggle-section';
import { ContentComposerSection } from '@/components/createPostPageComponent/content-composer-section';
import { LanguageSection } from '@/components/createPostPageComponent/language-section';
import { MaterialLinkSection } from '@/components/createPostPageComponent/material-link-section';
import { PostTypeSection } from '@/components/createPostPageComponent/post-type-section';
import { QuizSetupSection } from '@/components/createPostPageComponent/quiz-setup-section';
import { StudyMaterialBlockEditor } from '@/components/createPostPageComponent/study-material-block-editor';
import { SubjectSection } from '@/components/createPostPageComponent/subject-section';
import { SubmitPostButton } from '@/components/createPostPageComponent/submit-post-button';
import { TitleInputSection } from '@/components/createPostPageComponent/title-input-section';
import { AttachmentsSection } from '@/components/shared/attachments-section';
import type { LearningMaterialOption } from '@/components/ts/features/create-post/create-post-config';
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
} from '@/components/ts/features/create-post/create-post-config';
import { useCreatePostForm } from '@/components/ts/features/create-post/use-create-post-form';
import AppLayout from '@/layouts/app-layout';
import { index as homePage } from '@/routes/feed';
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
        isSubmitting,
        isDragging,
        setIsDragging,
        fileError,
        remainingTitleChars,
        remainingContentChars,
        isQuizSelected,
        isMaterialSelected,
        canSubmit,
        postTypeOptions,
        subjectOptions,
        languageOptions,
        onSelectFiles,
        onDropFiles,
        removeAttachment,
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
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                                {t.heading}
                            </h1>
                            <p className="text-base text-zinc-600">
                                {t.subtitle}
                            </p>
                        </div>

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
                                helperText={t.helperText}
                                remainingContentChars={remainingContentChars}
                                charsLeft={t.charsLeft}
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

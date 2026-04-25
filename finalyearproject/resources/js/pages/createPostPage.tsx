import { Head, usePage } from '@inertiajs/react';
import { Send } from 'lucide-react';
import { type ReactNode } from 'react';
import { reactLang } from '@erag/lang-sync-inertia';
import { AttachmentsSection } from '@/components/create-post/attachments-section';
import { VideoLinkSection } from '@/components/create-post/video-link-section';
import { ContentComposerSection } from '@/components/create-post/content-composer-section';
import { LanguageSection } from '@/components/create-post/language-section';
import { PostTypeSection } from '@/components/create-post/post-type-section';
import { QuizSetupSection } from '@/components/create-post/quiz-setup-section';
import { SubjectSection } from '@/components/create-post/subject-section';
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
import { useCreatePostForm } from '@/components/create-post/use-create-post-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { PostSubject } from '@/types';

type CreatePostPageProps = {
    subjects?: PostSubject[];
};

export default function CreatePostPage() {
    const { trans } = reactLang();
    const t = buildCreatePostText(trans);
    const { subjects = [] } = usePage<CreatePostPageProps>().props;

    const {
        fileInputRef,
        contentTextareaRef,
        title,
        setTitle,
        content,
        setContent,
        isAnonymous,
        setIsAnonymous,
        quizzes,
        addQuiz,
        removeQuiz,
        updateQuizQuestion,
        updateQuizOption,
        updateQuizAnswerIndex,
        addQuizOption,
        removeQuizOption,
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
    } = useCreatePostForm({ subjects, t, trans });

    return (
        <>
            <Head title={t.pageTitle} />

            <div className="pb-8">
                <div className="mx-auto w-full max-w-3xl space-y-2 p-4 md:p-6 md:pb-10">
                    <form onSubmit={onSubmit} className="space-y-7">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{t.heading}</h1>
                            <p className="text-base text-zinc-600">{t.subtitle}</p>
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="title" className="text-base font-medium text-zinc-700">
                                {t.titleLabel}
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                maxLength={MAX_TITLE_LENGTH}
                                placeholder={t.titlePlaceholder}
                                className="w-full rounded-xl border-0 bg-zinc-100 px-5 py-3.5 text-base text-zinc-800 outline-none transition placeholder:text-zinc-500 focus:bg-zinc-200/80 focus:ring-0"
                            />
                            <div className="text-right text-sm text-zinc-500">
                                {remainingTitleChars} {t.charsLeft}
                            </div>
                        </div>

                        <ContentComposerSection
                            isQuizSelected={false}
                            content={content}
                            onChangeContent={setContent}
                            contentTextareaRef={contentTextareaRef}
                            maxContentLength={MAX_CONTENT_LENGTH}
                            contentLabel={t.contentLabel}
                            quizQuestionLabel={t.quizQuestionLabel}
                            contentPlaceholder={t.contentPlaceholder}
                            quizQuestionPlaceholder={t.quizQuestionPlaceholder}
                            isMathSubjectSelected={isMathSubjectSelected}
                            isPhysicsSubjectSelected={isPhysicsSubjectSelected}
                            isChemistrySubjectSelected={isChemistrySubjectSelected}
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

                        {/* Anonymous Toggle — between content and post type */}
                        <div className="flex items-start gap-4 rounded-xl bg-zinc-50 px-5 py-4">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isAnonymous}
                                onClick={() => setIsAnonymous((prev) => !prev)}
                                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 ${
                                    isAnonymous ? 'bg-zinc-800' : 'bg-zinc-300'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                                        isAnonymous ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                            <div className="min-w-0 flex-1">
                                <p className="text-base font-medium text-zinc-800">Post Anonymously</p>
                                {isAnonymous ? (
                                    <p className="mt-0.5 text-sm text-zinc-500">
                                        Your name and avatar will be hidden from others
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        {isQuizSelected ? (
                            <QuizSetupSection
                                quizzes={quizzes}
                                onAddQuiz={addQuiz}
                                onRemoveQuiz={removeQuiz}
                                onUpdateQuestion={updateQuizQuestion}
                                onUpdateOption={updateQuizOption}
                                onUpdateAnswerIndex={updateQuizAnswerIndex}
                                onAddOption={addQuizOption}
                                onRemoveOption={removeQuizOption}
                                text={{
                                    quizSectionTitle: t.quizSectionTitle,
                                    quizSectionHint: t.quizSectionHint,
                                    quizNumberLabel: t.quizNumberLabel,
                                    quizQuestionInputLabel: t.quizQuestionInputLabel,
                                    quizQuestionPlaceholder: t.quizQuestionPlaceholder,
                                    quizOptionLabel: t.quizOptionLabel,
                                    quizOptionPlaceholder: t.quizOptionPlaceholder,
                                    quizAddOption: t.quizAddOption,
                                    quizRemoveOption: t.quizRemoveOption,
                                    quizAddQuiz: t.quizAddQuiz,
                                    quizRemoveQuiz: t.quizRemoveQuiz,
                                    quizAnswerLabel: t.quizAnswerLabel,
                                    quizAnswerPlaceholder: t.quizAnswerPlaceholder,
                                    quizRequiredHint: t.quizRequiredHint,
                                }}
                            />
                        ) : null}

                        <PostTypeSection
                            postTypeLabel={t.postTypeLabel}
                            postTypeRequired={t.postTypeRequired}
                            selectedPostType={selectedPostType}
                            onSelectPostType={setSelectedPostType}
                            options={postTypeOptions}
                            pillChoiceBase={pillChoiceBase}
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

                        <div className="pt-4">
                            <Button type="submit" disabled={!canSubmit} className={pillSubmitButton}>
                                {isSubmitting ? (
                                    <>
                                        <Send className="mr-2 h-4 w-4 animate-spin" />
                                        {t.publishing}
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        {t.publishPost}
                                    </>
                                )}
                            </Button>
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

CreatePostPage.layout = (page: ReactNode) => <CreatePostLayout>{page}</CreatePostLayout>;

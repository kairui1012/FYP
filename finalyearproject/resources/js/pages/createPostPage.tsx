import { Head, usePage } from '@inertiajs/react';
import { Send } from 'lucide-react';
import { type ReactNode } from 'react';
import { reactLang } from '@erag/lang-sync-inertia';
import { AttachmentsSection } from '@/components/create-post/attachments-section';
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
    lessons?: Array<{
        id: number;
        title: string;
        sequence: number;
        subject_id: number | null;
        subject_name: string | null;
    }>;
};

export default function CreatePostPage() {
    const { trans } = reactLang();
    const t = buildCreatePostText(trans);
    const { subjects = [], lessons = [] } = usePage<CreatePostPageProps>().props;

    const {
        fileInputRef,
        contentTextareaRef,
        title,
        setTitle,
        content,
        setContent,
        quizOptions,
        setQuizOptions,
        quizAnswerIndex,
        setQuizAnswerIndex,
        selectedPostType,
        setSelectedPostType,
        selectedSubject,
        setSelectedSubject,
        selectedLesson,
        setSelectedLesson,
        selectedLanguage,
        setSelectedLanguage,
        attachments,
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
        isQuestionSelected,
        filteredLessons,
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
    } = useCreatePostForm({ subjects, lessons, t, trans });

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
                            isQuizSelected={isQuizSelected}
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

                        {isQuizSelected ? (
                            <QuizSetupSection
                                quizOptions={quizOptions}
                                quizAnswerIndex={quizAnswerIndex}
                                onChangeOption={(index, value) => {
                                    setQuizOptions((prev) =>
                                        prev.map((item, optionIndex) => (optionIndex === index ? value : item))
                                    );
                                }}
                                onChangeAnswerIndex={setQuizAnswerIndex}
                                text={{
                                    quizSectionTitle: t.quizSectionTitle,
                                    quizSectionHint: t.quizSectionHint,
                                    quizOptionLabel: t.quizOptionLabel,
                                    quizOptionPlaceholder: t.quizOptionPlaceholder,
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

                        {isQuestionSelected ? (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <p className="text-base font-medium text-zinc-700">Lesson</p>
                                    <p className="text-sm text-zinc-500">Select which lesson this question belongs to.</p>
                                </div>
                                <select
                                    value={selectedLesson}
                                    onChange={(event) => setSelectedLesson(event.target.value)}
                                    className="w-full rounded-xl border-0 bg-zinc-100 px-5 py-3.5 text-base text-zinc-800 outline-none transition focus:bg-zinc-200/80 focus:ring-0"
                                    required
                                >
                                    <option value="">Select lesson</option>
                                    {filteredLessons.map((lesson) => (
                                        <option key={lesson.id} value={lesson.id}>
                                            {`Lesson ${lesson.sequence}: ${lesson.title}`}
                                        </option>
                                    ))}
                                </select>
                                {selectedSubject && filteredLessons.length === 0 ? (
                                    <p className="text-sm text-amber-700">No lessons found for selected subject yet.</p>
                                ) : null}
                            </div>
                        ) : null}

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

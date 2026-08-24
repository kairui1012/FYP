import { router } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { PostSubject } from '@/types';
import {
    LANGUAGE_OPTIONS,
    MAX_CONTENT_LENGTH,
    MAX_TITLE_LENGTH,
    POST_TYPE_OPTIONS,
    getSubjectIcon,
} from './create-post-config';
import type {
    CreatePostText,
    LearningMaterialOption,
} from './create-post-config';
import { usePostAttachments } from './use-post-attachments';
import { usePostQuizzes } from './use-post-quizzes';
import { useStudyMaterialBlocks } from './use-study-material-blocks';

type UseCreatePostFormParams = {
    subjects: PostSubject[];
    learningMaterials: LearningMaterialOption[];
    canPublishStudyMaterial: boolean;
    t: CreatePostText;
    trans: (key: string) => string;
};
const QUIZ_OPTION_COUNT = 4;
const POST_TYPE_STYLES = {
    question: {
        active: 'border-emerald-600 bg-linear-to-r from-emerald-400 to-emerald-600 text-white shadow-[0_8px_20px_rgba(5,150,105,0.25)]',
        idle: 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700',
    },
    quiz: {
        active: 'border-amber-600 bg-linear-to-r from-amber-400 to-amber-600 text-white shadow-[0_8px_20px_rgba(217,119,6,0.25)]',
        idle: 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700',
    },
    material: {
        active: 'border-violet-600 bg-linear-to-r from-violet-400 to-violet-600 text-white shadow-[0_8px_20px_rgba(124,58,237,0.25)]',
        idle: 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700',
    },
} as const;
const LANGUAGE_STYLES = {
    en: {
        active: 'border-blue-600 bg-linear-to-r from-blue-400 to-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)]',
        idle: 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700',
    },
    zh: {
        active: 'border-rose-600 bg-linear-to-r from-rose-400 to-rose-600 text-white shadow-[0_8px_20px_rgba(225,29,72,0.25)]',
        idle: 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700',
    },
    bm: {
        active: 'border-amber-500 bg-linear-to-r from-amber-300 to-amber-500 text-white shadow-[0_8px_20px_rgba(245,158,11,0.3)]',
        idle: 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700',
    },
} as const;

function getXsrfToken() {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}
function getMetaCsrfToken() {
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? ''
    );
}

export function useCreatePostForm({
    subjects,
    learningMaterials,
    canPublishStudyMaterial,
    t,
    trans,
}: UseCreatePostFormParams) {
    const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedPostType, setSelectedPostType] = useState('');
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const attachmentState = usePostAttachments(t);
    const materialState = useStudyMaterialBlocks(t);
    const quizState = usePostQuizzes({
        learningMaterials,
        selectedMaterialId,
        selectedSubject,
        selectedLanguage,
        t,
        title,
        content,
        setTitle,
        setContent,
    });
    const isQuizSelected = selectedPostType === 'quiz';
    const isMaterialSelected = selectedPostType === 'material';
    const hasValidMaterialBlocks = materialState.materialBlocks.some((block) =>
        block.type === 'text' ? block.text.trim() !== '' : Boolean(block.file),
    );
    const hasValidQuiz =
        quizState.quizzes.length > 0 &&
        quizState.quizzes.every(
            (quiz) =>
                quiz.question.trim() !== '' &&
                quiz.options.length === QUIZ_OPTION_COUNT &&
                quiz.options.every((option) => option.trim() !== '') &&
                quiz.answerIndex !== '' &&
                Number.parseInt(quiz.answerIndex, 10) < quiz.options.length,
        );
    const canSubmit =
        title.trim() !== '' &&
        (isMaterialSelected || content.trim() !== '') &&
        selectedPostType !== '' &&
        selectedSubject !== '' &&
        selectedLanguage !== '' &&
        (!isQuizSelected || hasValidQuiz) &&
        (!isMaterialSelected || hasValidMaterialBlocks) &&
        !isSubmitting;

    const postTypeOptions = useMemo(
        () =>
            POST_TYPE_OPTIONS.filter(
                (postType) =>
                    postType.value !== 'material' || canPublishStudyMaterial,
            ).map((postType) => ({
                value: postType.value,
                label: t[postType.labelKey],
                description: t[postType.descriptionKey],
                activeClass: POST_TYPE_STYLES[postType.value].active,
                idleClass: POST_TYPE_STYLES[postType.value].idle,
            })),
        [canPublishStudyMaterial, t],
    );
    const subjectOptions = useMemo(
        () =>
            subjects.map((subject) => {
                const name = subject?.name ?? '';
                const key = 'subjects.' + name;
                const translatedName = trans(key);
                return {
                    id: String(subject?.id),
                    displayName: translatedName === key ? name : translatedName,
                    Icon: getSubjectIcon(name),
                };
            }),
        [subjects, trans],
    );
    const languageOptions = useMemo(
        () =>
            LANGUAGE_OPTIONS.map((language) => ({
                code: language.code,
                label: language.label,
                activeClass: LANGUAGE_STYLES[language.code].active,
                idleClass: LANGUAGE_STYLES[language.code].idle,
            })),
        [],
    );

    const setPostType = (value: string) => {
        if (value === 'material' && !canPublishStudyMaterial) return;
        setSelectedPostType(value);
        if (value !== 'quiz') setSelectedMaterialId('');
        if (value === 'material') setIsAnonymous(false);
    };
    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit) return;
        setIsSubmitting(true);
        attachmentState.setFileError(null);
        const csrfToken = getMetaCsrfToken();
        const xsrfToken = getXsrfToken();
        const formData = new FormData();
        if (!xsrfToken && csrfToken) formData.append('_token', csrfToken);
        formData.append('title', title.trim());
        formData.append('content', isMaterialSelected ? '' : content.trim());
        formData.append('post_type', selectedPostType);
        formData.append('subject_id', selectedSubject);
        formData.append('language_code', selectedLanguage);
        formData.append(
            'is_anonymous',
            selectedPostType === 'question' && isAnonymous ? '1' : '0',
        );
        if (selectedMaterialId && isQuizSelected)
            formData.append('parent_material_id', selectedMaterialId);
        if (isQuizSelected)
            quizState.quizzes.forEach((quiz, index) => {
                const key = 'quiz_questions[' + index + ']';
                formData.append(key + '[question]', quiz.question.trim());
                quiz.options.forEach((option) =>
                    formData.append(key + '[options][]', option.trim()),
                );
                formData.append(key + '[answer_index]', quiz.answerIndex);
                if (quiz.explanation?.trim())
                    formData.append(
                        key + '[explanation]',
                        quiz.explanation.trim(),
                    );
            });
        if (isMaterialSelected) {
            materialState.setMaterialBlockError(null);
            materialState.materialBlocks.forEach((block, index) => {
                const key = 'material_blocks[' + index + ']';
                formData.append(key + '[type]', block.type);
                if (block.type === 'text')
                    formData.append(key + '[text]', block.text.trim());
                else if (block.file)
                    formData.append(key + '[file]', block.file);
            });
        }
        attachmentState.attachments.forEach(({ file }) =>
            formData.append('attachments[]', file),
        );
        router.post('/posts', formData, {
            forceFormData: true,
            headers: xsrfToken
                ? { 'X-XSRF-TOKEN': xsrfToken }
                : { 'X-CSRF-TOKEN': csrfToken },
            onError: (errors) => {
                const uploadError = Object.entries(errors).find(([key]) =>
                    key.startsWith('attachments'),
                )?.[1];
                const materialError = Object.entries(errors).find(([key]) =>
                    key.startsWith('material_blocks'),
                )?.[1];
                if (uploadError) attachmentState.setFileError(uploadError);
                if (materialError)
                    materialState.setMaterialBlockError(materialError);
            },
            onSuccess: () => {
                setTitle('');
                setContent('');
                setSelectedPostType('');
                setSelectedMaterialId('');
                setSelectedSubject('');
                setSelectedLanguage('');
                setIsAnonymous(false);
                attachmentState.clearAttachments();
                materialState.resetMaterialBlocks();
                quizState.resetQuizzes();
            },
            onFinish: () => setIsSubmitting(false),
        });
    };
    return {
        fileInputRef: attachmentState.fileInputRef,
        contentTextareaRef,
        title,
        setTitle,
        content,
        setContent,
        materialBlocks: materialState.materialBlocks,
        materialBlockError: materialState.materialBlockError,
        addMaterialBlock: materialState.addMaterialBlock,
        updateMaterialBlock: materialState.updateMaterialBlock,
        updateMaterialBlockFile: materialState.updateMaterialBlockFile,
        removeMaterialBlock: materialState.removeMaterialBlock,
        moveMaterialBlock: materialState.moveMaterialBlock,
        isAnonymous,
        setIsAnonymous,
        quizzes: quizState.quizzes,
        addQuiz: quizState.addQuiz,
        removeQuiz: quizState.removeQuiz,
        updateQuizQuestion: quizState.updateQuizQuestion,
        updateQuizOption: quizState.updateQuizOption,
        updateQuizAnswerIndex: quizState.updateQuizAnswerIndex,
        updateQuizAiAnswerPlacement: quizState.updateQuizAiAnswerPlacement,
        generateQuizOptions: quizState.generateQuizOptions,
        generatingQuizOptionIds: quizState.generatingQuizOptionIds,
        quizOptionErrors: quizState.quizOptionErrors,
        selectedMaterialId,
        setSelectedMaterialId,
        generatingMaterialQuiz: quizState.generatingMaterialQuiz,
        materialQuizError: quizState.materialQuizError,
        generateQuizFromMaterial: quizState.generateQuizFromMaterial,
        selectedPostType,
        setSelectedPostType: setPostType,
        selectedSubject,
        setSelectedSubject,
        selectedLanguage,
        setSelectedLanguage,
        attachments: attachmentState.attachments,
        isSubmitting,
        isDragging: attachmentState.isDragging,
        setIsDragging: attachmentState.setIsDragging,
        fileError: attachmentState.fileError,
        remainingTitleChars: MAX_TITLE_LENGTH - title.length,
        remainingContentChars: MAX_CONTENT_LENGTH - content.length,
        isQuizSelected,
        isMaterialSelected,
        canSubmit,
        postTypeOptions,
        subjectOptions,
        languageOptions,
        onSelectFiles: attachmentState.onSelectFiles,
        onDropFiles: attachmentState.onDropFiles,
        removeAttachment: attachmentState.removeAttachment,
        onSubmit,
    };
}

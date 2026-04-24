import { router } from '@inertiajs/react';
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { formatFormulaText } from '@/lib/formula-display';
import type { PostSubject } from '@/types';
import {
    ACCEPTED_FILE_TYPES,
    LANGUAGE_OPTIONS,
    MAX_CONTENT_LENGTH,
    MAX_FILE_SIZE,
    MAX_TITLE_LENGTH,
    MAX_TOTAL_SIZE,
    POST_TYPE_OPTIONS,
    type CreatePostText,
    type LocalAttachment,
    getSubjectIcon,
} from './create-post-config';

type LessonItem = {
    id: number;
    title: string;
    sequence: number;
    subject_id: number | null;
    subject_name: string | null;
};

type UseCreatePostFormParams = {
    subjects: PostSubject[];
    lessons: LessonItem[];
    t: CreatePostText;
    trans: (key: string) => string;
};

export function useCreatePostForm({ subjects, lessons, t, trans }: UseCreatePostFormParams) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    const attachmentsRef = useRef<LocalAttachment[]>([]);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [quizOptions, setQuizOptions] = useState<string[]>(['', '', '', '']);
    const [quizAnswerIndex, setQuizAnswerIndex] = useState<string>('');
    const [selectedPostType, setSelectedPostType] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedLesson, setSelectedLesson] = useState<string>('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);

    useEffect(() => {
        attachmentsRef.current = attachments;
    }, [attachments]);

    useEffect(() => {
        return () => {
            attachmentsRef.current.forEach((attachment) => {
                if (attachment.preview) {
                    URL.revokeObjectURL(attachment.preview);
                }
            });
        };
    }, []);

    const remainingTitleChars = useMemo(() => MAX_TITLE_LENGTH - title.length, [title.length]);
    const remainingContentChars = useMemo(() => MAX_CONTENT_LENGTH - content.length, [content.length]);

    const selectedSubjectName = useMemo(() => {
        const matchedSubject = subjects.find((subject) => String(subject?.id) === selectedSubject);
        return matchedSubject?.name ?? '';
    }, [selectedSubject, subjects]);

    const isMathSubjectSelected = useMemo(() => selectedSubjectName.toLowerCase().includes('math'), [selectedSubjectName]);
    const isPhysicsSubjectSelected = useMemo(() => selectedSubjectName.toLowerCase().includes('physics'), [selectedSubjectName]);
    const isChemistrySubjectSelected = useMemo(() => selectedSubjectName.toLowerCase().includes('chemistry'), [selectedSubjectName]);

    const showSymbolPreview = isMathSubjectSelected || isPhysicsSubjectSelected || isChemistrySubjectSelected;
    const previewContent = useMemo(() => formatFormulaText(content), [content]);
    const isQuizSelected = selectedPostType === 'quiz';
    const isQuestionSelected = selectedPostType === 'question';
    const hasValidQuiz = quizOptions.every((option) => option.trim().length > 0) && quizAnswerIndex !== '';

    const filteredLessons = useMemo(() => {
        if (!selectedSubject) {
            return [];
        }

        return lessons.filter((lesson) => String(lesson.subject_id ?? '') === selectedSubject);
    }, [lessons, selectedSubject]);

    useEffect(() => {
        if (!isQuestionSelected) {
            setSelectedLesson('');
        }
    }, [isQuestionSelected]);

    useEffect(() => {
        if (!selectedLesson) {
            return;
        }

        const existsInFiltered = filteredLessons.some((lesson) => String(lesson.id) === selectedLesson);
        if (!existsInFiltered) {
            setSelectedLesson('');
        }
    }, [filteredLessons, selectedLesson]);

    const mathFormulaPresets = useMemo(
        () => [
            { key: 'inline', label: t.mathInline, snippet: '$$' },
            { key: 'block', label: t.mathBlock, snippet: '$$\\n\\n$$' },
            { key: 'fraction', label: t.mathFraction, snippet: '\\frac{}{ }' },
            { key: 'sqrt', label: t.mathSqrt, snippet: '\\sqrt{}' },
            { key: 'power', label: t.mathPower, snippet: '^{ }' },
            { key: 'integral', label: t.mathIntegral, snippet: '\\int_{}^{}' },
            { key: 'sigma', label: t.mathSigma, snippet: '\\sum_{}^{}' },
            { key: 'limit', label: 'lim', snippet: '\\lim_{}' },
            { key: 'derivative', label: "f'(x)", snippet: '\\frac{d}{dx}' },
            { key: 'partial', label: '∂', snippet: '\\partial' },
            { key: 'doubleIntegral', label: '∬', snippet: '\\iint_{}' },
            { key: 'matrix', label: '[]', snippet: '\\begin{bmatrix} \\\\ \\end{bmatrix}' },
            { key: 'determinant', label: '| |', snippet: '\\begin{vmatrix} \\\\ \\end{vmatrix}' },
            { key: 'vector', label: '\\vec{}', snippet: '\\vec{}' },
            { key: 'infinity', label: '∞', snippet: '\\infty' },
            { key: 'belongs', label: '∈', snippet: '\\in' },
            { key: 'subset', label: '⊂', snippet: '\\subset' },
            { key: 'pi', label: 'π', snippet: '\\pi' },
            { key: 'triangle', label: '△', snippet: '\\triangle' },
            { key: 'plusMinus', label: '±', snippet: '\\pm' },
            { key: 'times', label: '×', snippet: '\\times' },
            { key: 'divide', label: '÷', snippet: '\\div' },
            { key: 'neq', label: '≠', snippet: '\\neq' },
            { key: 'leq', label: '≤', snippet: '\\leq' },
            { key: 'geq', label: '≥', snippet: '\\geq' },
            { key: 'alpha', label: 'α', snippet: '\\alpha' },
            { key: 'beta', label: 'β', snippet: '\\beta' },
            { key: 'gamma', label: 'γ', snippet: '\\gamma' },
        ],
        [t.mathInline, t.mathBlock, t.mathFraction, t.mathSqrt, t.mathPower, t.mathIntegral, t.mathSigma]
    );

    const physicsSymbolPresets = useMemo(
        () => [
            { key: 'force', label: t.physicsForce, snippet: '\\vec{F}' },
            { key: 'velocity', label: t.physicsVelocity, snippet: '\\vec{v}' },
            { key: 'acceleration', label: t.physicsAcceleration, snippet: '\\vec{a}' },
            { key: 'delta', label: t.physicsDelta, snippet: '\\Delta' },
            { key: 'theta', label: t.physicsTheta, snippet: '\\theta' },
            { key: 'lambda', label: t.physicsLambda, snippet: '\\lambda' },
            { key: 'omega', label: t.physicsOmega, snippet: '\\omega' },
            { key: 'approx', label: t.physicsApprox, snippet: '\\approx' },
            { key: 'rho', label: 'ρ', snippet: '\\rho' },
            { key: 'phi', label: 'φ', snippet: '\\phi' },
            { key: 'mu', label: 'μ', snippet: '\\mu' },
            { key: 'sigma', label: 'σ', snippet: '\\sigma' },
            { key: 'parallel', label: '∥', snippet: '\\parallel' },
            { key: 'perp', label: '⊥', snippet: '\\perp' },
            { key: 'propto', label: '∝', snippet: '\\propto' },
            { key: 'angle', label: '∠', snippet: '\\angle' },
            { key: 'plusMinus', label: '±', snippet: '\\pm' },
            { key: 'degree', label: '°', snippet: '^\\circ' },
            { key: 'dotProduct', label: '·', snippet: '\\cdot' },
            { key: 'crossProduct', label: '×', snippet: '\\times' },
            { key: 'sub', label: 'sub', snippet: '_{ }' },
            { key: 'sup', label: 'sup', snippet: '^{ }' },
        ],
        [
            t.physicsForce,
            t.physicsVelocity,
            t.physicsAcceleration,
            t.physicsDelta,
            t.physicsTheta,
            t.physicsLambda,
            t.physicsOmega,
            t.physicsApprox,
        ]
    );

    const chemistrySymbolPresets = useMemo(
        () => [
            { key: 'reaction', label: t.chemistryReaction, snippet: '\\rightarrow' },
            { key: 'equilibrium', label: t.chemistryEquilibrium, snippet: '\\leftrightarrow' },
            { key: 'water', label: t.chemistryWater, snippet: '_{(l)}' },
            { key: 'carbonDioxide', label: t.chemistryCarbonDioxide, snippet: '_{(g)}' },
            { key: 'sulfuricAcid', label: t.chemistrySulfuricAcid, snippet: '_{(aq)}' },
            { key: 'ion', label: t.chemistryIon, snippet: '^{+}' },
            { key: 'concentration', label: t.chemistryConcentration, snippet: '[ ]' },
            { key: 'minusCharge', label: '−', snippet: '^{-}' },
            { key: 'doublePlus', label: '2+', snippet: '^{2+}' },
            { key: 'doubleMinus', label: '2−', snippet: '^{2-}' },
            { key: 'triplePlus', label: '3+', snippet: '^{3+}' },
            { key: 'tripleMinus', label: '3−', snippet: '^{3-}' },
            { key: 'subscript', label: 'sub', snippet: '_{ }' },
            { key: 'superscript', label: 'sup', snippet: '^{ }' },
            { key: 'precipitate', label: '↓', snippet: '\\downarrow' },
            { key: 'gas', label: '↑', snippet: '\\uparrow' },
            { key: 'deltaHeat', label: 'Δ', snippet: '\\Delta' },
            { key: 'catalyst', label: 'cat', snippet: '\\xrightarrow{cat.}' },
            { key: 'heat', label: 'heat', snippet: '\\xrightarrow{\\Delta}' },
            { key: 'reversible', label: '⇌', snippet: '\\rightleftharpoons' },
            { key: 'electron', label: 'e⁻', snippet: 'e^{-}' },
            { key: 'dot', label: '·', snippet: '\\cdot' },
        ],
        [
            t.chemistryReaction,
            t.chemistryEquilibrium,
            t.chemistryWater,
            t.chemistryCarbonDioxide,
            t.chemistrySulfuricAcid,
            t.chemistryIon,
            t.chemistryConcentration,
        ]
    );

    const postTypeOptions = useMemo(
        () =>
            POST_TYPE_OPTIONS.map((postType) => ({
                value: postType.value,
                label: t[postType.labelKey],
                activeClass:
                    postType.value === 'question'
                        ? 'border-emerald-600 bg-linear-to-r from-emerald-400 to-emerald-600 text-white shadow-[0_8px_20px_rgba(5,150,105,0.25)]'
                        : postType.value === 'quiz'
                            ? 'border-amber-600 bg-linear-to-r from-amber-400 to-amber-600 text-white shadow-[0_8px_20px_rgba(217,119,6,0.25)]'
                            : 'border-violet-600 bg-linear-to-r from-violet-400 to-violet-600 text-white shadow-[0_8px_20px_rgba(124,58,237,0.25)]',
                idleClass:
                    postType.value === 'question'
                        ? 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                        : postType.value === 'quiz'
                            ? 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'
                            : 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700',
            })),
        [t]
    );

    const subjectOptions = useMemo(
        () =>
            subjects.map((subject) => {
                const subjectName = subject?.name ?? '';
                const subjectTranslationKey = `subjects.${subjectName}`;
                const translatedSubjectName = trans(subjectTranslationKey);

                return {
                    id: String(subject?.id),
                    displayName: translatedSubjectName === subjectTranslationKey ? subjectName : translatedSubjectName,
                    Icon: getSubjectIcon(subjectName),
                };
            }),
        [subjects, trans]
    );

    const languageOptions = useMemo(
        () =>
            LANGUAGE_OPTIONS.map((language) => ({
                code: language.code,
                label: language.label,
                activeClass:
                    language.code === 'en'
                        ? 'border-blue-600 bg-linear-to-r from-blue-400 to-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)]'
                        : language.code === 'zh'
                            ? 'border-rose-600 bg-linear-to-r from-rose-400 to-rose-600 text-white shadow-[0_8px_20px_rgba(225,29,72,0.25)]'
                            : 'border-amber-500 bg-linear-to-r from-amber-300 to-amber-500 text-white shadow-[0_8px_20px_rgba(245,158,11,0.3)]',
                idleClass:
                    language.code === 'en'
                        ? 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                        : language.code === 'zh'
                            ? 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700'
                            : 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700',
            })),
        []
    );

    const canSubmit =
        title.trim().length > 0 &&
        content.trim().length > 0 &&
        selectedPostType.trim().length > 0 &&
        selectedSubject.trim().length > 0 &&
        (!isQuestionSelected || selectedLesson.trim().length > 0) &&
        selectedLanguage.trim().length > 0 &&
        (!isQuizSelected || hasValidQuiz) &&
        !isSubmitting;

    const appendFiles = (incomingFiles: FileList | File[]) => {
        setFileError(null);

        const validFiles = Array.from(incomingFiles).filter((file) => {
            if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) {
                return false;
            }
            if (file.size > MAX_FILE_SIZE) {
                setFileError(t.fileTooLarge);
                return false;
            }
            return true;
        });

        const selectedKinds = new Set(validFiles.map((file) => (file.type === 'application/pdf' ? 'pdf' : 'image')));

        if (selectedKinds.size > 1) {
            setFileError(t.fileTypeLimit);
            return;
        }

        if (validFiles.length === 0) {
            setFileError(t.noValidFiles);
            return;
        }

        setAttachments((prev) => {
            const currentKind = prev[0]?.type ?? null;
            const batchKind = validFiles[0].type === 'application/pdf' ? 'pdf' : 'image';

            if (currentKind && currentKind !== batchKind) {
                setFileError(t.fileTypeLimit);
                return prev;
            }

            const existingKeys = new Set(prev.map((item) => `${item.file.name}-${item.file.size}-${item.file.lastModified}`));
            const nextAttachments: LocalAttachment[] = [];
            let totalSize = prev.reduce((sum, item) => sum + item.file.size, 0);

            validFiles.forEach((file) => {
                if (totalSize + file.size > MAX_TOTAL_SIZE) {
                    setFileError(t.totalSizeExceeded);
                    return;
                }

                const key = `${file.name}-${file.size}-${file.lastModified}`;
                if (existingKeys.has(key)) {
                    return;
                }

                const isImage = file.type.startsWith('image/');
                nextAttachments.push({
                    file,
                    preview: isImage ? URL.createObjectURL(file) : null,
                    type: isImage ? 'image' : 'pdf',
                });
                totalSize += file.size;
            });

            return [...prev, ...nextAttachments];
        });
    };

    const onSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            appendFiles(event.target.files);
        }
        event.target.value = '';
    };

    const onDropFiles = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (event.dataTransfer.files.length > 0) {
            appendFiles(event.dataTransfer.files);
        }
    };

    const removeAttachment = (indexToRemove: number) => {
        setAttachments((prev) => {
            const target = prev[indexToRemove];
            if (target?.preview) {
                URL.revokeObjectURL(target.preview);
            }
            return prev.filter((_, index) => index !== indexToRemove);
        });
    };

    const insertMathSnippet = (snippet: string) => {
        const textarea = contentTextareaRef.current;

        if (!textarea) {
            setContent((prev) => `${prev}${snippet}`.slice(0, MAX_CONTENT_LENGTH));
            return;
        }

        const selectionStart = textarea.selectionStart ?? content.length;
        const selectionEnd = textarea.selectionEnd ?? content.length;
        const before = content.slice(0, selectionStart);
        const after = content.slice(selectionEnd);
        const nextContent = `${before}${snippet}${after}`.slice(0, MAX_CONTENT_LENGTH);
        const nextCursor = Math.min(selectionStart + snippet.length, nextContent.length);

        setContent(nextContent);

        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(nextCursor, nextCursor);
        });
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit) {
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('content', content.trim());
        formData.append('post_type', selectedPostType);
        formData.append('subject_id', selectedSubject);
        if (isQuestionSelected && selectedLesson.trim().length > 0) {
            formData.append('lesson_id', selectedLesson);
        }
        formData.append('language_code', selectedLanguage);

        if (isQuizSelected) {
            quizOptions.forEach((option) => {
                formData.append('quiz_options[]', option.trim());
            });

            formData.append('quiz_answer', quizAnswerIndex);
        }

        attachments.forEach((attachment) => {
            formData.append('attachments[]', attachment.file);
        });

        router.post('/posts', formData, {
            forceFormData: true,
            onSuccess: () => {
                attachmentsRef.current.forEach((attachment) => {
                    if (attachment.preview) {
                        URL.revokeObjectURL(attachment.preview);
                    }
                });
                setTitle('');
                setContent('');
                setQuizOptions(['', '', '', '']);
                setQuizAnswerIndex('');
                setSelectedPostType('');
                setSelectedSubject('');
                setSelectedLesson('');
                setSelectedLanguage('');
                setAttachments([]);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return {
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
    };
}

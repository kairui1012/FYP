import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { requestMaterialQuiz } from '@/lib/ai-material-quiz';
import { requestQuizOptions } from '@/lib/ai-quiz-options';
import { formatFormulaText } from '@/lib/formula-display';
import type { PostSubject } from '@/types';
import {
    LANGUAGE_OPTIONS,
    MAX_CONTENT_LENGTH,
    MAX_FILE_SIZE,
    MAX_TITLE_LENGTH,
    MAX_TOTAL_SIZE,
    POST_TYPE_OPTIONS,
    getSubjectIcon,
} from './create-post-config';
import type {
    CreatePostText,
    LearningMaterialOption,
    LinkedQuizOption,
    LocalAttachment,
    MaterialBlockType,
    MaterialContentBlock,
    QuizAiAnswerPlacement,
    QuizItem,
} from './create-post-config';

type UseCreatePostFormParams = {
    subjects: PostSubject[];
    learningMaterials: LearningMaterialOption[];
    availableQuizzes: LinkedQuizOption[];
    canPublishStudyMaterial: boolean;
    t: CreatePostText;
    trans: (key: string) => string;
};

const AI_QUIZ_OPTION_COUNT = 4;

const createEmptyQuizOptions = () =>
    Array.from({ length: AI_QUIZ_OPTION_COUNT }, () => '');

const createEmptyQuiz = (): QuizItem => ({
    question: '',
    options: createEmptyQuizOptions(),
    answerIndex: '',
    aiAnswerPlacement: 'random',
    explanation: '',
});

const isEmptyQuiz = (quiz: QuizItem | undefined): boolean => {
    if (!quiz) {
        return true;
    }

    const hasQuestion = quiz.question.trim() !== '';
    const hasAnyOption = quiz.options.some((option) => option.trim() !== '');
    const hasAnswer = quiz.answerIndex !== '';
    const hasExplanation = (quiz.explanation ?? '').trim() !== '';

    return !(hasQuestion || hasAnyOption || hasAnswer || hasExplanation);
};

const createMaterialBlock = (
    type: MaterialBlockType,
): MaterialContentBlock => ({
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    text: '',
    url: '',
    file: null,
    preview: null,
});

const applyGeneratedOptionsToQuiz = (
    currentOptions: string[],
    generatedOptions: string[],
) => {
    const normalizedGeneratedOptions = Array.from(
        { length: AI_QUIZ_OPTION_COUNT },
        (_, index) => generatedOptions[index] ?? currentOptions[index] ?? '',
    );

    return [
        ...normalizedGeneratedOptions,
        ...currentOptions.slice(AI_QUIZ_OPTION_COUNT),
    ];
};

export function useCreatePostForm({
    subjects,
    learningMaterials,
    availableQuizzes,
    canPublishStudyMaterial,
    t,
    trans,
}: UseCreatePostFormParams) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    const attachmentsRef = useRef<LocalAttachment[]>([]);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [materialBlocks, setMaterialBlocks] = useState<
        MaterialContentBlock[]
    >([createMaterialBlock('text')]);
    const [quizzes, setQuizzes] = useState<QuizItem[]>([createEmptyQuiz()]);
    const [selectedPostType, setSelectedPostType] = useState<string>('');
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [selectedLinkedQuizIds, setSelectedLinkedQuizIds] = useState<
        number[]
    >([]);
    const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
    const [videoUrl, setVideoUrl] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [generatingQuizOptionIds, setGeneratingQuizOptionIds] = useState<
        number[]
    >([]);
    const [quizOptionErrors, setQuizOptionErrors] = useState<
        Record<number, string>
    >({});
    const [generatingMaterialQuiz, setGeneratingMaterialQuiz] = useState(false);
    const [materialQuizError, setMaterialQuizError] = useState<string | null>(
        null,
    );

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

    const remainingTitleChars = useMemo(
        () => MAX_TITLE_LENGTH - title.length,
        [title.length],
    );
    const remainingContentChars = useMemo(
        () => MAX_CONTENT_LENGTH - content.length,
        [content.length],
    );

    const selectedSubjectName = useMemo(() => {
        const matchedSubject = subjects.find(
            (subject) => String(subject?.id) === selectedSubject,
        );
        return matchedSubject?.name ?? '';
    }, [selectedSubject, subjects]);

    const isMathSubjectSelected = useMemo(
        () => selectedSubjectName.toLowerCase().includes('math'),
        [selectedSubjectName],
    );
    const isPhysicsSubjectSelected = useMemo(
        () => selectedSubjectName.toLowerCase().includes('physics'),
        [selectedSubjectName],
    );
    const isChemistrySubjectSelected = useMemo(
        () => selectedSubjectName.toLowerCase().includes('chemistry'),
        [selectedSubjectName],
    );

    const showSymbolPreview =
        isMathSubjectSelected ||
        isPhysicsSubjectSelected ||
        isChemistrySubjectSelected;
    const previewContent = useMemo(() => formatFormulaText(content), [content]);
    const isQuizSelected = selectedPostType === 'quiz';
    const isMaterialSelected = selectedPostType === 'material';
    const hasValidMaterialBlocks =
        materialBlocks.length > 0 &&
        materialBlocks.some((block) => {
            if (block.type === 'text') return block.text.trim().length > 0;
            if (block.type === 'video') return block.url.trim().length > 0;
            return Boolean(block.file);
        });
    const hasValidQuiz =
        quizzes.length >= 1 &&
        quizzes.every(
            (q) =>
                q.question.trim().length > 0 &&
                q.options.length >= 2 &&
                q.options.every((o) => o.trim().length > 0) &&
                q.answerIndex !== '' &&
                parseInt(q.answerIndex) < q.options.length,
        );

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
            {
                key: 'matrix',
                label: '[]',
                snippet: '\\begin{bmatrix} \\\\ \\end{bmatrix}',
            },
            {
                key: 'determinant',
                label: '| |',
                snippet: '\\begin{vmatrix} \\\\ \\end{vmatrix}',
            },
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
        [
            t.mathInline,
            t.mathBlock,
            t.mathFraction,
            t.mathSqrt,
            t.mathPower,
            t.mathIntegral,
            t.mathSigma,
        ],
    );

    const physicsSymbolPresets = useMemo(
        () => [
            { key: 'force', label: t.physicsForce, snippet: '\\vec{F}' },
            { key: 'velocity', label: t.physicsVelocity, snippet: '\\vec{v}' },
            {
                key: 'acceleration',
                label: t.physicsAcceleration,
                snippet: '\\vec{a}',
            },
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
        ],
    );

    const chemistrySymbolPresets = useMemo(
        () => [
            {
                key: 'reaction',
                label: t.chemistryReaction,
                snippet: '\\rightarrow',
            },
            {
                key: 'equilibrium',
                label: t.chemistryEquilibrium,
                snippet: '\\leftrightarrow',
            },
            { key: 'water', label: t.chemistryWater, snippet: '_{(l)}' },
            {
                key: 'carbonDioxide',
                label: t.chemistryCarbonDioxide,
                snippet: '_{(g)}',
            },
            {
                key: 'sulfuricAcid',
                label: t.chemistrySulfuricAcid,
                snippet: '_{(aq)}',
            },
            { key: 'ion', label: t.chemistryIon, snippet: '^{+}' },
            {
                key: 'concentration',
                label: t.chemistryConcentration,
                snippet: '[ ]',
            },
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
        ],
    );

    const postTypeOptions = useMemo(
        () =>
            POST_TYPE_OPTIONS.filter(
                (postType) =>
                    postType.value !== 'material' || canPublishStudyMaterial,
            ).map((postType) => ({
                value: postType.value,
                label: t[postType.labelKey],
                description: t[postType.descriptionKey],
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
        [canPublishStudyMaterial, t],
    );

    const subjectOptions = useMemo(
        () =>
            subjects.map((subject) => {
                const subjectName = subject?.name ?? '';
                const subjectTranslationKey = `subjects.${subjectName}`;
                const translatedSubjectName = trans(subjectTranslationKey);

                return {
                    id: String(subject?.id),
                    displayName:
                        translatedSubjectName === subjectTranslationKey
                            ? subjectName
                            : translatedSubjectName,
                    Icon: getSubjectIcon(subjectName),
                };
            }),
        [subjects, trans],
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
        [],
    );

    const canSubmit =
        title.trim().length > 0 &&
        (isMaterialSelected || content.trim().length > 0) &&
        selectedPostType.trim().length > 0 &&
        selectedSubject.trim().length > 0 &&
        selectedLanguage.trim().length > 0 &&
        (!isQuizSelected || hasValidQuiz) &&
        (!isMaterialSelected || hasValidMaterialBlocks) &&
        !isSubmitting;

    const setPostType = (value: string) => {
        if (value === 'material' && !canPublishStudyMaterial) {
            return;
        }

        setSelectedPostType(value);

        if (value === 'material') {
            setSelectedMaterialId('');
            setIsAnonymous(false);
        } else {
            setSelectedLinkedQuizIds([]);
        }
    };

    const isSupportedDocument = (file: File) => {
        const extension = file.name.toLowerCase().split('.').pop() ?? '';
        const supportedExtensions = [
            'pdf',
            'doc',
            'docx',
            'xls',
            'xlsx',
            'ppt',
            'pptx',
        ];

        return supportedExtensions.includes(extension);
    };

    const isSupportedImage = (file: File) => {
        const extension = file.name.toLowerCase().split('.').pop() ?? '';
        const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

        return (
            file.type.startsWith('image/') ||
            supportedExtensions.includes(extension)
        );
    };

    const getAttachmentKind = (file: File): LocalAttachment['type'] =>
        isSupportedImage(file) ? 'image' : 'document';

    const appendFiles = (incomingFiles: FileList | File[]) => {
        setFileError(null);

        const validFiles = Array.from(incomingFiles).filter((file) => {
            if (!(isSupportedImage(file) || isSupportedDocument(file))) {
                return false;
            }
            if (file.size > MAX_FILE_SIZE) {
                setFileError(t.fileTooLarge);
                return false;
            }
            return true;
        });

        const selectedKinds = new Set(
            validFiles.map((file) => getAttachmentKind(file)),
        );

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
            const batchKind = getAttachmentKind(validFiles[0]);

            if (currentKind && currentKind !== batchKind) {
                setFileError(t.fileTypeLimit);
                return prev;
            }

            const existingKeys = new Set(
                prev.map(
                    (item) =>
                        `${item.file.name}-${item.file.size}-${item.file.lastModified}`,
                ),
            );
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

                const attachmentType = getAttachmentKind(file);
                nextAttachments.push({
                    file,
                    preview:
                        attachmentType === 'image'
                            ? URL.createObjectURL(file)
                            : null,
                    type: attachmentType,
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
            setContent((prev) =>
                `${prev}${snippet}`.slice(0, MAX_CONTENT_LENGTH),
            );
            return;
        }

        const selectionStart = textarea.selectionStart ?? content.length;
        const selectionEnd = textarea.selectionEnd ?? content.length;
        const before = content.slice(0, selectionStart);
        const after = content.slice(selectionEnd);
        const nextContent = `${before}${snippet}${after}`.slice(
            0,
            MAX_CONTENT_LENGTH,
        );
        const nextCursor = Math.min(
            selectionStart + snippet.length,
            nextContent.length,
        );

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
        setFileError(null);

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('content', isMaterialSelected ? '' : content.trim());
        formData.append('post_type', selectedPostType);
        formData.append('subject_id', selectedSubject);
        formData.append(
            'is_anonymous',
            selectedPostType === 'question' && isAnonymous ? '1' : '0',
        );
        formData.append('language_code', selectedLanguage);

        if (selectedMaterialId && selectedPostType !== 'material') {
            formData.append('parent_material_id', selectedMaterialId);
        }

        if (isQuizSelected) {
            quizzes.forEach((quiz, qi) => {
                formData.append(
                    `quiz_questions[${qi}][question]`,
                    quiz.question.trim(),
                );
                quiz.options.forEach((opt) => {
                    formData.append(
                        `quiz_questions[${qi}][options][]`,
                        opt.trim(),
                    );
                });
                formData.append(
                    `quiz_questions[${qi}][answer_index]`,
                    quiz.answerIndex,
                );
                if (quiz.explanation?.trim()) {
                    formData.append(
                        `quiz_questions[${qi}][explanation]`,
                        quiz.explanation.trim(),
                    );
                }
            });
        }

        if (isMaterialSelected) {
            selectedLinkedQuizIds.forEach((quizId) => {
                formData.append('linked_quiz_ids[]', String(quizId));
            });

            materialBlocks.forEach((block, index) => {
                formData.append(`material_blocks[${index}][type]`, block.type);

                if (block.type === 'text') {
                    formData.append(
                        `material_blocks[${index}][text]`,
                        block.text.trim(),
                    );
                } else if (block.type === 'video') {
                    formData.append(
                        `material_blocks[${index}][url]`,
                        block.url.trim(),
                    );
                } else if (block.file) {
                    formData.append(
                        `material_blocks[${index}][file]`,
                        block.file,
                    );
                }
            });
        }

        if (videoUrl.trim()) {
            formData.append('video_url', videoUrl.trim());
        }

        attachments.forEach((attachment) => {
            formData.append('attachments[]', attachment.file);
        });

        router.post('/posts', formData, {
            forceFormData: true,
            onError: (errors) => {
                const uploadError = Object.entries(errors).find(([key]) =>
                    key.startsWith('attachments'),
                )?.[1];

                if (uploadError) {
                    setFileError(uploadError);
                }
            },
            onSuccess: () => {
                attachmentsRef.current.forEach((attachment) => {
                    if (attachment.preview) {
                        URL.revokeObjectURL(attachment.preview);
                    }
                });
                setTitle('');
                setContent('');
                setQuizzes([createEmptyQuiz()]);
                setMaterialBlocks([createMaterialBlock('text')]);
                setSelectedPostType('');
                setSelectedMaterialId('');
                setSelectedLinkedQuizIds([]);
                setSelectedSubject('');
                setSelectedLanguage('');
                setAttachments([]);
                setVideoUrl('');
                setIsAnonymous(false);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const addQuiz = () => {
        setQuizzes((prev) => [...prev, createEmptyQuiz()]);
    };

    const removeQuiz = (qIndex: number) => {
        if (quizzes.length <= 1) return;
        setQuizzes((prev) => prev.filter((_, i) => i !== qIndex));
    };

    const updateQuizQuestion = (qIndex: number, value: string) => {
        setQuizzes((prev) =>
            prev.map((q, i) => (i === qIndex ? { ...q, question: value } : q)),
        );
    };

    const updateQuizOption = (
        qIndex: number,
        optIndex: number,
        value: string,
    ) => {
        setQuizzes((prev) =>
            prev.map((q, i) =>
                i === qIndex
                    ? {
                          ...q,
                          options: q.options.map((o, oi) =>
                              oi === optIndex ? value : o,
                          ),
                      }
                    : q,
            ),
        );
    };

    const updateQuizAnswerIndex = (qIndex: number, value: string) => {
        setQuizzes((prev) =>
            prev.map((q, i) =>
                i === qIndex ? { ...q, answerIndex: value } : q,
            ),
        );
    };

    const updateQuizAiAnswerPlacement = (
        qIndex: number,
        value: QuizAiAnswerPlacement,
    ) => {
        setQuizzes((prev) =>
            prev.map((q, i) =>
                i === qIndex ? { ...q, aiAnswerPlacement: value } : q,
            ),
        );
    };

    const addQuizOption = (qIndex: number) => {
        setQuizzes((prev) =>
            prev.map((q, i) => {
                if (i !== qIndex || q.options.length >= 8) return q;
                return { ...q, options: [...q.options, ''] };
            }),
        );
    };

    const removeQuizOption = (qIndex: number, optIndex: number) => {
        setQuizzes((prev) =>
            prev.map((q, i) => {
                if (i !== qIndex || q.options.length <= 2) return q;
                const newOptions = q.options.filter((_, oi) => oi !== optIndex);
                let newAnswer = q.answerIndex;
                if (q.answerIndex !== '') {
                    const ai = parseInt(q.answerIndex);
                    if (ai === optIndex) newAnswer = '';
                    else if (ai > optIndex) newAnswer = String(ai - 1);
                }
                return { ...q, options: newOptions, answerIndex: newAnswer };
            }),
        );
    };

    const generateQuizOptions = async (qIndex: number) => {
        const quiz = quizzes[qIndex];

        if (!quiz) return;

        if (quiz.question.trim() === '') {
            setQuizOptionErrors((prev) => ({
                ...prev,
                [qIndex]: t.quizAiQuestionRequired,
            }));
            return;
        }

        setGeneratingQuizOptionIds((prev) =>
            prev.includes(qIndex) ? prev : [...prev, qIndex],
        );
        setQuizOptionErrors((prev) => {
            const next = { ...prev };
            delete next[qIndex];
            return next;
        });

        try {
            const result = await requestQuizOptions({
                question: quiz.question.trim(),
                subject: selectedSubjectName,
                languageCode: selectedLanguage,
                existingOptions: quiz.options.slice(0, AI_QUIZ_OPTION_COUNT),
                answerPlacementPreference: quiz.aiAnswerPlacement,
            });

            setQuizzes((prev) =>
                prev.map((item, index) =>
                    index === qIndex
                        ? {
                              ...item,
                              options: applyGeneratedOptionsToQuiz(
                                  item.options,
                                  result.options,
                              ),
                              answerIndex: String(result.answerIndex),
                          }
                        : item,
                ),
            );
        } catch (error) {
            console.warn(
                '[createPost] AI quiz option generation failed:',
                error,
            );
            const errorMessage =
                error instanceof Error && error.message.trim() !== ''
                    ? error.message
                    : t.quizAiOptionsError;
            setQuizOptionErrors((prev) => ({
                ...prev,
                [qIndex]: errorMessage,
            }));
        } finally {
            setGeneratingQuizOptionIds((prev) =>
                prev.filter((index) => index !== qIndex),
            );
        }
    };

    const generateQuizFromMaterial = async () => {
        const material = learningMaterials.find(
            (item) => String(item.id) === selectedMaterialId,
        );

        if (!material) {
            setMaterialQuizError(t.materialSelectRequired);
            return;
        }

        setGeneratingMaterialQuiz(true);
        setMaterialQuizError(null);

        try {
            const result = await requestMaterialQuiz({
                materialTitle: material.title,
                materialContent: material.content,
                subject: material.subject?.name ?? selectedSubjectName,
                languageCode: selectedLanguage,
                questionCount: 1,
            });

            const firstQuestion = result.questions[0];

            if (!firstQuestion) {
                throw new Error(t.materialQuizError);
            }

            const normalizedOptions = Array.from(
                { length: AI_QUIZ_OPTION_COUNT },
                (_, index) => firstQuestion.options[index]?.trim() ?? '',
            );

            if (
                firstQuestion.question.trim() === '' ||
                normalizedOptions.some((option) => option === '') ||
                firstQuestion.answerIndex < 0 ||
                firstQuestion.answerIndex >= AI_QUIZ_OPTION_COUNT
            ) {
                throw new Error(t.materialQuizError);
            }

            const generatedQuiz: QuizItem = {
                question: firstQuestion.question.trim(),
                options: normalizedOptions,
                answerIndex: String(firstQuestion.answerIndex),
                aiAnswerPlacement: 'random',
                explanation: firstQuestion.explanation?.trim() ?? '',
            };

            setQuizzes((prev) => {
                if (
                    prev.length === 0 ||
                    (prev.length === 1 && isEmptyQuiz(prev[0]))
                ) {
                    return [generatedQuiz];
                }

                return [...prev, generatedQuiz];
            });

            if (!title.trim()) {
                setTitle(`${material.title} Quiz`.slice(0, MAX_TITLE_LENGTH));
            }

            if (!content.trim()) {
                setContent(
                    `${t.materialQuizContentPrefix}: ${material.title}`.slice(
                        0,
                        MAX_CONTENT_LENGTH,
                    ),
                );
            }
        } catch (error) {
            console.warn('[createPost] AI material quiz failed:', error);
            setMaterialQuizError(
                error instanceof Error && error.message.trim() !== ''
                    ? error.message
                    : t.materialQuizError,
            );
        } finally {
            setGeneratingMaterialQuiz(false);
        }
    };

    const toggleLinkedQuizId = (quizId: number) => {
        const hasQuiz = availableQuizzes.some((quiz) => quiz.id === quizId);
        if (!hasQuiz) {
            return;
        }

        setSelectedLinkedQuizIds((prev) =>
            prev.includes(quizId)
                ? prev.filter((id) => id !== quizId)
                : [...prev, quizId],
        );
    };
    const addMaterialBlock = (type: MaterialBlockType) => {
        setMaterialBlocks((prev) => [...prev, createMaterialBlock(type)]);
    };

    const updateMaterialBlock = (
        blockId: string,
        updates: Partial<MaterialContentBlock>,
    ) => {
        setMaterialBlocks((prev) =>
            prev.map((block) =>
                block.id === blockId ? { ...block, ...updates } : block,
            ),
        );
    };

    const updateMaterialBlockFile = (blockId: string, file: File | null) => {
        setMaterialBlocks((prev) =>
            prev.map((block) => {
                if (block.id !== blockId) return block;

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

    const removeMaterialBlock = (blockId: string) => {
        setMaterialBlocks((prev) => {
            const target = prev.find((block) => block.id === blockId);
            if (target?.preview) {
                URL.revokeObjectURL(target.preview);
            }
            const next = prev.filter((block) => block.id !== blockId);
            return next.length > 0 ? next : [createMaterialBlock('text')];
        });
    };

    const moveMaterialBlock = (blockId: string, direction: -1 | 1) => {
        setMaterialBlocks((prev) => {
            const index = prev.findIndex((block) => block.id === blockId);
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

    return {
        fileInputRef,
        contentTextareaRef,
        title,
        setTitle,
        content,
        setContent,
        materialBlocks,
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
        addQuizOption,
        removeQuizOption,
        generateQuizOptions,
        generatingQuizOptionIds,
        quizOptionErrors,
        selectedMaterialId,
        setSelectedMaterialId,
        selectedLinkedQuizIds,
        toggleLinkedQuizId,
        generatingMaterialQuiz,
        materialQuizError,
        generateQuizFromMaterial,
        selectedPostType,
        setSelectedPostType: setPostType,
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
    };
}

import { Head, router, usePage } from '@inertiajs/react';
import { FileText, ImagePlus, Send, Trash2, UploadCloud, BookOpen, Calculator, Atom, TestTube, Dna, Music, Palette, Globe, Languages, GraduationCap, Briefcase, Landmark, Activity, Scissors, Laptop } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { reactLang } from '@erag/lang-sync-inertia';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatFormulaText } from '@/lib/formula-display';
import { homePage } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { PostSubject } from '@/types';

const MAX_TITLE_LENGTH = 150;
const MAX_CONTENT_LENGTH = 2000;
const ACCEPTED_FILE_TYPES = 'image/*,.pdf,application/pdf';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total upload
type LocalAttachment = {
    file: File;
    preview: string | null;
    type: 'image' | 'pdf';
};

type CreatePostPageProps = {
    subjects?: PostSubject[];
};

const LANGUAGE_OPTIONS = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'bm', label: 'Bahasa Malaysia' },
] as const;

const POST_TYPE_OPTIONS = [
    { value: 'material', labelKey: 'shareMaterial' },
    { value: 'question', labelKey: 'askQuestion' },
    { value: 'quiz', labelKey: 'createQuiz' },
] as const;

const pillChoiceBase =
    'inline-flex items-center justify-center gap-2 rounded-full border-2 px-4 py-3 text-sm font-semibold tracking-[0.01em] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50';
const pillChoiceIdle =
    'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-[#ef99b0] hover:bg-rose-50 hover:text-[#c94461]';
const pillChoiceActive =
    'border-[#e0526f] bg-linear-to-r from-[#ef99b0] to-[#e27193] text-white shadow-[0_8px_20px_rgba(227,106,139,0.22)]';
const pillActionButton =
    'inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(227,106,139,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black hover:shadow-[0_12px_28px_rgba(227,106,139,0.28)] focus-visible:border-[#d85380] focus-visible:ring-[#e36a8b]/35';
const pillSubmitButton =
    'w-full rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] px-5 py-3.5 text-white shadow-[0_10px_24px_rgba(227,106,139,0.24)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black hover:shadow-[0_14px_32px_rgba(227,106,139,0.3)] focus-visible:border-[#d85380] focus-visible:ring-[#e36a8b]/35 disabled:pointer-events-none disabled:opacity-50';
const pillIconButton =
    'rounded-full border-2 border-zinc-200 bg-white p-2 text-zinc-500 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-[#ef99b0] hover:bg-rose-50 hover:text-[#c94461] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50';

// Mapping subjects to icons
const getSubjectIcon = (subjectName: string) => {
    const lowerCaseName = subjectName.toLowerCase();
    
    if (lowerCaseName.includes('math')) return Calculator;
    if (lowerCaseName.includes('physics')) return Atom;
    if (lowerCaseName.includes('chemistry')) return TestTube;
    if (lowerCaseName.includes('biology') || lowerCaseName.includes('science')) return Dna;
    if (lowerCaseName.includes('computer')) return Laptop;
    if (lowerCaseName.includes('islamic')) return BookOpen; // Islamic studies represented with book
    if (lowerCaseName.includes('moral') || lowerCaseName.includes('studies')) return BookOpen;
    if (lowerCaseName.includes('language') || lowerCaseName.includes('english') || lowerCaseName.includes('chinese') || lowerCaseName.includes('tamil') || lowerCaseName.includes('malay')) return Languages;
    if (lowerCaseName.includes('history')) return GraduationCap;
    if (lowerCaseName.includes('geography') || lowerCaseName.includes('citizenship')) return Globe;
    if (lowerCaseName.includes('economics') || lowerCaseName.includes('accounting') || lowerCaseName.includes('business')) return Landmark;
    if (lowerCaseName.includes('art')) return Palette;
    if (lowerCaseName.includes('music')) return Music;
    if (lowerCaseName.includes('physical') || lowerCaseName.includes('education')) return Activity;
    if (lowerCaseName.includes('design') || lowerCaseName.includes('technology')) return Scissors;
    
    // Default icon
    return BookOpen;
};

export default function CreatePostPage() {
    const { trans } = reactLang();
    const t = {
        pageTitle: trans('createPost.page_title'),
        heading: trans('createPost.heading'),
        subtitle: trans('createPost.subtitle'),
        titleLabel: trans('createPost.title_label'),
        titlePlaceholder: trans('createPost.title_placeholder'),
        contentLabel: trans('createPost.content_label'),
        contentPlaceholder: trans('createPost.content_placeholder'),
        helperText: trans('createPost.helper_text'),
        postTypeLabel: trans('createPost.post_type_label'),
        postTypeRequired: trans('createPost.post_type_required'),
        subjectLabel: trans('createPost.subject_label'),
        subjectHint: trans('createPost.subject_hint'),
        subjectRequired: trans('createPost.subject_required'),
        shareMaterial: trans('createPost.share_material'),
        askQuestion: trans('createPost.ask_question'),
        createQuiz: trans('createPost.create_quiz'),
        languageLabel: trans('createPost.language_label'),
        languageRequired: trans('createPost.language_required'),
        charsLeft: trans('createPost.chars_left'),
        mediaLabel: trans('createPost.media_label'),
        addFiles: trans('createPost.add_files'),
        dragDropTitle: trans('createPost.drag_drop_title'),
        dragDropSubtitle: trans('createPost.drag_drop_subtitle'),
        pdfLabel: trans('createPost.pdf_label'),
        fileTypeLimit: trans('createPost.file_type_limit'),
        fileTooLarge: trans('createPost.file_too_large'),
        noValidFiles: trans('createPost.no_valid_files'),
        totalSizeExceeded: trans('createPost.total_size_exceeded'),
        selected: trans('createPost.selected'),
        tapToChoose: trans('createPost.tap_to_choose'),
        previewAlt: trans('createPost.preview_alt'),
        mathToolTitle: trans('createPost.math_tool_title'),
        mathToolHint: trans('createPost.math_tool_hint'),
        mathInline: trans('createPost.math_inline'),
        mathBlock: trans('createPost.math_block'),
        mathFraction: trans('createPost.math_fraction'),
        mathSqrt: trans('createPost.math_sqrt'),
        mathPower: trans('createPost.math_power'),
        mathIntegral: trans('createPost.math_integral'),
        mathSigma: trans('createPost.math_sigma'),
        physicsToolTitle: trans('createPost.physics_tool_title'),
        physicsToolHint: trans('createPost.physics_tool_hint'),
        physicsForce: trans('createPost.physics_force'),
        physicsVelocity: trans('createPost.physics_velocity'),
        physicsAcceleration: trans('createPost.physics_acceleration'),
        physicsDelta: trans('createPost.physics_delta'),
        physicsTheta: trans('createPost.physics_theta'),
        physicsLambda: trans('createPost.physics_lambda'),
        physicsOmega: trans('createPost.physics_omega'),
        physicsApprox: trans('createPost.physics_approx'),
        chemistryToolTitle: trans('createPost.chemistry_tool_title'),
        chemistryToolHint: trans('createPost.chemistry_tool_hint'),
        chemistryReaction: trans('createPost.chemistry_reaction'),
        chemistryEquilibrium: trans('createPost.chemistry_equilibrium'),
        chemistryWater: trans('createPost.chemistry_water'),
        chemistryCarbonDioxide: trans('createPost.chemistry_carbon_dioxide'),
        chemistrySulfuricAcid: trans('createPost.chemistry_sulfuric_acid'),
        chemistryIon: trans('createPost.chemistry_ion'),
        chemistryConcentration: trans('createPost.chemistry_concentration'),
        symbolPreviewTitle: trans('createPost.symbol_preview_title'),
        symbolPreviewHint: trans('createPost.symbol_preview_hint'),
        supportedFormat: trans('createPost.supported_format'),
        quizQuestionLabel: trans('createPost.quiz_question_label'),
        quizQuestionPlaceholder: trans('createPost.quiz_question_placeholder'),
        quizSectionTitle: trans('createPost.quiz_section_title'),
        quizSectionHint: trans('createPost.quiz_section_hint'),
        quizOptionLabel: trans('createPost.quiz_option_label'),
        quizOptionPlaceholder: trans('createPost.quiz_option_placeholder'),
        quizAnswerLabel: trans('createPost.quiz_answer_label'),
        quizAnswerPlaceholder: trans('createPost.quiz_answer_placeholder'),
        quizRequiredHint: trans('createPost.quiz_required_hint'),
        publishing: trans('createPost.publishing'),
        publishPost: trans('createPost.publish_post'),
    };
    const { subjects = [] } = usePage<CreatePostPageProps>().props;
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    const attachmentsRef = useRef<LocalAttachment[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [quizOptions, setQuizOptions] = useState<string[]>(['', '', '', '']);
    const [quizAnswerIndex, setQuizAnswerIndex] = useState<string>('');
    const [selectedPostType, setSelectedPostType] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
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

    const remainingTitleChars = useMemo(() => {
        return MAX_TITLE_LENGTH - title.length;
    }, [title.length]);

    const remainingContentChars = useMemo(() => {
        return MAX_CONTENT_LENGTH - content.length;
    }, [content.length]);

    const selectedSubjectName = useMemo(() => {
        const matchedSubject = subjects.find((subject) => String(subject?.id) === selectedSubject);
        return matchedSubject?.name ?? '';
    }, [selectedSubject, subjects]);

    const isMathSubjectSelected = useMemo(() => {
        return selectedSubjectName.toLowerCase().includes('math');
    }, [selectedSubjectName]);

    const isPhysicsSubjectSelected = useMemo(() => {
        return selectedSubjectName.toLowerCase().includes('physics');
    }, [selectedSubjectName]);

    const isChemistrySubjectSelected = useMemo(() => {
        return selectedSubjectName.toLowerCase().includes('chemistry');
    }, [selectedSubjectName]);

    const showSymbolPreview = isMathSubjectSelected || isPhysicsSubjectSelected || isChemistrySubjectSelected;
    const previewContent = useMemo(() => formatFormulaText(content), [content]);
    const isQuizSelected = selectedPostType === 'quiz';
    const hasValidQuiz =
        quizOptions.every((option) => option.trim().length > 0) &&
        quizAnswerIndex !== '';

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
        [
            t.mathInline,
            t.mathBlock,
            t.mathFraction,
            t.mathSqrt,
            t.mathPower,
            t.mathIntegral,
            t.mathSigma,
        ]
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

    const canSubmit =
        title.trim().length > 0 &&
        content.trim().length > 0 &&
        selectedPostType.trim().length > 0 &&
        selectedSubject.trim().length > 0 &&
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
            if (!fileError) {
                setFileError(t.noValidFiles);
            }
            return;
        }

        setAttachments((prev) => {
            const currentKind = prev[0]?.type ?? null;
            const batchKind = validFiles[0].type === 'application/pdf' ? 'pdf' : 'image';

            if (currentKind && currentKind !== batchKind) {
                setFileError(t.fileTypeLimit);
                return prev;
            }

            const existingKeys = new Set(
                prev.map((item) => `${item.file.name}-${item.file.size}-${item.file.lastModified}`)
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

    const onDropFiles = (event: React.DragEvent<HTMLDivElement>) => {
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
                setSelectedLanguage('');
                setAttachments([]);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <>
            <Head title={t.pageTitle} />

            <div className="pb-8">
                <div className="mx-auto w-full max-w-3xl space-y-2 p-4 md:p-6 md:pb-10">
                    <form
                        onSubmit={onSubmit}
                        className="space-y-7"
                    >
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{t.heading}</h1>
                            <p className="text-base text-zinc-600">
                                {t.subtitle}
                            </p>
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

                        <div className="space-y-3">
                            <label htmlFor="content" className="text-base font-medium text-zinc-700">
                                {isQuizSelected ? t.quizQuestionLabel : t.contentLabel}
                            </label>
                            <textarea
                                ref={contentTextareaRef}
                                id="content"
                                value={content}
                                onChange={(event) => setContent(event.target.value)}
                                maxLength={MAX_CONTENT_LENGTH}
                                placeholder={isQuizSelected ? t.quizQuestionPlaceholder : t.contentPlaceholder}
                                className="min-h-44 w-full resize-y rounded-xl border-0 bg-zinc-100 px-5 py-4 text-base leading-7 text-zinc-800 outline-none transition placeholder:text-zinc-500 focus:bg-zinc-200/80 focus:ring-0"
                            />
                            {isMathSubjectSelected ? (
                                <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-3">
                                    <p className="text-sm font-semibold text-emerald-800">{t.mathToolTitle}</p>
                                    <p className="mt-1 text-xs text-emerald-700">{t.mathToolHint}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {mathFormulaPresets.map((preset) => (
                                            <button
                                                key={preset.key}
                                                type="button"
                                                onClick={() => insertMathSnippet(preset.snippet)}
                                                className="rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-500 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {isPhysicsSubjectSelected ? (
                                <div className="rounded-xl border-2 border-sky-200 bg-sky-50/60 p-3">
                                    <p className="text-sm font-semibold text-sky-800">{t.physicsToolTitle}</p>
                                    <p className="mt-1 text-xs text-sky-700">{t.physicsToolHint}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {physicsSymbolPresets.map((preset) => (
                                            <button
                                                key={preset.key}
                                                type="button"
                                                onClick={() => insertMathSnippet(preset.snippet)}
                                                className="rounded-full border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-500 hover:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {isChemistrySubjectSelected ? (
                                <div className="rounded-xl border-2 border-amber-200 bg-amber-50/60 p-3">
                                    <p className="text-sm font-semibold text-amber-800">{t.chemistryToolTitle}</p>
                                    <p className="mt-1 text-xs text-amber-700">{t.chemistryToolHint}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {chemistrySymbolPresets.map((preset) => (
                                            <button
                                                key={preset.key}
                                                type="button"
                                                onClick={() => insertMathSnippet(preset.snippet)}
                                                className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:border-amber-500 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {showSymbolPreview ? (
                                <div className="rounded-xl border-2 border-zinc-200 bg-white p-3">
                                    <p className="text-sm font-semibold text-zinc-800">{t.symbolPreviewTitle}</p>
                                    <p className="mt-1 text-xs text-zinc-500">{t.symbolPreviewHint}</p>
                                    <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm leading-7 whitespace-pre-wrap text-zinc-700">
                                        {previewContent || content || '...'}
                                    </div>
                                </div>
                            ) : null}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">{t.helperText}</span>
                                <span className={remainingContentChars < 80 ? 'font-medium text-rose-600' : 'text-zinc-500'}>
                                    {remainingContentChars} {t.charsLeft}
                                </span>
                            </div>
                        </div>

                        {isQuizSelected ? (
                            <div className="space-y-3 rounded-xl border-2 border-amber-200 bg-amber-50/40 p-4">
                                <div>
                                    <p className="text-base font-semibold text-amber-800">{t.quizSectionTitle}</p>
                                    <p className="text-sm text-amber-700">{t.quizSectionHint}</p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {quizOptions.map((option, index) => {
                                        const optionLabel = String.fromCharCode(65 + index);

                                        return (
                                            <div key={optionLabel} className="space-y-1">
                                                <label className="text-sm font-medium text-zinc-700">
                                                    {t.quizOptionLabel} {optionLabel}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(event) => {
                                                        setQuizOptions((prev) =>
                                                            prev.map((value, optionIndex) =>
                                                                optionIndex === index ? event.target.value : value
                                                            )
                                                        );
                                                    }}
                                                    placeholder={`${t.quizOptionPlaceholder} ${optionLabel}`}
                                                    className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-500 focus:bg-zinc-100 focus:ring-0"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="quiz-answer" className="text-sm font-medium text-zinc-700">
                                        {t.quizAnswerLabel}
                                    </label>
                                    <select
                                        id="quiz-answer"
                                        value={quizAnswerIndex}
                                        onChange={(event) => setQuizAnswerIndex(event.target.value)}
                                        className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:bg-zinc-100 focus:ring-0"
                                    >
                                        <option value="">{t.quizAnswerPlaceholder}</option>
                                        {quizOptions.map((_, index) => {
                                            const optionLabel = String.fromCharCode(65 + index);
                                            return (
                                                <option key={optionLabel} value={index}>
                                                    {optionLabel}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <p className="text-xs text-amber-700">{t.quizRequiredHint}</p>
                            </div>
                        ) : null}

                        <div className="space-y-3">
                            <p className="text-base font-medium text-zinc-700">{t.postTypeLabel}</p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {POST_TYPE_OPTIONS.map((postType) => {
                                    const isSelected = selectedPostType === postType.value;
                                    const activeClass =
                                        postType.value === 'question'
                                            ? 'border-emerald-600 bg-linear-to-r from-emerald-400 to-emerald-600 text-white shadow-[0_8px_20px_rgba(5,150,105,0.25)]'
                                            : postType.value === 'quiz'
                                                ? 'border-amber-600 bg-linear-to-r from-amber-400 to-amber-600 text-white shadow-[0_8px_20px_rgba(217,119,6,0.25)]'
                                            : 'border-violet-600 bg-linear-to-r from-violet-400 to-violet-600 text-white shadow-[0_8px_20px_rgba(124,58,237,0.25)]';
                                    const idleClass =
                                        postType.value === 'question'
                                            ? 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                                            : postType.value === 'quiz'
                                                ? 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'
                                            : 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700';

                                    return (
                                        <button
                                            key={postType.value}
                                            type="button"
                                            onClick={() => setSelectedPostType(postType.value)}
                                            className={`${pillChoiceBase} ${
                                                isSelected
                                                    ? activeClass
                                                    : idleClass
                                            }`}
                                            aria-pressed={isSelected}
                                        >
                                            {t[postType.labelKey]}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-sm text-zinc-500">{t.postTypeRequired}</p>
                            <input type="hidden" name="post_type" value={selectedPostType} required />
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <p className="text-base font-medium text-zinc-700">{t.subjectLabel}</p>
                                <p className="text-sm text-zinc-500">{t.subjectHint}</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {subjects.map((subject) => {
                                    const isSelected = selectedSubject === String(subject?.id);
                                    const subjectName = subject?.name ?? '';
                                    const subjectTranslationKey = `subjects.${subjectName}`;
                                    const translatedSubjectName = trans(subjectTranslationKey);
                                    const displaySubjectName =
                                        translatedSubjectName === subjectTranslationKey
                                            ? subjectName
                                            : translatedSubjectName;
                                    const SubjectIcon = getSubjectIcon(subject?.name ?? '');

                                    return (
                                        <button
                                            key={subject?.id}
                                            type="button"
                                            onClick={() => setSelectedSubject(String(subject?.id))}
                                            className={`${pillChoiceBase} justify-start text-left ${
                                                isSelected
                                                    ? pillChoiceActive
                                                    : pillChoiceIdle
                                            }`}
                                            aria-pressed={isSelected}
                                        >
                                            <SubjectIcon className="h-5 w-5 mr-2 text-rose-500" />
                                            <div className="flex-1 min-w-0">
                                                <span className="block text-sm font-medium truncate">{displaySubjectName}</span>
                                                <span className="mt-1 block text-xs text-zinc-500">
                                                    {isSelected ? t.selected : t.tapToChoose}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-sm text-zinc-500">{t.subjectRequired}</p>
                            <input type="hidden" name="subject_id" value={selectedSubject} required />
                        </div>

                        <div className="space-y-3">
                            <p className="text-base font-medium text-zinc-700">{t.languageLabel}</p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {LANGUAGE_OPTIONS.map((language) => {
                                    const isSelected = selectedLanguage === language.code;
                                    const activeClass =
                                        language.code === 'en'
                                            ? 'border-blue-600 bg-linear-to-r from-blue-400 to-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)]'
                                            : language.code === 'zh'
                                                ? 'border-rose-600 bg-linear-to-r from-rose-400 to-rose-600 text-white shadow-[0_8px_20px_rgba(225,29,72,0.25)]'
                                                : 'border-amber-500 bg-linear-to-r from-amber-300 to-amber-500 text-white shadow-[0_8px_20px_rgba(245,158,11,0.3)]';
                                    const idleClass =
                                        language.code === 'en'
                                            ? 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                                            : language.code === 'zh'
                                                ? 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700'
                                                : 'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700';

                                    return (
                                        <button
                                            key={language.code}
                                            type="button"
                                            onClick={() => setSelectedLanguage(language.code)}
                                            className={`${pillChoiceBase} ${
                                                isSelected
                                                    ? activeClass
                                                    : idleClass
                                            }`}
                                            aria-pressed={isSelected}
                                        >
                                            {language.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-sm text-zinc-500">{t.languageRequired}</p>
                            <input type="hidden" name="language_code" value={selectedLanguage} required />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-zinc-700">{t.mediaLabel}</p>
                                <Button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={pillActionButton}
                                >
                                    <ImagePlus className="mr-2 h-4 w-4" />
                                    {t.addFiles}
                                </Button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ACCEPTED_FILE_TYPES}
                                multiple
                                className="hidden"
                                onChange={onSelectFiles}
                            />

                            <div
                                className={`mt-4 rounded-xl border-2 border-dashed p-6 text-center ${
                                    isDragging ? 'border-rose-500 bg-rose-50/50' : 'border-zinc-300'
                                }`}
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={onDropFiles}
                            >
                                <UploadCloud className="mx-auto h-10 w-10 text-zinc-400" />
                                <p className="mt-4 font-medium text-zinc-700">{t.dragDropTitle}</p>
                                <p className="mt-2 text-sm text-zinc-500">{t.dragDropSubtitle}</p>
                                <p className="mt-1 text-xs text-zinc-500">{t.supportedFormat}</p>
                            </div>

                            {fileError && (
                                <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                                    {fileError}
                                </div>
                            )}

                            <div className="mt-4 space-y-3">
                                {attachments.map((attachment, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between rounded-xl border border-zinc-300 bg-white p-3"
                                    >
                                        <div className="flex items-center">
                                            {attachment.type === 'pdf' ? (
                                                <FileText className="h-10 w-10 text-rose-500" />
                                            ) : (
                                                <img
                                                    src={attachment.preview || ''}
                                                    alt={t.previewAlt}
                                                    className="h-10 w-10 rounded-md object-cover"
                                                />
                                            )}
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-zinc-700">{attachment.file.name}</p>
                                                <p className="text-xs text-zinc-500">
                                                    {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(index)}
                                            className={pillIconButton}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={!canSubmit}
                                className={pillSubmitButton}
                            >
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
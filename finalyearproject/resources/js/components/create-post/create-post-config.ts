import {
    Activity,
    Atom,
    BookOpen,
    Calculator,
    Dna,
    Globe,
    GraduationCap,
    Landmark,
    Languages,
    Laptop,
    Music,
    Palette,
    Scissors,
    TestTube,
    type LucideIcon,
} from 'lucide-react';

export const MAX_TITLE_LENGTH = 150;
export const MAX_CONTENT_LENGTH = 2000;
export const ACCEPTED_FILE_TYPES =
    'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per file
export const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total upload

export const LANGUAGE_OPTIONS = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'bm', label: 'Bahasa Malaysia' },
] as const;

export const POST_TYPE_OPTIONS = [
    { value: 'material', labelKey: 'shareMaterial' },
    { value: 'question', labelKey: 'askQuestion' },
    { value: 'quiz', labelKey: 'createQuiz' },
] as const;

export const pillChoiceBase =
    'inline-flex items-center justify-center gap-2 rounded-full border-2 px-4 py-3 text-sm font-semibold tracking-[0.01em] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50';
export const pillChoiceIdle =
    'border-zinc-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-[1px] hover:border-[#ef99b0] hover:bg-rose-50 hover:text-[#c94461]';
export const pillChoiceActive =
    'border-[#e0526f] bg-linear-to-r from-[#ef99b0] to-[#e27193] text-white shadow-[0_8px_20px_rgba(227,106,139,0.22)]';
export const pillActionButton =
    'inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(227,106,139,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black hover:shadow-[0_12px_28px_rgba(227,106,139,0.28)] focus-visible:border-[#d85380] focus-visible:ring-[#e36a8b]/35';
export const pillSubmitButton =
    'w-full rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] px-5 py-3.5 text-white shadow-[0_10px_24px_rgba(227,106,139,0.24)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black hover:shadow-[0_14px_32px_rgba(227,106,139,0.3)] focus-visible:border-[#d85380] focus-visible:ring-[#e36a8b]/35 disabled:pointer-events-none disabled:opacity-50';
export const pillIconButton =
    'rounded-full border-2 border-zinc-200 bg-white p-2 text-zinc-500 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-[#ef99b0] hover:bg-rose-50 hover:text-[#c94461] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50';

export const QUIZ_AI_ANSWER_PLACEMENTS = [
    'A',
    'B',
    'C',
    'D',
    'random',
] as const;

export type QuizAiAnswerPlacement = (typeof QUIZ_AI_ANSWER_PLACEMENTS)[number];

export type QuizItem = {
    question: string;
    options: string[];
    answerIndex: string;
    aiAnswerPlacement: QuizAiAnswerPlacement;
};

export type LocalAttachment = {
    file: File;
    preview: string | null;
    type: 'image' | 'document';
};

export type CreatePostText = {
    pageTitle: string;
    heading: string;
    subtitle: string;
    titleLabel: string;
    titlePlaceholder: string;
    contentLabel: string;
    contentPlaceholder: string;
    helperText: string;
    postTypeLabel: string;
    postTypeRequired: string;
    subjectLabel: string;
    subjectHint: string;
    subjectRequired: string;
    shareMaterial: string;
    askQuestion: string;
    createQuiz: string;
    languageLabel: string;
    languageRequired: string;
    charsLeft: string;
    mediaLabel: string;
    addFiles: string;
    dragDropTitle: string;
    dragDropSubtitle: string;
    pdfLabel: string;
    fileTypeLimit: string;
    fileTooLarge: string;
    noValidFiles: string;
    totalSizeExceeded: string;
    selected: string;
    tapToChoose: string;
    previewAlt: string;
    mathToolTitle: string;
    mathToolHint: string;
    mathInline: string;
    mathBlock: string;
    mathFraction: string;
    mathSqrt: string;
    mathPower: string;
    mathIntegral: string;
    mathSigma: string;
    physicsToolTitle: string;
    physicsToolHint: string;
    physicsForce: string;
    physicsVelocity: string;
    physicsAcceleration: string;
    physicsDelta: string;
    physicsTheta: string;
    physicsLambda: string;
    physicsOmega: string;
    physicsApprox: string;
    chemistryToolTitle: string;
    chemistryToolHint: string;
    chemistryReaction: string;
    chemistryEquilibrium: string;
    chemistryWater: string;
    chemistryCarbonDioxide: string;
    chemistrySulfuricAcid: string;
    chemistryIon: string;
    chemistryConcentration: string;
    symbolPreviewTitle: string;
    symbolPreviewHint: string;
    supportedFormat: string;
    quizQuestionLabel: string;
    quizQuestionPlaceholder: string;
    quizSectionTitle: string;
    quizSectionHint: string;
    quizOptionLabel: string;
    quizOptionPlaceholder: string;
    quizAddOption: string;
    quizRemoveOption: string;
    quizAddQuiz: string;
    quizRemoveQuiz: string;
    quizNumberLabel: string;
    quizQuestionInputLabel: string;
    quizAnswerLabel: string;
    quizAnswerPlaceholder: string;
    quizRequiredHint: string;
    quizAiAddOptions: string;
    quizAiAddingOptions: string;
    quizAiOptionsError: string;
    quizAiQuestionRequired: string;
    quizAiAnswerPlacementLabel: string;
    quizAiAnswerPlacementRandom: string;
    anonymousLabel: string;
    anonymousHint: string;
    publishing: string;
    publishPost: string;
};

export const buildCreatePostText = (
    trans: (key: string) => string,
): CreatePostText => ({
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
    quizAddOption: trans('createPost.quiz_add_option'),
    quizRemoveOption: trans('createPost.quiz_remove_option'),
    quizAddQuiz: trans('createPost.quiz_add_quiz'),
    quizRemoveQuiz: trans('createPost.quiz_remove_quiz'),
    quizNumberLabel: trans('createPost.quiz_number_label'),
    quizQuestionInputLabel: trans('createPost.quiz_question_input_label'),
    quizAnswerLabel: trans('createPost.quiz_answer_label'),
    quizAnswerPlaceholder: trans('createPost.quiz_answer_placeholder'),
    quizRequiredHint: trans('createPost.quiz_required_hint'),
    quizAiAddOptions: trans('createPost.quiz_ai_add_options'),
    quizAiAddingOptions: trans('createPost.quiz_ai_adding_options'),
    quizAiOptionsError: trans('createPost.quiz_ai_options_error'),
    quizAiQuestionRequired: trans('createPost.quiz_ai_question_required'),
    quizAiAnswerPlacementLabel: trans(
        'createPost.quiz_ai_answer_placement_label',
    ),
    quizAiAnswerPlacementRandom: trans(
        'createPost.quiz_ai_answer_placement_random',
    ),
    anonymousLabel: trans('createPost.anonymous_label'),
    anonymousHint: trans('createPost.anonymous_hint'),
    publishing: trans('createPost.publishing'),
    publishPost: trans('createPost.publish_post'),
});

export const getSubjectIcon = (subjectName: string): LucideIcon => {
    const lowerCaseName = subjectName.toLowerCase();

    if (lowerCaseName.includes('math')) return Calculator;
    if (lowerCaseName.includes('physics')) return Atom;
    if (lowerCaseName.includes('chemistry')) return TestTube;
    if (lowerCaseName.includes('biology') || lowerCaseName.includes('science'))
        return Dna;
    if (lowerCaseName.includes('computer')) return Laptop;
    if (lowerCaseName.includes('islamic')) return BookOpen;
    if (lowerCaseName.includes('moral') || lowerCaseName.includes('studies'))
        return BookOpen;
    if (
        lowerCaseName.includes('language') ||
        lowerCaseName.includes('english') ||
        lowerCaseName.includes('chinese') ||
        lowerCaseName.includes('tamil') ||
        lowerCaseName.includes('malay')
    )
        return Languages;
    if (lowerCaseName.includes('history')) return GraduationCap;
    if (
        lowerCaseName.includes('geography') ||
        lowerCaseName.includes('citizenship')
    )
        return Globe;
    if (
        lowerCaseName.includes('economics') ||
        lowerCaseName.includes('accounting') ||
        lowerCaseName.includes('business')
    )
        return Landmark;
    if (lowerCaseName.includes('art')) return Palette;
    if (lowerCaseName.includes('music')) return Music;
    if (
        lowerCaseName.includes('physical') ||
        lowerCaseName.includes('education')
    )
        return Activity;
    if (
        lowerCaseName.includes('design') ||
        lowerCaseName.includes('technology')
    )
        return Scissors;

    return BookOpen;
};

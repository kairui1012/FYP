export type SelectOption = {
    id: number;
    name?: string;
    title?: string;
    subject_name?: string | null;
    material_id?: number | null;
};

export type TeacherMaterialInsightsFilters = {
    material_id: number | null;
    subject_id: number | null;
    quiz_id: number | null;
    time_range: '7d' | '30d' | '90d' | 'all';
    sort: 'low_rating' | 'high_rating';
};

export type LowRatedMaterialInsight = {
    material_id: number;
    material_title: string;
    subject_name?: string | null;
    average_rating: number;
    rating_count: number;
};

export type FrequentlyWrongQuestionInsight = {
    quiz_id: number;
    quiz_title: string;
    material_id?: number | null;
    material_title?: string | null;
    subject_name?: string | null;
    question_index: number;
    wrong_count: number;
    total_attempts: number;
    error_rate: number;
};

export type TeacherMaterialInsightsData = {
    low_rated_materials: LowRatedMaterialInsight[];
    frequently_wrong_questions: FrequentlyWrongQuestionInsight[];
};

export type TransFn = (key: string) => string;

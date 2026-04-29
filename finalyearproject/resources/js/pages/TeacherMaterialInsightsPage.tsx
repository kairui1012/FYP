import { reactLang } from '@erag/lang-sync-inertia';
import { Head, router } from '@inertiajs/react';
import { InsightsFilterPanel } from '@/components/teacher-material-insights/insights-filter-panel';
import { InsightsPageHeader } from '@/components/teacher-material-insights/insights-page-header';
import { LowRatedMaterialsSection } from '@/components/teacher-material-insights/low-rated-materials-section';
import { MaterialVersionHistorySection } from '@/components/teacher-material-insights/material-version-history-section';
import type {
    SelectOption,
    TeacherMaterialInsightsData,
    TeacherMaterialInsightsFilters,
} from '@/components/teacher-material-insights/types';
import { WrongQuestionsSection } from '@/components/teacher-material-insights/wrong-questions-section';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type TeacherMaterialInsightsProps = {
    filters: TeacherMaterialInsightsFilters;
    materials: SelectOption[];
    subjects: SelectOption[];
    quizzes: SelectOption[];
    generated_at?: string;
    insights: TeacherMaterialInsightsData;
};

export default function TeacherMaterialInsightsPage({
    filters,
    materials,
    subjects,
    quizzes,
    generated_at: generatedAt,
    insights,
}: TeacherMaterialInsightsProps) {
    const { trans } = reactLang();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: trans('navigation.home'),
            href: '/homePage',
        },
        {
            title: trans('navigation.teacher_material_insights'),
            href: '/teacher/material-insights',
        },
    ];

    const onFilterChange = (
        key: keyof TeacherMaterialInsightsProps['filters'],
        value: string,
    ) => {
        const next = {
            ...filters,
            [key]: value === '' ? null : value,
        };

        router.get('/teacher/material-insights', next, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={trans('createPost.teacher_insights_title')} />
            <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
                <InsightsPageHeader trans={trans} generatedAt={generatedAt} />

                <InsightsFilterPanel
                    filters={filters}
                    materials={materials}
                    subjects={subjects}
                    quizzes={quizzes}
                    trans={trans}
                    onFilterChange={onFilterChange}
                />

                <LowRatedMaterialsSection
                    items={insights.low_rated_materials}
                    trans={trans}
                />

                <WrongQuestionsSection
                    items={insights.frequently_wrong_questions}
                    trans={trans}
                />

                <MaterialVersionHistorySection
                    items={insights.material_versions}
                    trans={trans}
                />
            </div>
        </AppLayout>
    );
}

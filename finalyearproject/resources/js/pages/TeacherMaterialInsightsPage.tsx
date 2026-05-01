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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type TeacherMaterialInsightsPageProps = {
    filters: TeacherMaterialInsightsFilters;
    materials: SelectOption[];
    subjects: SelectOption[];
    quizzes: SelectOption[];
    insights: TeacherMaterialInsightsData;
    generated_at: string;
};

export default function TeacherMaterialInsightsPage({
    filters,
    materials,
    subjects,
    quizzes,
    insights,
    generated_at,
}: TeacherMaterialInsightsPageProps) {
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

    function handleFilterChange(
        key: keyof TeacherMaterialInsightsFilters,
        value: string,
    ) {
        const next: Record<string, string | null> = {
            material_id: filters.material_id != null ? String(filters.material_id) : '',
            subject_id: filters.subject_id != null ? String(filters.subject_id) : '',
            quiz_id: filters.quiz_id != null ? String(filters.quiz_id) : '',
            time_range: filters.time_range,
            sort: filters.sort,
            [key]: value,
        };

        const params: Record<string, string> = {};
        for (const [k, v] of Object.entries(next)) {
            if (v !== '' && v !== null) params[k] = v;
        }

        router.get('/teacher/material-insights', params, {
            preserveScroll: true,
            replace: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={trans('createPost.teacher_insights_title')} />
            <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
                <InsightsPageHeader
                    trans={trans}
                    generatedAt={generated_at}
                />

                <div className="mt-4 space-y-6">
                    <InsightsFilterPanel
                        filters={filters}
                        materials={materials}
                        subjects={subjects}
                        quizzes={quizzes}
                        trans={trans}
                        onFilterChange={handleFilterChange}
                    />

                    <LowRatedMaterialsSection
                        items={insights.low_rated_materials}
                        trans={trans}
                    />

                    <MaterialVersionHistorySection
                        items={insights.material_versions}
                        trans={trans}
                    />
                </div>
            </div>
        </AppLayout>
    );
}

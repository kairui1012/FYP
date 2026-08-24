import { reactLang } from '@erag/lang-sync-inertia';
import { Head, router } from '@inertiajs/react';
import { LowRatedMaterialsSection } from '@/components/teacherMaterialInsightsPageComponent/low-rated-materials-section';
import { MaterialInsightsFilterPanel } from '@/components/teacherMaterialInsightsPageComponent/material-insights-filter-panel';
import { MaterialInsightsHeader } from '@/components/teacherMaterialInsightsPageComponent/material-insights-header';
import type {
    SelectOption,
    TeacherMaterialInsightsData,
    TeacherMaterialInsightsFilters,
} from '@/components/ts/features/teacher-material-insights/teacher-material-insights-types';
import { usePageRefreshOnFocus } from '@/hooks/use-page-refresh-on-focus';
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

    // Insights aggregate student feedback computed server-side; re-fetch on
    // focus to pick up new ratings (filters come from props, so they hold).
    usePageRefreshOnFocus();

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
            material_id:
                filters.material_id != null ? String(filters.material_id) : '',
            subject_id:
                filters.subject_id != null ? String(filters.subject_id) : '',
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
                <MaterialInsightsHeader
                    trans={trans}
                    generatedAt={generated_at}
                />

                <div className="mt-4 space-y-6">
                    <MaterialInsightsFilterPanel
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
                </div>
            </div>
        </AppLayout>
    );
}

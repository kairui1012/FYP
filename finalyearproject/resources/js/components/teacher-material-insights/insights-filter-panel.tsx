import type {
    SelectOption,
    TeacherMaterialInsightsFilters,
    TransFn,
} from '@/components/teacher-material-insights/types';

type InsightsFilterPanelProps = {
    filters: TeacherMaterialInsightsFilters;
    materials: SelectOption[];
    subjects: SelectOption[];
    quizzes: SelectOption[];
    trans: TransFn;
    onFilterChange: (
        key: keyof TeacherMaterialInsightsFilters,
        value: string,
    ) => void;
};

const selectClassName =
    'h-11 rounded-xl border-2 border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-[#e27193] focus:ring-4 focus:ring-[#f7c7d6]/50';

export function InsightsFilterPanel({
    filters,
    materials,
    subjects,
    quizzes,
    trans,
    onFilterChange,
}: InsightsFilterPanelProps) {
    return (
        <section className="rounded-2xl border-2 border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold text-zinc-900">
                        {trans('createPost.teacher_insights_filters')}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                        {trans('createPost.teacher_insights_subtitle')}
                    </p>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                <select
                    value={filters.material_id ?? ''}
                    onChange={(event) =>
                        onFilterChange('material_id', event.target.value)
                    }
                    className={selectClassName}
                >
                    <option value="">
                        {trans('createPost.teacher_insights_all_materials')}
                    </option>
                    {materials.map((material) => (
                        <option key={material.id} value={material.id}>
                            {material.title}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.subject_id ?? ''}
                    onChange={(event) =>
                        onFilterChange('subject_id', event.target.value)
                    }
                    className={selectClassName}
                >
                    <option value="">
                        {trans('createPost.teacher_insights_all_subjects')}
                    </option>
                    {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                            {subject.name}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.quiz_id ?? ''}
                    onChange={(event) =>
                        onFilterChange('quiz_id', event.target.value)
                    }
                    className={selectClassName}
                >
                    <option value="">
                        {trans('createPost.teacher_insights_all_quizzes')}
                    </option>
                    {quizzes.map((quiz) => (
                        <option key={quiz.id} value={quiz.id}>
                            {quiz.title}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.time_range}
                    onChange={(event) =>
                        onFilterChange('time_range', event.target.value)
                    }
                    className={selectClassName}
                >
                    <option value="7d">
                        {trans('createPost.teacher_insights_range_7d')}
                    </option>
                    <option value="30d">
                        {trans('createPost.teacher_insights_range_30d')}
                    </option>
                    <option value="90d">
                        {trans('createPost.teacher_insights_range_90d')}
                    </option>
                    <option value="all">
                        {trans('createPost.teacher_insights_range_all')}
                    </option>
                </select>

                <select
                    value={filters.sort}
                    onChange={(event) =>
                        onFilterChange('sort', event.target.value)
                    }
                    className={selectClassName}
                >
                    <option value="low_rating">
                        {trans('createPost.teacher_insights_sort_low_rating')}
                    </option>
                    <option value="high_rating">
                        {trans('createPost.teacher_insights_sort_high_rating')}
                    </option>
                    <option value="most_wrong">
                        {trans('createPost.teacher_insights_sort_most_wrong')}
                    </option>
                    <option value="most_repeated">
                        {trans(
                            'createPost.teacher_insights_sort_most_repeated',
                        )}
                    </option>
                </select>
            </div>
        </section>
    );
}

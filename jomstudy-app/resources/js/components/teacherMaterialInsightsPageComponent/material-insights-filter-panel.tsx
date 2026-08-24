import { SlidersHorizontal } from 'lucide-react';
import type {
    SelectOption,
    TeacherMaterialInsightsFilters,
    TransFn,
} from '@/components/ts/features/teacher-material-insights/teacher-material-insights-types';

type MaterialInsightsFilterPanelProps = {
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

type FilterGroupProps = {
    label: string;
    children: React.ReactNode;
};

function FilterGroup({ label, children }: FilterGroupProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
                {label}
            </label>
            {children}
        </div>
    );
}

const selectClassName =
    'h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 shadow-none outline-none transition-colors hover:border-zinc-300 focus:border-zinc-400 focus:ring-0 cursor-pointer';

export function MaterialInsightsFilterPanel({
    filters,
    materials,
    subjects,
    quizzes,
    trans,
    onFilterChange,
}: MaterialInsightsFilterPanelProps) {
    return (
        <section className="rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-600">
                    {trans('createPost.teacher_insights_filters')}
                </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <FilterGroup label={trans('createPost.teacher_col_material')}>
                    <select
                        value={filters.material_id ?? ''}
                        onChange={(e) =>
                            onFilterChange('material_id', e.target.value)
                        }
                        className={selectClassName}
                    >
                        <option value="">
                            {trans('createPost.teacher_insights_all_materials')}
                        </option>
                        {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.title}
                            </option>
                        ))}
                    </select>
                </FilterGroup>

                <FilterGroup label={trans('createPost.teacher_col_subject')}>
                    <select
                        value={filters.subject_id ?? ''}
                        onChange={(e) =>
                            onFilterChange('subject_id', e.target.value)
                        }
                        className={selectClassName}
                    >
                        <option value="">
                            {trans('createPost.teacher_insights_all_subjects')}
                        </option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                                {trans('subjects.' + s.name) || s.name}
                            </option>
                        ))}
                    </select>
                </FilterGroup>

                <FilterGroup
                    label={trans('createPost.teacher_insights_all_quizzes')}
                >
                    <select
                        value={filters.quiz_id ?? ''}
                        onChange={(e) =>
                            onFilterChange('quiz_id', e.target.value)
                        }
                        className={selectClassName}
                    >
                        <option value="">
                            {trans('createPost.teacher_insights_all_quizzes')}
                        </option>
                        {quizzes.map((q) => (
                            <option key={q.id} value={q.id}>
                                {q.title}
                            </option>
                        ))}
                    </select>
                </FilterGroup>

                <FilterGroup
                    label={trans('createPost.teacher_insights_period_label')}
                >
                    <select
                        value={filters.time_range}
                        onChange={(e) =>
                            onFilterChange('time_range', e.target.value)
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
                </FilterGroup>

                <FilterGroup
                    label={trans('createPost.teacher_insights_sort_label')}
                >
                    <select
                        value={filters.sort}
                        onChange={(e) => onFilterChange('sort', e.target.value)}
                        className={selectClassName}
                    >
                        <option value="low_rating">
                            {trans(
                                'createPost.teacher_insights_sort_low_rating',
                            )}
                        </option>
                        <option value="high_rating">
                            {trans(
                                'createPost.teacher_insights_sort_high_rating',
                            )}
                        </option>
                    </select>
                </FilterGroup>
            </div>
        </section>
    );
}

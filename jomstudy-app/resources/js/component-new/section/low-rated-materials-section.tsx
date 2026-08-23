import { MaterialInsightsDataTable } from '@/component-new/shared/material-insights-data-table';
import { MaterialInsightsSectionCard } from '@/component-new/section/material-insights-section-card';
import type {
    LowRatedMaterialInsight,
    TransFn,
} from '@/component-new/types/teacher-material-insights';

type LowRatedMaterialsSectionProps = {
    items: LowRatedMaterialInsight[];
    trans: TransFn;
};

export function LowRatedMaterialsSection({
    items,
    trans,
}: LowRatedMaterialsSectionProps) {
    return (
        <MaterialInsightsSectionCard
            title={trans('createPost.teacher_low_rated_title')}
            accent="rose"
        >
            <MaterialInsightsDataTable
                items={items}
                trans={trans}
                getRowKey={(item) => String(item.material_id)}
                columns={[
                    {
                        key: 'material',
                        header: trans('createPost.teacher_col_material'),
                        render: (item) => item.material_title,
                        className: 'font-medium text-zinc-900',
                    },
                    {
                        key: 'subject',
                        header: trans('createPost.teacher_col_subject'),
                        render: (item) =>
                            item.subject_name
                                ? trans('subjects.' + item.subject_name) ||
                                  item.subject_name
                                : '-',
                    },
                    {
                        key: 'avg_rating',
                        header: trans('createPost.teacher_col_avg_rating'),
                        render: (item) => item.average_rating.toFixed(2),
                    },
                    {
                        key: 'rating_count',
                        header: trans('createPost.teacher_col_rating_count'),
                        render: (item) => item.rating_count,
                    },
                ]}
            />
        </MaterialInsightsSectionCard>
    );
}

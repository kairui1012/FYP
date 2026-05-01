import { InsightsDataTable } from '@/components/teacher-material-insights/insights-data-table';
import { InsightsSectionCard } from '@/components/teacher-material-insights/insights-section-card';
import type {
    MaterialVersionInsight,
    TransFn,
} from '@/components/teacher-material-insights/types';

type MaterialVersionHistorySectionProps = {
    items: MaterialVersionInsight[];
    trans: TransFn;
};

export function MaterialVersionHistorySection({
    items,
    trans,
}: MaterialVersionHistorySectionProps) {
    return (
        <InsightsSectionCard
            title={trans('createPost.teacher_material_versions_title')}
            description={trans(
                'createPost.teacher_material_versions_description',
            )}
            accent="rose"
        >
            <InsightsDataTable
                items={items}
                trans={trans}
                getRowKey={(item) => String(item.id)}
                columns={[
                    {
                        key: 'material_title',
                        header: trans('createPost.teacher_col_material'),
                        render: (item) => item.material_title,
                        className: 'font-medium text-zinc-900',
                    },
                    {
                        key: 'version_number',
                        header: trans('createPost.teacher_col_version'),
                        render: (item) => `V${item.version_number}`,
                    },
                    {
                        key: 'average_rating',
                        header: trans('createPost.teacher_col_stars'),
                        render: (item) => `${item.average_rating.toFixed(1)} / 5`,
                    },
                    {
                        key: 'rating_count',
                        header: trans('createPost.teacher_col_raters'),
                        render: (item) => item.rating_count,
                    },
                    {
                        key: 'recommendation_rate',
                        header: trans('createPost.teacher_col_recommend_rate'),
                        render: (item) => `${item.recommendation_rate.toFixed(1)}%`,
                    },
                    {
                        key: 'recommendation_rate_change',
                        header: trans('createPost.teacher_col_rate_change'),
                        render: (item) =>
                            item.recommendation_rate_change === null
                                ? '-'
                                : `${item.recommendation_rate_change > 0 ? '+' : ''}${item.recommendation_rate_change.toFixed(1)}%`,
                    },
                    {
                        key: 'created_at',
                        header: trans('createPost.teacher_col_saved_at'),
                        render: (item) =>
                            item.created_at
                                ? new Intl.DateTimeFormat(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                  }).format(new Date(item.created_at))
                                : '-',
                    },
                ]}
            />
        </InsightsSectionCard>
    );
}

import { InsightsDataTable } from '@/components/teacher-material-insights/insights-data-table';
import { InsightsSectionCard } from '@/components/teacher-material-insights/insights-section-card';
import type {
    MaterialVersionInsight,
    TransFn,
} from '@/components/teacher-material-insights/types';
import { useMemo, useState } from 'react';

type MaterialVersionHistorySectionProps = {
    items: MaterialVersionInsight[];
    trans: TransFn;
};

export function MaterialVersionHistorySection({
    items,
    trans,
}: MaterialVersionHistorySectionProps) {
    const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(
        null,
    );

    const groupedByMaterial = useMemo(() => {
        const groups = new Map<number, MaterialVersionInsight[]>();

        items.forEach((item) => {
            const rows = groups.get(item.material_id) ?? [];
            rows.push(item);
            groups.set(item.material_id, rows);
        });

        groups.forEach((rows, materialId) => {
            groups.set(
                materialId,
                [...rows].sort((left, right) => {
                    if (left.version_number !== right.version_number) {
                        return right.version_number - left.version_number;
                    }

                    const leftTime = left.created_at
                        ? new Date(left.created_at).getTime()
                        : 0;
                    const rightTime = right.created_at
                        ? new Date(right.created_at).getTime()
                        : 0;

                    return rightTime - leftTime;
                }),
            );
        });

        return groups;
    }, [items]);

    const latestItems = useMemo(() => {
        return [...groupedByMaterial.values()]
            .map((rows) => rows[0])
            .filter((row): row is MaterialVersionInsight => Boolean(row))
            .sort((left, right) => {
                const leftTime = left.created_at
                    ? new Date(left.created_at).getTime()
                    : 0;
                const rightTime = right.created_at
                    ? new Date(right.created_at).getTime()
                    : 0;

                return rightTime - leftTime;
            });
    }, [groupedByMaterial]);

    const selectedLatest =
        selectedMaterialId === null
            ? null
            : latestItems.find((item) => item.material_id === selectedMaterialId) ??
              null;

    const historyItems = useMemo(() => {
        if (!selectedLatest) {
            return [];
        }

        const rows = groupedByMaterial.get(selectedLatest.material_id) ?? [];

        return rows.filter(
            (row) => row.version_number < selectedLatest.version_number,
        );
    }, [groupedByMaterial, selectedLatest]);

    return (
        <InsightsSectionCard
            title={trans('createPost.teacher_material_versions_title')}
            description={trans(
                'createPost.teacher_material_versions_description',
            )}
            accent="rose"
        >
            <InsightsDataTable
                items={latestItems}
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
                        render: (item) => (
                            <button
                                type="button"
                                onClick={() => setSelectedMaterialId(item.material_id)}
                                className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                            >
                                {`V${item.version_number}`}
                            </button>
                        ),
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

            {selectedLatest && (
                <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50/70 p-4">
                    <p className="mb-3 text-sm font-semibold text-zinc-800">
                        {`${trans('createPost.teacher_material_versions_title')} (${trans('createPost.teacher_insights_range_all')})`}
                    </p>
                    <p className="mb-3 text-xs text-zinc-600">
                        {`${trans('createPost.teacher_col_material')}: ${selectedLatest.material_title} · ${trans('createPost.teacher_col_version')}: V${selectedLatest.version_number}`}
                    </p>
                    <InsightsDataTable
                        items={historyItems}
                        trans={trans}
                        getRowKey={(item) => `history-${item.id}`}
                        columns={[
                            {
                                key: 'version_number',
                                header: trans('createPost.teacher_col_version'),
                                render: (item) => `V${item.version_number}`,
                                className: 'font-medium text-zinc-900',
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
                </div>
            )}
        </InsightsSectionCard>
    );
}

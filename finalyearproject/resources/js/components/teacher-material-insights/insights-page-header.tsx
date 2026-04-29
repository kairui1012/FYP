import type { TransFn } from '@/components/teacher-material-insights/types';

type InsightsPageHeaderProps = {
    trans: TransFn;
    generatedAt?: string;
};

export function InsightsPageHeader({
    trans,
    generatedAt,
}: InsightsPageHeaderProps) {
    return (
        <section className="p-5">
            <h1 className="text-2xl font-semibold text-zinc-900">
                {trans('createPost.teacher_insights_title')}
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
                {trans('createPost.teacher_insights_subtitle')}
            </p>
            {generatedAt ? (
                <p className="mt-2 text-xs text-zinc-500">
                    {trans('createPost.teacher_insights_generated_at')}: {' '}
                    {new Intl.DateTimeFormat(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    }).format(new Date(generatedAt))}
                </p>
            ) : null}
        </section>
    );
}

import { InsightsDataTable } from '@/components/teacher-material-insights/insights-data-table';
import { InsightsSectionCard } from '@/components/teacher-material-insights/insights-section-card';
import type {
    FrequentlyWrongQuestionInsight,
    TransFn,
} from '@/components/teacher-material-insights/types';

type WrongQuestionsSectionProps = {
    items: FrequentlyWrongQuestionInsight[];
    trans: TransFn;
};

export function WrongQuestionsSection({
    items,
    trans,
}: WrongQuestionsSectionProps) {
    return (
        <InsightsSectionCard
            title={trans('createPost.teacher_wrong_questions_title')}
            badgeLabel={trans('createPost.teacher_insight_badge')}
            accent="amber"
        >
            <InsightsDataTable
                items={items}
                trans={trans}
                getRowKey={(item) => `${item.quiz_id}-${item.question_index}`}
                columns={[
                    {
                        key: 'quiz',
                        header: trans('createPost.teacher_col_quiz'),
                        render: (item) => item.quiz_title,
                        className: 'font-medium text-zinc-900',
                    },
                    {
                        key: 'question',
                        header: trans('createPost.teacher_col_question'),
                        render: (item) => `Q${item.question_index + 1}`,
                    },
                    {
                        key: 'wrong_count',
                        header: trans('createPost.teacher_col_wrong_count'),
                        render: (item) => item.wrong_count,
                    },
                    {
                        key: 'error_rate',
                        header: trans('createPost.teacher_col_error_rate'),
                        render: (item) => `${item.error_rate.toFixed(1)}%`,
                    },
                ]}
            />
        </InsightsSectionCard>
    );
}

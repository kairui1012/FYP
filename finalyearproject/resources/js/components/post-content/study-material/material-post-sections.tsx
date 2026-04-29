import { trans } from '@/components/post-content/post-content-config';
import { MaterialLearningPath } from '@/components/post-content/study-material/material-learning-path';
import { StudyMaterialBlocks } from '@/components/post-content/study-material/study-material-blocks';
import { MaterialLearningStateBadge } from '@/components/ui/material-learning-state-badge';
import type { PostItem } from '@/types';

type MaterialPostSectionsProps = {
    page: unknown;
    post: PostItem;
    translatedTitle: string;
    displayedContent: string;
    isAdmin: boolean;
    isEditing: boolean;
    linkedQuizzes: PostItem[];
    analytics: PostItem['learning_analytics'];
};

function formatMaterialDate(value: string | undefined, page: unknown): string {
    if (!value) {
        return trans('createPost.material_not_available', page);
    }

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(value));
}

export function MaterialPostSections({
    page,
    post,
    translatedTitle,
    displayedContent,
    isAdmin,
    isEditing,
    linkedQuizzes,
    analytics,
}: MaterialPostSectionsProps) {
    return (
        <>
            {isAdmin ? (
                <section className="mx-4 mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <h2 className="text-sm font-semibold tracking-wide text-blue-900 uppercase">
                        {trans('createPost.material_learning_analytics', page)}
                    </h2>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg bg-white p-3 text-center">
                            <p className="text-xs text-zinc-500">
                                {trans('createPost.material_views', page)}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-zinc-900">
                                {analytics?.views ?? 0}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-3 text-center">
                            <p className="text-xs text-zinc-500">
                                {trans(
                                    'createPost.material_unique_users',
                                    page,
                                )}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-zinc-900">
                                {analytics?.unique_users ?? 0}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-3 text-center">
                            <p className="text-xs text-zinc-500">
                                {trans(
                                    'createPost.material_average_quiz_score',
                                    page,
                                )}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-zinc-900">
                                {(analytics?.average_quiz_score ?? 0).toFixed(
                                    1,
                                )}
                                %
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-3 text-center">
                            <p className="text-xs text-zinc-500">
                                {trans(
                                    'createPost.material_attempt_improvement',
                                    page,
                                )}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-zinc-900">
                                {(
                                    analytics?.improvement_across_attempts ?? 0
                                ).toFixed(1)}
                                %
                            </p>
                        </div>
                    </div>
                    <p className="mt-3 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs leading-relaxed text-zinc-600">
                        {trans('createPost.material_learning_loop', page)}
                    </p>
                </section>
            ) : null}

            <section className="mx-4 mt-4 rounded-xl bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <h1 className="text-2xl font-semibold text-zinc-950">
                        {translatedTitle}
                    </h1>
                    <MaterialLearningStateBadge
                        state={post.material_learning_state}
                    />
                </div>
                <div className="mt-3 border-b border-zinc-200" />
                <p className="mt-2 text-sm text-zinc-600">
                    {trans('createPost.material_publisher_label', page)}:{' '}
                    {post.user?.name ??
                        trans('createPost.material_unknown_user', page)}{' '}
                    ({post.user?.role ?? 'teacher'})
                </p>
                <p className="text-sm text-zinc-500">
                    {trans('createPost.material_last_updated_label', page)}:{' '}
                    {formatMaterialDate(post.updated_at, page)}
                </p>
            </section>

            <MaterialLearningPath
                page={page}
                path={post.material_learning_path}
            />

            {!isEditing ? (
                <section className="mx-4 mt-1 rounded-xl bg-white p-5">
                    <StudyMaterialBlocks
                        blocks={post.content_blocks}
                        fallbackContent={displayedContent}
                    />
                    <p className="mt-4 rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                        {trans('createPost.material_reliable_badge', page)}
                    </p>
                </section>
            ) : null}

            <section className="mx-4 mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="text-lg font-semibold text-zinc-900">
                    {trans('createPost.material_quiz_section', page)}
                </h2>
                {linkedQuizzes.length > 0 ? (
                    <div className="mt-4 space-y-3">
                        {linkedQuizzes.map((quiz) => (
                            <div
                                key={quiz.id}
                                className="rounded-lg border border-amber-200 bg-white p-4"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-semibold text-zinc-900">
                                            {quiz.title}
                                        </p>
                                        <p className="text-sm text-zinc-600">
                                            {trans(
                                                'createPost.material_quiz_status_label',
                                                page,
                                            )}
                                            :{' '}
                                            {quiz.is_quiz_completed
                                                ? trans(
                                                      'createPost.material_quiz_completed',
                                                      page,
                                                  )
                                                : trans(
                                                      'createPost.material_quiz_not_attempted',
                                                      page,
                                                  )}
                                        </p>
                                    </div>
                                    <a
                                        href={`/posts/${quiz.id}`}
                                        className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
                                    >
                                        {trans(
                                            'createPost.material_attempt_quiz',
                                            page,
                                        )}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="mt-3 text-sm text-zinc-600">
                        {trans('createPost.material_no_linked_quizzes', page)}
                    </p>
                )}
            </section>
        </>
    );
}

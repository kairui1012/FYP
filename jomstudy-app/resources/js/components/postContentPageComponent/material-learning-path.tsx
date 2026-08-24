import { CheckCircle2, Circle, Clock3, Lock } from 'lucide-react';
import { trans } from '@/components/ts/features/post-content/post-content-config';
import type { PostItem } from '@/types';

type MaterialLearningPathProps = {
    page: unknown;
    path?: PostItem['material_learning_path'];
};

type MaterialLearningPathStep = NonNullable<
    PostItem['material_learning_path']
>[number];

function stepLabel(stepKey: string, page: unknown): string {
    if (stepKey === 'read_material') {
        return trans('createPost.material_path_read_material', page);
    }

    if (stepKey === 'complete_quiz') {
        return trans('createPost.material_path_complete_quiz', page);
    }

    if (stepKey === 'submit_feedback') {
        return trans('createPost.material_path_submit_feedback', page);
    }

    return stepKey;
}

function statusLabel(step: MaterialLearningPathStep, page: unknown): string {
    if (step.key === 'complete_quiz' && (step.progress_target ?? 0) > 0) {
        const progressTarget = step.progress_target ?? 0;
        const progressCurrent = Math.min(
            step.progress_current ?? 0,
            progressTarget,
        );

        return `${progressCurrent}/${progressTarget}`;
    }

    const { status } = step;
    if (status === 'completed') {
        return trans('createPost.material_path_status_completed', page);
    }

    if (status === 'in_progress') {
        return trans('createPost.material_path_status_in_progress', page);
    }

    if (status === 'not_required') {
        return trans('createPost.material_path_status_not_required', page);
    }

    return trans('createPost.material_path_status_pending', page);
}

function statusIcon(status: string) {
    if (status === 'completed') {
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    }

    if (status === 'in_progress') {
        return <Clock3 className="h-4 w-4 text-amber-600" />;
    }

    if (status === 'not_required') {
        return <Lock className="h-4 w-4 text-zinc-400" />;
    }

    return <Circle className="h-4 w-4 text-zinc-400" />;
}

function stepCardClassName(status: string): string {
    if (status === 'completed') {
        return 'rounded-lg border border-emerald-200 bg-emerald-50 p-3';
    }

    return 'rounded-lg border border-zinc-200 bg-zinc-50 p-3';
}

export function MaterialLearningPath({
    page,
    path,
}: MaterialLearningPathProps) {
    const visiblePath = (path ?? []).filter((step) => step.required !== false);
    const gridClassName =
        visiblePath.length >= 3
            ? 'mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3'
            : visiblePath.length === 2
              ? 'mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'
              : 'mt-3 grid grid-cols-1 gap-3';

    if (visiblePath.length === 0) {
        return null;
    }

    return (
        <section className="mx-4 mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-sm font-semibold text-zinc-900">
                {trans('createPost.material_path_title', page)}
            </h2>
            <div className={gridClassName}>
                {visiblePath.map((step) => (
                    <div
                        key={step.key}
                        className={stepCardClassName(step.status)}
                    >
                        <div className="flex items-center gap-2">
                            {statusIcon(step.status)}
                            <p className="text-sm font-semibold text-zinc-900">
                                {stepLabel(step.key, page)}
                            </p>
                        </div>
                        <p className="mt-1 text-xs text-zinc-600">
                            {statusLabel(step, page)}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

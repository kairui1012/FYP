import { reactLang } from '@erag/lang-sync-inertia';
import { cn } from '@/lib/utils';

type MaterialLearningStateBadgeProps = {
    state?: string | null;
    className?: string;
};

const STATE_STYLE_MAP: Record<string, string> = {
    unread: 'bg-zinc-100 text-zinc-700',
    in_progress: 'bg-amber-100 text-amber-700',
    read: 'bg-sky-100 text-sky-700',
    completed: 'bg-emerald-100 text-emerald-700',
};

const STATE_LABEL_KEY_MAP: Record<string, string> = {
    unread: 'createPost.material_status_unread',
    in_progress: 'createPost.material_status_in_progress',
    read: 'createPost.material_status_read',
    completed: 'createPost.material_status_completed',
};

export function MaterialLearningStateBadge({
    state,
    className,
}: MaterialLearningStateBadgeProps) {
    const { trans } = reactLang();

    if (!state) {
        return null;
    }

    const normalizedState = state.toLowerCase();
    const labelKey = STATE_LABEL_KEY_MAP[normalizedState];
    const stateLabel = labelKey ? trans(labelKey) : state;

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                STATE_STYLE_MAP[normalizedState] ?? 'bg-zinc-100 text-zinc-700',
                className,
            )}
        >
            {stateLabel}
        </span>
    );
}

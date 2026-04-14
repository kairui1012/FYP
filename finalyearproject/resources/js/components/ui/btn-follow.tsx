import { UserPlus } from 'lucide-react';
import { reactLang } from '@erag/lang-sync-inertia';

type BtnFollowProps = {
    following?: boolean;
    loading?: boolean;
    className?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function BtnFollow({
    following = false,
    loading = false,
    className = '',
    onClick,
}: BtnFollowProps) {
    const { trans } = reactLang();

    const baseClass =
        'inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-70';

    const stateClass = following
        ? 'border border-zinc-300 bg-white text-zinc-700 shadow-sm hover:border-zinc-400 hover:bg-zinc-50'
        : 'bg-linear-to-r from-[#f3a7bd] to-[#e88eaa] text-white shadow-sm hover:from-[#ec9cb5] hover:to-[#df819f]';

    return (
        <button
            type="button"
            disabled={loading}
            className={`${baseClass} ${stateClass} ${className}`.trim()}
            onClick={(event) => {
                event.stopPropagation();
                onClick?.(event);
            }}
        >
            <UserPlus className="h-3 w-3" />
            <span>{following ? trans('navigation.following_action') : trans('navigation.follow_action')}</span>
        </button>
    );
}

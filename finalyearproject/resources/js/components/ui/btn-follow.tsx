import { UserCheck, UserPlus } from 'lucide-react';
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
        'inline-flex h-[26px] items-center gap-[5px] rounded-full px-[10px] text-[11px] font-semibold tracking-[0.01em] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50 disabled:cursor-not-allowed disabled:opacity-50';

    const stateClass = following
        ? 'border border-zinc-300 bg-transparent text-zinc-500 hover:border-rose-400 hover:text-rose-500'
        : 'border border-[#e0526f] bg-[#e88ea0] text-white hover:bg-[#c94461] hover:border-[#c94461]';

    const Icon = following ? UserCheck : UserPlus;

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
            <Icon className="h-2.5 w-2.75" />
            <span>
                {following
                    ? trans('navigation.following_action')
                    : trans('navigation.follow_action')}
            </span>
        </button>
    );
}
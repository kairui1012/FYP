import { reactLang } from '@erag/lang-sync-inertia';
import { Loader2, UserCheck, UserPlus } from 'lucide-react';
import type React from 'react';

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
        'inline-flex h-[26px] items-center justify-center gap-[2px] whitespace-nowrap rounded-full border pl-[6px] pr-[8px] text-[11px] font-semibold tracking-[0.01em] outline-none transition-all duration-150 active:scale-[0.98] will-change-transform focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0';

    const stateClass = following
        ? 'border-zinc-300 bg-transparent text-zinc-500 hover:border-[#d85380] hover:text-[#d85380]'
        : 'border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] text-white hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black';

    const Icon = loading ? Loader2 : following ? UserCheck : UserPlus;

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
            <Icon
                className={`h-2.5 w-2.5 shrink-0${loading ? ' animate-spin' : ''}`}
            />
            <span>
                {following
                    ? trans('navigation.following_action')
                    : trans('navigation.follow_action')}
            </span>
        </button>
    );
}
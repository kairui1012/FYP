import { Bookmark } from 'lucide-react';
import { reactLang } from '@erag/lang-sync-inertia';

type BtnSaveProps = {
    count: number;
    saved?: boolean;
    loading?: boolean;
    className?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function BtnSave({
    count,
    saved = false,
    loading = false,
    className = '',
    onClick,
}: BtnSaveProps) {
    const { trans } = reactLang();

    const btnClass =
        'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-semibold transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-70';

    const activeClass = saved
    ? 'bg-amber-500 text-white ring-2 ring-amber-200/80 shadow-[0_8px_20px_rgba(245,158,11,0.35)]'
    : 'bg-zinc-200 text-zinc-600 hover:bg-amber-400 hover:text-white active:bg-amber-600 active:text-white';

    return (
        <button
            type="button"
            disabled={loading}
            className={`${btnClass} ${activeClass} ${className}`.trim()}
            onClick={(event) => {
                event.stopPropagation();
                onClick?.(event);
            }}
            aria-label={saved ? trans('navigation.saved') : trans('navigation.save')}
            title={saved ? trans('navigation.saved') : trans('navigation.save')}
        >
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-white text-white' : ''}`} />
            <span>{count}</span>
        </button>
    );
}

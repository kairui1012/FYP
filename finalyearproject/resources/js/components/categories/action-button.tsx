type ActionButtonProps = {
    variant: 'secondary' | 'primary';
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    alignRight?: boolean;
};

export function ActionButton({
    variant,
    onClick,
    icon: Icon,
    label,
    alignRight = false,
}: ActionButtonProps) {
    const baseClass =
        variant === 'primary'
            ? 'inline-flex items-center gap-2 rounded-lg bg-[#e27193] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d4607f] disabled:opacity-50'
            : 'inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`${alignRight ? 'ml-auto' : ''}inline-flex items-center gap-2 ${baseClass}`}
        >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {label}
        </button>
    );
}

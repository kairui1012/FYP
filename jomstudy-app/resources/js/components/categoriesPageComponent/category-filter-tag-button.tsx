import type { LanguageTagStyle } from '../ts/features/categories/category-types';

type FilterTagButtonProps = {
    isSelected: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    count: number;
    style: LanguageTagStyle;
};

export function FilterTagButton({
    isSelected,
    onClick,
    icon: Icon,
    label,
    count,
    style,
}: FilterTagButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 rounded-md border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                isSelected ? `${style.active} shadow-sm` : style.inactive
            }`}
        >
            <Icon className="h-3.5 w-3.5" />
            {label}
            <span
                className={`rounded px-1 py-0.5 text-[11px] font-semibold ${isSelected ? style.countActive : style.countInactive}`}
            >
                {count}
            </span>
        </button>
    );
}

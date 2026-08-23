import { Check, ChevronDown, Sparkles, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { RANGE_OPTIONS, SORT_OPTIONS } from './learning-trends-config';
import type { PopularRange, PopularSort, TransFn } from './types';

type LearningTrendsToolbarProps = {
    activeRange: PopularRange;
    activeSort: PopularSort;
    onRangeChange: (range: PopularRange) => void;
    onSortChange: (sort: PopularSort) => void;
    trans: TransFn;
};

export function LearningTrendsToolbar({
    activeRange,
    activeSort,
    onRangeChange,
    onSortChange,
    trans,
}: LearningTrendsToolbarProps) {
    const [isRangeOpen, setIsRangeOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const rangeRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                rangeRef.current &&
                !rangeRef.current.contains(event.target as Node)
            ) {
                setIsRangeOpen(false);
            }
            if (
                sortRef.current &&
                !sortRef.current.contains(event.target as Node)
            ) {
                setIsSortOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeRangeOption =
        RANGE_OPTIONS.find((option) => option.value === activeRange) ??
        RANGE_OPTIONS[0];
    const ActiveRangeIcon = activeRangeOption.icon;
    const activeSortOption =
        SORT_OPTIONS.find((option) => option.value === activeSort) ??
        SORT_OPTIONS[0];

    return (
        <div className="flex items-center justify-between gap-3">
            <div className="relative" ref={rangeRef}>
                <button
                    type="button"
                    onClick={() => {
                        setIsRangeOpen((value) => !value);
                        setIsSortOpen(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                    <ActiveRangeIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    {trans(`popular.${activeRangeOption.value}`)}
                    <ChevronDown
                        className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isRangeOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {isRangeOpen && (
                    <div className="absolute top-full left-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                        {RANGE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const isActive = activeRange === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        setIsRangeOpen(false);
                                        onRangeChange(option.value);
                                    }}
                                    className={`my-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                                        isActive
                                            ? 'bg-neutral-100 font-medium text-neutral-900'
                                            : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                                    }`}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span className="flex-1 text-left text-sm font-medium text-neutral-900">
                                        {trans(`popular.${option.value}`)}
                                    </span>
                                    {isActive ? (
                                        <span className="flex size-5 items-center justify-center rounded-full bg-[#de6b89]/12 text-[#de6b89]">
                                            <Check className="size-3.5" />
                                        </span>
                                    ) : (
                                        <span className="size-5 rounded-full border border-transparent" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="relative" ref={sortRef}>
                <button
                    type="button"
                    onClick={() => {
                        setIsSortOpen((value) => !value);
                        setIsRangeOpen(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                    {activeSortOption.icon === 'fire' ? (
                        <TrendingUp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    ) : (
                        <Sparkles className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    )}
                    {trans(`popular.${activeSortOption.value}`)}
                    <ChevronDown
                        className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {isSortOpen && (
                    <div className="absolute top-full right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                        {SORT_OPTIONS.map((option) => {
                            const isActive = activeSort === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        setIsSortOpen(false);
                                        onSortChange(option.value);
                                    }}
                                    className={`my-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                                        isActive
                                            ? 'bg-neutral-100 font-medium text-neutral-900'
                                            : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                                    }`}
                                >
                                    {option.icon === 'fire' ? (
                                        <TrendingUp className="h-4 w-4 shrink-0" />
                                    ) : (
                                        <Sparkles className="h-4 w-4 shrink-0" />
                                    )}
                                    <span className="flex-1 text-left text-sm font-medium text-neutral-900">
                                        {trans(`popular.${option.value}`)}
                                    </span>
                                    {isActive ? (
                                        <span className="flex size-5 items-center justify-center rounded-full bg-[#de6b89]/12 text-[#de6b89]">
                                            <Check className="size-3.5" />
                                        </span>
                                    ) : (
                                        <span className="size-5 rounded-full border border-transparent" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

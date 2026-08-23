import {
    CalendarClock,
    CalendarDays,
    CalendarRange,
    Flame,
} from 'lucide-react';
import type {
    LearningTrendRangeOption,
    LearningTrendSortOption,
} from './types';

export const RANGE_OPTIONS: LearningTrendRangeOption[] = [
    { value: 'today', label: 'Today', icon: CalendarClock },
    { value: 'week', label: 'This Week', icon: CalendarRange },
    { value: 'month', label: 'This Month', icon: CalendarDays },
    { value: 'all', label: 'All Time', icon: Flame },
];

export const SORT_OPTIONS: LearningTrendSortOption[] = [
    { value: 'hottest', label: 'Hottest', icon: 'fire' },
    { value: 'newest', label: 'Newest', icon: 'sparkles' },
];

export function getLangBadgeProps(code: string) {
    if (code === 'en') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (code === 'zh') return { bg: 'bg-red-100', text: 'text-red-700' };
    if (code === 'bm' || code === 'my') {
        return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    }
    return { bg: 'bg-gray-200', text: 'text-gray-700' };
}

export function getPostTypeBadgeProps(type: string) {
    if (type === 'quiz') return { bg: 'bg-amber-100', text: 'text-amber-700' };
    if (type === 'question') {
        return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    }
    return { bg: 'bg-violet-100', text: 'text-violet-700' };
}

export function getSubjectBadgeProps() {
    return { bg: 'bg-slate-100', text: 'text-slate-700' };
}

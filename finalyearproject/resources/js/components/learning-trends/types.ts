import type { LucideIcon } from 'lucide-react';
import type { PaginationMeta, PostItem } from '@/types';

export type PopularRange = 'today' | 'week' | 'month' | 'all';

export type PopularSort = 'newest' | 'hottest';

export type LearningTrendsPageProps = {
    posts?: PostItem[];
    pagination?: PaginationMeta;
    activeRange?: PopularRange;
    activeSort?: PopularSort;
};

export type LearningTrendRangeOption = {
    value: PopularRange;
    label: string;
    icon: LucideIcon;
};

export type LearningTrendSortOption = {
    value: PopularSort;
    label: string;
    icon: 'fire' | 'sparkles';
};

export type TransFn = (key: string) => string;

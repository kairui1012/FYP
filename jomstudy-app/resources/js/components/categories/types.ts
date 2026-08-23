import type { PaginationMeta, PostItem } from '@/types';

export type CategoryLanguage = {
    id: number;
    code: string;
    name: string;
    posts_count: number;
};

export type CategorySubject = {
    id: number;
    name: string;
    posts_count: number;
};

export type CategoriesPageProps = {
    languages?: CategoryLanguage[];
    subjects?: CategorySubject[];
    filteredPosts?:
        | PostItem[]
        | {
              posts: PostItem[];
              pagination: PaginationMeta;
          };
};

export type ContentTypeKey = 'all' | 'material' | 'question' | 'quiz';

export type ContentType = {
    key: ContentTypeKey;
    labelKey: string;
    descKey: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    accentColor: string;
    queryValue: string;
};

export type LanguageTagStyle = {
    active: string;
    inactive: string;
    countActive: string;
    countInactive: string;
};

export type TransFn = (key: string) => string;

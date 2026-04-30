import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { CONTENT_TYPES, hasActiveFilters } from '@/components/categories/categories-config';
import type { CategoriesPageProps, ContentTypeKey } from '@/components/categories/types';
import type { PostItem } from '@/types';

export function useCategoryFilters(props: CategoriesPageProps) {
    const languages = useMemo(() => props.languages ?? [], [props.languages]);
    const subjects = useMemo(() => props.subjects ?? [], [props.subjects]);

    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedType, setSelectedType] = useState<ContentTypeKey | ''>('');
    const [view, setView] = useState<'filters' | 'results'>('filters');
    const [localPosts, setLocalPosts] = useState<PostItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (props.filteredPosts !== undefined) {
            setLocalPosts(props.filteredPosts);
            setView('results');
            setIsLoading(false);
        }
    }, [props.filteredPosts]);

    const totalPosts = useMemo(() => {
        const languageCount = languages.reduce((sum, item) => sum + (item.posts_count ?? 0), 0);
        const subjectCount = subjects.reduce((sum, item) => sum + (item.posts_count ?? 0), 0);
        return Math.max(languageCount, subjectCount);
    }, [languages, subjects]);

    const isFiltering = hasActiveFilters(selectedLanguage, selectedSubject, selectedType);

    const clearAll = () => {
        setSelectedLanguage('');
        setSelectedSubject('');
        setSelectedType('');
    };

    const fetchPosts = (query: Record<string, string> = {}) => {
        setIsLoading(true);
        router.visit('/categories', {
            method: 'get',
            data: query,
            only: ['filteredPosts'],
            preserveState: true,
            preserveScroll: true,
        });
    };

    const applyFilters = () => {
        const activeType =
            selectedType && selectedType !== 'all'
                ? (CONTENT_TYPES.find((t) => t.key === selectedType)?.queryValue ?? '')
                : '';

        fetchPosts({
            ...(selectedLanguage ? { language_code: selectedLanguage } : {}),
            ...(selectedSubject ? { subject_id: selectedSubject } : {}),
            ...(activeType ? { post_type: activeType } : {}),
        });
    };

    return {
        languages,
        subjects,
        selectedLanguage,
        setSelectedLanguage,
        selectedSubject,
        setSelectedSubject,
        selectedType,
        setSelectedType,
        view,
        setView,
        localPosts,
        isLoading,
        totalPosts,
        isFiltering,
        clearAll,
        fetchPosts,
        applyFilters,
    };
}

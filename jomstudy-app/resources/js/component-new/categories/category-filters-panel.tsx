import { CheckCircle2, Globe, Sparkles, X } from 'lucide-react';
import { ActionButton } from '../button/btn-categories-action';
import {
    CONTENT_TYPES,
    DEFAULT_LANGUAGE_STYLE,
    getLanguageStyle,
    getSubjectIcon,
    resolveLanguageLabel,
    resolveSubjectLabel,
} from '../config/categories-config';
import { FilterTagButton } from '../button/btn-categories-filter-tag';
import type {
    CategoryLanguage,
    CategorySubject,
    ContentTypeKey,
    TransFn,
} from './types';

type CategoryFiltersPanelProps = {
    languages: CategoryLanguage[];
    subjects: CategorySubject[];
    selectedLanguage: string;
    selectedSubject: string;
    selectedType: ContentTypeKey | '';
    totalPosts: number;
    isFiltering: boolean;
    trans: TransFn;
    onSelectedLanguageChange: (value: string) => void;
    onSelectedSubjectChange: (value: string) => void;
    onSelectedTypeChange: (value: ContentTypeKey | '') => void;
    onClearAll: () => void;
    onViewAllPosts: () => void;
    onApplyFilters: () => void;
};

export function CategoryFiltersPanel({
    languages,
    subjects,
    selectedLanguage,
    selectedSubject,
    selectedType,
    totalPosts,
    isFiltering,
    trans,
    onSelectedLanguageChange,
    onSelectedSubjectChange,
    onSelectedTypeChange,
    onClearAll,
    onViewAllPosts,
    onApplyFilters,
}: CategoryFiltersPanelProps) {
    return (
        <div className="min-h-[calc(100dvh-4rem)] bg-zinc-50/60 pb-28">
            <div className="border-b border-zinc-200 bg-white px-4 py-5 md:px-6">
                <div className="mx-auto max-w-4xl">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                                {trans('navigation.categories')}
                            </h1>
                            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                                {trans('category.description')}
                            </p>
                        </div>
                        <div className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-center dark:border-zinc-700 dark:bg-zinc-900">
                            <div className="text-lg leading-none font-bold text-zinc-900 dark:text-zinc-100">
                                {totalPosts}
                            </div>
                            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                {trans('category.total_posts')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 md:px-6">
                <ContentTypeFilter
                    selectedType={selectedType}
                    trans={trans}
                    onSelectedTypeChange={onSelectedTypeChange}
                />

                <LanguageFilter
                    languages={languages}
                    selectedLanguage={selectedLanguage}
                    trans={trans}
                    onSelectedLanguageChange={onSelectedLanguageChange}
                />

                <SubjectFilter
                    subjects={subjects}
                    selectedSubject={selectedSubject}
                    trans={trans}
                    onSelectedSubjectChange={onSelectedSubjectChange}
                />

                <div className="flex items-center gap-2 border-t border-zinc-200 pt-4">
                    {isFiltering && (
                        <ActionButton
                            variant="secondary"
                            onClick={onClearAll}
                            icon={X}
                            label={trans('category.clear_all')}
                        />
                    )}
                    <ActionButton
                        variant="secondary"
                        onClick={onViewAllPosts}
                        label={trans('category.view_all_posts')}
                    />
                    <ActionButton
                        variant="primary"
                        onClick={onApplyFilters}
                        icon={Sparkles}
                        label={trans('category.apply_filters')}
                        alignRight
                    />
                </div>
            </div>
        </div>
    );
}

type ContentTypeFilterProps = {
    selectedType: ContentTypeKey | '';
    trans: TransFn;
    onSelectedTypeChange: (value: ContentTypeKey | '') => void;
};

function ContentTypeFilter({
    selectedType,
    trans,
    onSelectedTypeChange,
}: ContentTypeFilterProps) {
    return (
        <div>
            <p className="mb-2.5 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                {trans('category.content_type')}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CONTENT_TYPES.map((type) => {
                    const TypeIcon = type.icon;
                    const isSelected =
                        selectedType === type.key ||
                        (type.key === 'all' && selectedType === '');

                    return (
                        <button
                            key={type.key}
                            type="button"
                            onClick={() =>
                                onSelectedTypeChange(
                                    type.key === 'all' ? '' : type.key,
                                )
                            }
                            className={`relative flex flex-col rounded-xl border-2 p-3.5 text-left transition-all ${
                                isSelected
                                    ? `${type.accentColor} border-2 shadow-sm`
                                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600'
                            }`}
                        >
                            <div
                                className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${isSelected ? type.iconBg : 'bg-zinc-100'}`}
                            >
                                <TypeIcon
                                    className={`h-3.5 w-3.5 ${isSelected ? type.iconColor : 'text-zinc-500'}`}
                                />
                            </div>
                            <span className="text-xs leading-tight font-semibold text-zinc-900 dark:text-zinc-100">
                                {trans(type.labelKey)}
                            </span>
                            <span className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-zinc-400 dark:text-zinc-500">
                                {trans(type.descKey)}
                            </span>
                            {isSelected && (
                                <CheckCircle2
                                    className={`absolute top-2.5 right-2.5 h-3.5 w-3.5 ${type.iconColor}`}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

type LanguageFilterProps = {
    languages: CategoryLanguage[];
    selectedLanguage: string;
    trans: TransFn;
    onSelectedLanguageChange: (value: string) => void;
};

function LanguageFilter({
    languages,
    selectedLanguage,
    trans,
    onSelectedLanguageChange,
}: LanguageFilterProps) {
    return (
        <div>
            <p className="mb-2.5 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                {trans('category.language_tags')}
            </p>
            {languages.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    {trans('category.no_language_tags')}
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {languages.map((language) => {
                        const isSelected = selectedLanguage === language.code;

                        return (
                            <FilterTagButton
                                key={language.id}
                                isSelected={isSelected}
                                onClick={() =>
                                    onSelectedLanguageChange(
                                        isSelected ? '' : language.code,
                                    )
                                }
                                icon={Globe}
                                label={resolveLanguageLabel(language, trans)}
                                count={language.posts_count}
                                style={getLanguageStyle(language.code)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

type SubjectFilterProps = {
    subjects: CategorySubject[];
    selectedSubject: string;
    trans: TransFn;
    onSelectedSubjectChange: (value: string) => void;
};

function SubjectFilter({
    subjects,
    selectedSubject,
    trans,
    onSelectedSubjectChange,
}: SubjectFilterProps) {
    return (
        <div>
            <p className="mb-2.5 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                {trans('category.subject_tags')}
            </p>
            {subjects.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    {trans('category.no_subject_tags')}
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => {
                        const subjectId = String(subject.id);
                        const isSelected = selectedSubject === subjectId;

                        return (
                            <FilterTagButton
                                key={subject.id}
                                isSelected={isSelected}
                                onClick={() =>
                                    onSelectedSubjectChange(
                                        isSelected ? '' : subjectId,
                                    )
                                }
                                icon={getSubjectIcon(subject.name)}
                                label={resolveSubjectLabel(subject.name, trans)}
                                count={subject.posts_count}
                                style={DEFAULT_LANGUAGE_STYLE}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

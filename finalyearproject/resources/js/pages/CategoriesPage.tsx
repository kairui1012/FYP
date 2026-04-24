import AppLayout from '@/layouts/app-layout';
import { categories as categoriesRoute } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { reactLang } from '@erag/lang-sync-inertia';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Atom,
    BookOpen,
    Calculator,
    CheckCircle2,
    Globe,
    HelpCircle,
    Layers,
    Microscope,
    Sparkles,
    Target,
    X,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

type CategoryLanguage = {
    id: number;
    code: string;
    name: string;
    posts_count: number;
};

type CategorySubject = {
    id: number;
    name: string;
    posts_count: number;
};

type CategoriesPageProps = {
    languages?: CategoryLanguage[];
    subjects?: CategorySubject[];
};

type ContentTypeKey = 'all' | 'material' | 'question' | 'quiz';

type ContentType = {
    key: ContentTypeKey;
    labelKey: string;
    descKey: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    accentColor: string;
    queryValue: string;
};

const CONTENT_TYPES: ContentType[] = [
    {
        key: 'all',
        labelKey: 'category.type_all',
        descKey: 'category.type_all_desc',
        icon: Layers,
        iconBg: 'bg-zinc-100 dark:bg-zinc-800',
        iconColor: 'text-zinc-600 dark:text-zinc-300',
        accentColor: 'border-zinc-400 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/40',
        queryValue: '',
    },
    {
        key: 'material',
        labelKey: 'category.type_material',
        descKey: 'category.type_material_desc',
        icon: BookOpen,
        iconBg: 'bg-violet-100 dark:bg-violet-900/40',
        iconColor: 'text-violet-700 dark:text-violet-200',
        accentColor: 'border-violet-400 bg-violet-50 dark:border-violet-500 dark:bg-violet-950/40',
        queryValue: 'material',
    },
    {
        key: 'question',
        labelKey: 'category.type_question',
        descKey: 'category.type_question_desc',
        icon: HelpCircle,
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        iconColor: 'text-emerald-600 dark:text-emerald-200',
        accentColor: 'border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40',
        queryValue: 'question',
    },
    {
        key: 'quiz',
        labelKey: 'category.type_quiz',
        descKey: 'category.type_quiz_desc',
        icon: Target,
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        iconColor: 'text-amber-600 dark:text-amber-200',
        accentColor: 'border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/40',
        queryValue: 'quiz',
    },
];

type LanguageTagStyle = {
    active: string;
    inactive: string;
    countActive: string;
    countInactive: string;
};

const DEFAULT_LANGUAGE_STYLE: LanguageTagStyle = {
    active: 'border-zinc-700 bg-zinc-100 text-zinc-900 dark:border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100',
    inactive: 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/70',
    countActive: 'bg-white/25 text-white',
    countInactive: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
};

const LANGUAGE_STYLES: Record<string, LanguageTagStyle> = {
    zh: {
        active: 'border-rose-700 bg-rose-500 text-white dark:border-rose-300 dark:bg-rose-600',
        inactive: 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/70',
        countActive: 'bg-white/25 text-white',
        countInactive: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
    },
    en: {
        active: 'border-blue-700 bg-blue-500 text-white dark:border-blue-300 dark:bg-blue-600',
        inactive: 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/70',
        countActive: 'bg-white/25 text-white',
        countInactive: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
    },
    my: {
        active: 'border-amber-700 bg-amber-400 text-zinc-900 dark:border-amber-300 dark:bg-amber-400',
        inactive: 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/70',
        countActive: 'bg-black/10 text-zinc-900',
        countInactive: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
    },
    bm: {
        active: 'border-amber-700 bg-amber-400 text-zinc-900 dark:border-amber-300 dark:bg-amber-400',
        inactive: 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/70',
        countActive: 'bg-black/10 text-zinc-900',
        countInactive: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
    },
};

function getSubjectIcon(subjectName: string) {
    const lower = subjectName.toLowerCase();
    if (lower.includes('physics')) return Atom;
    if (lower.includes('math')) return Calculator;
    if (lower.includes('chemistry') || lower.includes('biology') || lower.includes('science')) return Microscope;
    return BookOpen;
}

function hasActiveFilters(lang: string, subject: string, type: ContentTypeKey | '') {
    return lang !== '' || subject !== '' || (type !== '' && type !== 'all');
}

function resolveLanguageLabel(language: CategoryLanguage, trans: (key: string) => string) {
    const code = language.code.toLowerCase();
    if (code === 'zh') return trans('category.language_name_zh');
    if (code === 'en') return trans('category.language_name_en');
    if (code === 'my' || code === 'bm') return trans('category.language_name_my');
    return language.name;
}

function resolveSubjectLabel(subjectName: string, trans: (key: string) => string) {
    const key = `subjects.${subjectName}`;
    const translated = trans(key);
    return translated === key ? subjectName : translated;
}

function getLanguageStyle(languageCode: string): LanguageTagStyle {
    return LANGUAGE_STYLES[languageCode.toLowerCase()] ?? DEFAULT_LANGUAGE_STYLE;
}

type FilterTagButtonProps = {
    isSelected: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    count: number;
    style: LanguageTagStyle;
};

function FilterTagButton({ isSelected, onClick, icon: Icon, label, count, style }: FilterTagButtonProps) {
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
            <span className={`rounded px-1 py-0.5 text-[11px] font-semibold ${isSelected ? style.countActive : style.countInactive}`}>
                {count}
            </span>
        </button>
    );
}

type ActionButtonProps = {
    variant: 'secondary' | 'primary';
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    alignRight?: boolean;
};

function ActionButton({ variant, onClick, icon: Icon, label, alignRight = false }: ActionButtonProps) {
    const baseClass =
        variant === 'primary'
            ? 'inline-flex items-center gap-2 rounded-lg bg-[#e27193] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d4607f] disabled:opacity-50'
            : 'inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`${alignRight ? 'ml-auto ' : ''}${baseClass}`}
        >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {label}
        </button>
    );
}

export default function CategoriesPage() {
    const { trans } = reactLang();
    const { props } = usePage<CategoriesPageProps>();

    const languages = props.languages ?? [];
    const subjects = props.subjects ?? [];

    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedType, setSelectedType] = useState<ContentTypeKey | ''>('');

    const totalPosts = useMemo(() => {
        const languageCount = languages.reduce((sum, item) => sum + (item.posts_count ?? 0), 0);
        const subjectCount = subjects.reduce((sum, item) => sum + (item.posts_count ?? 0), 0);
        return Math.max(languageCount, subjectCount);
    }, [languages, subjects]);

    const clearAll = () => {
        setSelectedLanguage('');
        setSelectedSubject('');
        setSelectedType('');
    };

    const goToPosts = (query?: Record<string, string>) => {
        router.visit('/posts', {
            method: 'get',
            data: query,
            preserveScroll: true,
            preserveState: true,
        });
    };

    const applyFilters = () => {
        const activeType = selectedType && selectedType !== 'all'
            ? CONTENT_TYPES.find((t) => t.key === selectedType)?.queryValue ?? ''
            : '';

        goToPosts({
            ...(selectedLanguage ? { language_code: selectedLanguage } : {}),
            ...(selectedSubject ? { subject_id: selectedSubject } : {}),
            ...(activeType ? { post_type: activeType } : {}),
        });
    };

    const isFiltering = hasActiveFilters(selectedLanguage, selectedSubject, selectedType);

    return (
        <>
            <Head title={trans('navigation.categories')} />

            <div className="min-h-screen bg-zinc-50/60 pb-16">
                {/* Page header */}
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
                                <div className="text-lg font-bold leading-none text-zinc-900 dark:text-zinc-100">{totalPosts}</div>
                                <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    {trans('category.total_posts')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 md:px-6">

                    {/* Content Type */}
                    <div>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            {trans('category.content_type')}
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {CONTENT_TYPES.map((type) => {
                                const TypeIcon = type.icon;
                                const isSelected = selectedType === type.key || (type.key === 'all' && selectedType === '');

                                return (
                                    <button
                                        key={type.key}
                                        type="button"
                                        onClick={() => setSelectedType(type.key === 'all' ? '' : type.key)}
                                        className={`relative flex flex-col rounded-xl border-2 p-3.5 text-left transition-all ${
                                            isSelected
                                                ? `${type.accentColor} border-2 shadow-sm`
                                                : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600'
                                        }`}
                                    >
                                        <div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${isSelected ? type.iconBg : 'bg-zinc-100'}`}>
                                            <TypeIcon className={`h-3.5 w-3.5 ${isSelected ? type.iconColor : 'text-zinc-500'}`} />
                                        </div>
                                        <span className="text-xs font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                                            {trans(type.labelKey)}
                                        </span>
                                        <span className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-zinc-400 dark:text-zinc-500">
                                            {trans(type.descKey)}
                                        </span>
                                        {isSelected && (
                                            <CheckCircle2 className={`absolute right-2.5 top-2.5 h-3.5 w-3.5 ${type.iconColor}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Language Tags */}
                    <div>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
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
                                    const style = getLanguageStyle(language.code);

                                    return (
                                        <FilterTagButton
                                            key={language.id}
                                            isSelected={isSelected}
                                            onClick={() => setSelectedLanguage((prev) => (prev === language.code ? '' : language.code))}
                                            icon={Globe}
                                            label={resolveLanguageLabel(language, trans)}
                                            count={language.posts_count}
                                            style={style}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Subject Tags */}
                    <div>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            {trans('category.subject_tags')}
                        </p>
                        {subjects.length === 0 ? (
                            <p className="text-sm text-zinc-400 dark:text-zinc-500">
                                {trans('category.no_subject_tags')}
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {subjects.map((subject) => {
                                    const isSelected = selectedSubject === String(subject.id);
                                    const SubjectIcon = getSubjectIcon(subject.name);
                                    return (
                                        <FilterTagButton
                                            key={subject.id}
                                            isSelected={isSelected}
                                            onClick={() => setSelectedSubject((prev) => (prev === String(subject.id) ? '' : String(subject.id)))}
                                            icon={SubjectIcon}
                                            label={resolveSubjectLabel(subject.name, trans)}
                                            count={subject.posts_count}
                                            style={DEFAULT_LANGUAGE_STYLE}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Action bar */}
                    <div className="flex items-center gap-2 border-t border-zinc-200 pt-4">
                        {isFiltering && (
                            <ActionButton
                                variant="secondary"
                                onClick={clearAll}
                                icon={X}
                                label={trans('category.clear_all')}
                            />
                        )}
                        <ActionButton
                            variant="secondary"
                            onClick={() => goToPosts()}
                            label={trans('category.view_all_posts')}
                        />
                        <ActionButton
                            variant="primary"
                            onClick={applyFilters}
                            icon={Sparkles}
                            label={trans('category.apply_filters')}
                            alignRight
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

function CategoriesPageLayout({ page }: { page: ReactNode }) {
    const { trans } = reactLang();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: trans('navigation.categories'),
            href: categoriesRoute(),
        },
    ];

    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
}

CategoriesPage.layout = (page: ReactNode) => <CategoriesPageLayout page={page} />;

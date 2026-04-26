import {
    Atom,
    BookOpen,
    Calculator,
    HelpCircle,
    Layers,
    Microscope,
    Target,
} from 'lucide-react';
import type {
    CategoryLanguage,
    ContentType,
    ContentTypeKey,
    LanguageTagStyle,
    TransFn,
} from './types';

export const CONTENT_TYPES: ContentType[] = [
    {
        key: 'all',
        labelKey: 'category.type_all',
        descKey: 'category.type_all_desc',
        icon: Layers,
        iconBg: 'bg-zinc-100 dark:bg-zinc-800',
        iconColor: 'text-zinc-600 dark:text-zinc-300',
        accentColor:
            'border-zinc-400 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/40',
        queryValue: '',
    },
    {
        key: 'material',
        labelKey: 'category.type_material',
        descKey: 'category.type_material_desc',
        icon: BookOpen,
        iconBg: 'bg-violet-100 dark:bg-violet-900/40',
        iconColor: 'text-violet-700 dark:text-violet-200',
        accentColor:
            'border-violet-400 bg-violet-50 dark:border-violet-500 dark:bg-violet-950/40',
        queryValue: 'material',
    },
    {
        key: 'question',
        labelKey: 'category.type_question',
        descKey: 'category.type_question_desc',
        icon: HelpCircle,
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        iconColor: 'text-emerald-600 dark:text-emerald-200',
        accentColor:
            'border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40',
        queryValue: 'question',
    },
    {
        key: 'quiz',
        labelKey: 'category.type_quiz',
        descKey: 'category.type_quiz_desc',
        icon: Target,
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        iconColor: 'text-amber-600 dark:text-amber-200',
        accentColor:
            'border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/40',
        queryValue: 'quiz',
    },
];

export const DEFAULT_LANGUAGE_STYLE: LanguageTagStyle = {
    active: 'border-zinc-700 bg-zinc-100 text-zinc-900 dark:border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100',
    inactive:
        'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/70',
    countActive: 'bg-white/25 text-white',
    countInactive:
        'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
};

export const LANGUAGE_STYLES: Record<string, LanguageTagStyle> = {
    zh: {
        active: 'border-rose-700 bg-rose-500 text-white dark:border-rose-300 dark:bg-rose-600',
        inactive:
            'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/70',
        countActive: 'bg-white/25 text-white',
        countInactive:
            'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
    },
    en: {
        active: 'border-blue-700 bg-blue-500 text-white dark:border-blue-300 dark:bg-blue-600',
        inactive:
            'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/70',
        countActive: 'bg-white/25 text-white',
        countInactive:
            'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
    },
    my: {
        active: 'border-amber-700 bg-amber-400 text-zinc-900 dark:border-amber-300 dark:bg-amber-400',
        inactive:
            'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/70',
        countActive: 'bg-black/10 text-zinc-900',
        countInactive:
            'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
    },
    bm: {
        active: 'border-amber-700 bg-amber-400 text-zinc-900 dark:border-amber-300 dark:bg-amber-400',
        inactive:
            'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/70',
        countActive: 'bg-black/10 text-zinc-900',
        countInactive:
            'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
    },
};

export function getSubjectIcon(subjectName: string) {
    const lower = subjectName.toLowerCase();
    if (lower.includes('physics')) return Atom;
    if (lower.includes('math')) return Calculator;
    if (
        lower.includes('chemistry') ||
        lower.includes('biology') ||
        lower.includes('science')
    ) {
        return Microscope;
    }
    return BookOpen;
}

export function hasActiveFilters(
    lang: string,
    subject: string,
    type: ContentTypeKey | '',
) {
    return lang !== '' || subject !== '' || (type !== '' && type !== 'all');
}

export function resolveLanguageLabel(
    language: CategoryLanguage,
    trans: TransFn,
) {
    const code = language.code.toLowerCase();
    if (code === 'zh') return trans('category.language_name_zh');
    if (code === 'en') return trans('category.language_name_en');
    if (code === 'my' || code === 'bm')
        return trans('category.language_name_my');
    return language.name;
}

export function resolveSubjectLabel(subjectName: string, trans: TransFn) {
    const key = `subjects.${subjectName}`;
    const translated = trans(key);
    return translated === key ? subjectName : translated;
}

export function getLanguageStyle(languageCode: string): LanguageTagStyle {
    return (
        LANGUAGE_STYLES[languageCode.toLowerCase()] ?? DEFAULT_LANGUAGE_STYLE
    );
}

export function getLangBadgeProps(code: string) {
    if (code === 'en') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (code === 'zh') return { bg: 'bg-red-100', text: 'text-red-700' };
    if (code === 'bm' || code === 'my')
        return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-gray-200', text: 'text-gray-700' };
}

export function getPostTypeBadgeProps(type: string) {
    if (type === 'quiz') return { bg: 'bg-amber-100', text: 'text-amber-700' };
    if (type === 'question')
        return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    return { bg: 'bg-violet-100', text: 'text-violet-700' };
}

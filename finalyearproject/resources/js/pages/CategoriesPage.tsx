import AppLayout from '@/layouts/app-layout';
import { categories as categoriesRoute, homePage } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { reactLang } from '@erag/lang-sync-inertia';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Atom,
    BookOpen,
    Calculator,
    Folder,
    Globe,
    Languages,
    Microscope,
    Sparkles,
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Categories',
        href: categoriesRoute(),
    },
];

function getSubjectIcon(subjectName: string) {
    const lower = subjectName.toLowerCase();

    if (lower.includes('physics')) return Atom;
    if (lower.includes('math')) return Calculator;
    if (lower.includes('chemistry') || lower.includes('biology') || lower.includes('science')) return Microscope;

    return BookOpen;
}

export default function CategoriesPage() {
    const { trans } = reactLang();
    const { props } = usePage<CategoriesPageProps>();

    const languages = props.languages ?? [];
    const subjects = props.subjects ?? [];

    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');

    const totalPosts = useMemo(() => {
        const languageCount = languages.reduce((sum, item) => sum + (item.posts_count ?? 0), 0);
        const subjectCount = subjects.reduce((sum, item) => sum + (item.posts_count ?? 0), 0);

        return Math.max(languageCount, subjectCount);
    }, [languages, subjects]);

    const applyFilters = () => {
        router.get(
            homePage.url({
                query: {
                    ...(selectedLanguage ? { language_code: selectedLanguage } : {}),
                    ...(selectedSubject ? { subject_id: selectedSubject } : {}),
                },
            })
        );
    };

    return (
        <>
            <Head title={trans('navigation.categories')} />
            <div className="w-full max-w-none p-4 pb-24 md:p-6 md:pb-24">
                <div className="mx-auto w-full max-w-5xl space-y-6">
                    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-zinc-900">{trans('navigation.categories')}</h1>
                                <p className="mt-2 text-zinc-600">
                                    {trans('category.description', 'Choose language or subject tags to view matching posts only.')}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                                {trans('category.total_posts', 'Total posts')}: <span className="font-semibold">{totalPosts}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
                                onClick={() => router.get(homePage.url())}
                            >
                                <Folder className="h-4 w-4" />
                                {trans('category.view_all_posts', 'View all posts')}
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full border border-[#e27193] bg-[#fff0f5] px-4 py-2 text-sm font-semibold text-[#b93c61] transition hover:bg-[#ffe5ef]"
                                onClick={applyFilters}
                            >
                                <Sparkles className="h-4 w-4" />
                                {trans('category.apply_filters', 'Apply filters')}
                            </button>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
                        <div className="mb-4 flex items-center gap-2">
                            <Languages className="h-5 w-5 text-zinc-700" />
                            <h2 className="text-xl font-semibold text-zinc-900">
                                {trans('category.language_tags', 'Language tags')}
                            </h2>
                        </div>

                        {languages.length === 0 ? (
                            <p className="text-sm text-zinc-500">
                                {trans('category.no_language_tags', 'No language tags available yet.')}
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {languages.map((language) => {
                                    const isSelected = selectedLanguage === language.code;

                                    return (
                                        <button
                                            key={language.id}
                                            type="button"
                                            onClick={() => setSelectedLanguage((prev) => (prev === language.code ? '' : language.code))}
                                            className={`rounded-2xl border p-4 text-left transition ${
                                                isSelected
                                                    ? 'border-[#e27193] bg-[#fff0f5]'
                                                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
                                                    <Globe className="h-4 w-4" />
                                                    {language.name}
                                                </div>
                                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                                                    {language.posts_count}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs text-zinc-500">{language.code.toUpperCase()}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
                        <div className="mb-4 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-zinc-700" />
                            <h2 className="text-xl font-semibold text-zinc-900">
                                {trans('category.subject_tags', 'Subject tags')}
                            </h2>
                        </div>

                        {subjects.length === 0 ? (
                            <p className="text-sm text-zinc-500">
                                {trans('category.no_subject_tags', 'No subject tags available yet.')}
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {subjects.map((subject) => {
                                    const isSelected = selectedSubject === String(subject.id);
                                    const SubjectIcon = getSubjectIcon(subject.name);

                                    return (
                                        <button
                                            key={subject.id}
                                            type="button"
                                            onClick={() => setSelectedSubject((prev) => (prev === String(subject.id) ? '' : String(subject.id)))}
                                            className={`rounded-2xl border p-4 text-left transition ${
                                                isSelected
                                                    ? 'border-[#e27193] bg-[#fff0f5]'
                                                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
                                                    <SubjectIcon className="h-4 w-4" />
                                                    {subject.name}
                                                </div>
                                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                                                    {subject.posts_count}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs text-zinc-500">
                                                {trans('category.tap_to_filter', 'Tap to filter posts')}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

CategoriesPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
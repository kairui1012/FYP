import AppLayout from '@/layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BtnComment } from '@/components/ui/btn-comment';
import { BtnFollow } from '@/components/ui/btn-follow';
import { BtnLike } from '@/components/ui/btn-like';
import { BtnSave } from '@/components/ui/btn-save';
import { BtnShare } from '@/components/ui/btn-share';
import { formatFormulaText } from '@/lib/formula-display';
import { formatTimeAgo, getLanguageLabel } from '@/lib/post-utils';
import { categories as categoriesRoute } from '@/routes';
import like from '@/routes/like';
import type { BreadcrumbItem, PostItem } from '@/types';
import { reactLang } from '@erag/lang-sync-inertia';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
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
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';

const PostAttachments = lazy(() => import('@/components/post-attachments').then((m) => ({ default: m.PostAttachments })));

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
    filteredPosts?: PostItem[];
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

function getLangBadgeProps(code: string) {
    if (code === 'en') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (code === 'zh') return { bg: 'bg-red-100', text: 'text-red-700' };
    if (code === 'bm' || code === 'my') return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-gray-200', text: 'text-gray-700' };
}

function getPostTypeBadgeProps(type: string) {
    if (type === 'quiz') return { bg: 'bg-amber-100', text: 'text-amber-700' };
    if (type === 'question') return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    return { bg: 'bg-violet-100', text: 'text-violet-700' };
}

export default function CategoriesPage() {
    const { trans } = reactLang();
    const page = usePage<CategoriesPageProps>();
    const { props } = page;
    const currentUserId = (page.props as { auth?: { user?: { id?: number } } }).auth?.user?.id;

    const languages = props.languages ?? [];
    const subjects = props.subjects ?? [];

    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedType, setSelectedType] = useState<ContentTypeKey | ''>('');

    const [view, setView] = useState<'filters' | 'results'>('filters');
    const [localPosts, setLocalPosts] = useState<PostItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [likingPostIds, setLikingPostIds] = useState<number[]>([]);
    const [savingPostIds, setSavingPostIds] = useState<number[]>([]);
    const [likeStateByPost, setLikeStateByPost] = useState<Record<number, { liked: boolean; likesCount: number }>>({});
    const [saveStateByPost, setSaveStateByPost] = useState<Record<number, { saved: boolean; savesCount: number }>>({});
    const [followStateByUser, setFollowStateByUser] = useState<Record<number, boolean>>({});
    const [followingUserIds, setFollowingUserIds] = useState<number[]>([]);

    useEffect(() => {
        if (props.filteredPosts !== undefined) {
            setLocalPosts(props.filteredPosts);
            setLikeStateByPost({});
            setSaveStateByPost({});
            setView('results');
            setIsLoading(false);
        }
    }, [props.filteredPosts]);

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
        const activeType = selectedType && selectedType !== 'all'
            ? CONTENT_TYPES.find((t) => t.key === selectedType)?.queryValue ?? ''
            : '';
        fetchPosts({
            ...(selectedLanguage ? { language_code: selectedLanguage } : {}),
            ...(selectedSubject ? { subject_id: selectedSubject } : {}),
            ...(activeType ? { post_type: activeType } : {}),
        });
    };

    const handleLike = (postId: number) => {
        if (likingPostIds.includes(postId)) return;
        const previous = likeStateByPost[postId] ?? {
            liked: Boolean(localPosts.find((p) => p.id === postId)?.is_liked),
            likesCount: localPosts.find((p) => p.id === postId)?.likes_count ?? 0,
        };
        const optimisticLiked = !previous.liked;
        const optimisticCount = Math.max(0, previous.likesCount + (optimisticLiked ? 1 : -1));
        setLikingPostIds((prev) => [...prev, postId]);
        setLikeStateByPost((prev) => ({ ...prev, [postId]: { liked: optimisticLiked, likesCount: optimisticCount } }));
        router.post(like.toggle.url({ posts: postId }), {}, {
            preserveScroll: true,
            preserveState: true,
            onError: () => setLikeStateByPost((prev) => ({ ...prev, [postId]: previous })),
            onFinish: () => setLikingPostIds((prev) => prev.filter((id) => id !== postId)),
        });
    };

    const handleSave = async (postId: number) => {
        if (savingPostIds.includes(postId)) return;
        const previous = saveStateByPost[postId] ?? {
            saved: Boolean(localPosts.find((p) => p.id === postId)?.is_saved),
            savesCount: localPosts.find((p) => p.id === postId)?.saves_count ?? 0,
        };
        const optimisticSaved = !previous.saved;
        const optimisticCount = Math.max(0, previous.savesCount + (optimisticSaved ? 1 : -1));
        setSavingPostIds((prev) => [...prev, postId]);
        setSaveStateByPost((prev) => ({ ...prev, [postId]: { saved: optimisticSaved, savesCount: optimisticCount } }));
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const res = await fetch(`/posts/${postId}/save`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) throw new Error();
            const payload = (await res.json()) as { saved: boolean; saves_count: number };
            setSaveStateByPost((prev) => ({ ...prev, [postId]: { saved: payload.saved, savesCount: payload.saves_count } }));
        } catch {
            setSaveStateByPost((prev) => ({ ...prev, [postId]: previous }));
        } finally {
            setSavingPostIds((prev) => prev.filter((id) => id !== postId));
        }
    };

    const handleFollowToggle = async (userId: number) => {
        if (followingUserIds.includes(userId)) return;
        const previous = followStateByUser[userId] ?? false;
        setFollowingUserIds((prev) => [...prev, userId]);
        setFollowStateByUser((prev) => ({ ...prev, [userId]: !previous }));
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const res = await fetch(`/users/${userId}/follow`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) throw new Error();
            const payload = (await res.json()) as { is_following: boolean };
            setFollowStateByUser((prev) => ({ ...prev, [userId]: payload.is_following }));
        } catch {
            setFollowStateByUser((prev) => ({ ...prev, [userId]: previous }));
        } finally {
            setFollowingUserIds((prev) => prev.filter((id) => id !== userId));
        }
    };

    const isFiltering = hasActiveFilters(selectedLanguage, selectedSubject, selectedType);

    const renderPostCard = (post: PostItem) => {
        const likeState = likeStateByPost[post.id] ?? { liked: Boolean(post.is_liked), likesCount: post.likes_count ?? 0 };
        const saveState = saveStateByPost[post.id] ?? { saved: Boolean(post.is_saved), savesCount: post.saves_count ?? 0 };
        const { bg: typeBg, text: typeText } = getPostTypeBadgeProps(post.post_type);
        const typeLabel = post.post_type === 'quiz'
            ? trans('createPost.create_quiz')
            : post.post_type === 'question'
                ? trans('createPost.ask_question')
                : trans('createPost.share_material');
        const langCode = post.language?.code ?? 'en';
        const { bg: langBg, text: langText } = getLangBadgeProps(langCode);

        return (
            <div key={post.id}>
                <article
                    className="cursor-pointer rounded-xl p-5 transition-colors hover:bg-[#F2F4F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 mb-2"
                    onClick={() => router.get(`/posts/${post.id}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.get(`/posts/${post.id}`); } }}
                    role="link"
                    tabIndex={0}
                >
                    <header className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <Link
                                href={post.user?.id ? `/profilePage/${post.user.id}` : '/profilePage'}
                                className="peer group/avatar cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Avatar className="h-10 w-10 ring-2 ring-transparent transition-colors group-hover/avatar:ring-[#ef99b0]">
                                    {post.user?.avatar && <AvatarImage src={post.user.avatar} alt={post.user?.name ?? 'User avatar'} />}
                                    <AvatarFallback className="bg-zinc-200 text-sm font-semibold text-zinc-700">
                                        {(post.user?.name ?? 'U').charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="min-w-0 flex-1">
                                <div className="mb-3 flex items-center gap-1.5 text-base">
                                    <Link
                                        href={post.user?.id ? `/profilePage/${post.user.id}` : '/profilePage'}
                                        className="cursor-pointer font-semibold text-zinc-900 transition-colors hover:text-[#de6b89] peer-hover:text-[#de6b89]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {post.user?.name ?? 'Unknown User'}
                                    </Link>
                                    {post.user?.id && currentUserId && post.user.id !== currentUserId && (
                                        <BtnFollow
                                            following={followStateByUser[post.user.id] ?? Boolean(post.user.is_following)}
                                            loading={followingUserIds.includes(post.user.id)}
                                            onClick={() => handleFollowToggle(post.user!.id)}
                                        />
                                    )}
                                    <span className="text-zinc-400">•</span>
                                    <span className="text-sm text-zinc-500">{formatTimeAgo(post.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                                    <span className={`rounded-full px-2 py-0.5 font-medium ${typeBg} ${typeText}`}>{typeLabel}</span>
                                    <span className={`rounded-full px-2 py-0.5 font-medium ${langBg} ${langText}`}>
                                        {post.language?.name ?? getLanguageLabel(langCode)}
                                    </span>
                                    {post.subject?.name && (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">{post.subject.name}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    <h2 className="mb-2 text-lg font-bold text-zinc-900">{post.title}</h2>
                    <p className="mb-2 text-base font-medium leading-6 whitespace-pre-wrap text-zinc-700">
                        {formatFormulaText(post.content ?? '')}
                    </p>
                    <Suspense fallback={<div className="h-48 rounded-xl bg-zinc-100" />}>
                        <PostAttachments files={post.image} compact />
                    </Suspense>
                </article>

                <div className="mt-2 flex items-center gap-3 text-sm text-zinc-900 px-5">
                    <BtnLike
                        count={likeState.likesCount}
                        liked={likeState.liked}
                        loading={likingPostIds.includes(post.id)}
                        className="mb-2"
                        onClick={() => handleLike(post.id)}
                    />
                    <BtnComment
                        count={post.comments_count ?? 0}
                        className="mb-2"
                        onClick={() => router.visit(`/posts/${post.id}?focus=comments`)}
                    />
                    <BtnSave
                        count={saveState.savesCount}
                        saved={saveState.saved}
                        loading={savingPostIds.includes(post.id)}
                        onClick={() => handleSave(post.id)}
                    />
                    <BtnShare className="mb-2" />
                </div>
                <div className="w-full border-t border-zinc-200 mt-1" />
            </div>
        );
    };

    if (view === 'results') {
        return (
            <>
                <Head title={trans('navigation.categories')} />
                <div className="min-h-screen bg-zinc-50/60 pb-16">
                    {/* Results header */}
                    <div className="border-b border-zinc-200 bg-white px-4 py-4 md:px-6">
                        <div className="mx-auto max-w-4xl flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setView('filters')}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                {trans('navigation.categories')}
                            </button>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedLanguage && (
                                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                        {languages.find((l) => l.code === selectedLanguage)?.name ?? selectedLanguage}
                                    </span>
                                )}
                                {selectedSubject && (
                                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                        {resolveSubjectLabel(subjects.find((s) => String(s.id) === selectedSubject)?.name ?? '', trans)}
                                    </span>
                                )}
                                {selectedType && selectedType !== 'all' && (
                                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                        {trans(CONTENT_TYPES.find((t) => t.key === selectedType)?.labelKey ?? '')}
                                    </span>
                                )}
                            </div>
                            {!isLoading && (
                                <span className="ml-auto text-xs text-zinc-400">{localPosts.length} {trans('category.total_posts')}</span>
                            )}
                        </div>
                    </div>

                    {/* Post list */}
                    <div className="mx-auto max-w-4xl px-4 py-4 md:px-6">
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="animate-pulse rounded-xl bg-zinc-100 p-5 h-32" />
                                ))}
                            </div>
                        ) : localPosts.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center text-zinc-500">
                                <p className="text-sm">{trans('popular.no_posts') || 'No posts found.'}</p>
                            </div>
                        ) : (
                            <div className="space-y-0">
                                {localPosts.map(renderPostCard)}
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    }

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
                            onClick={() => fetchPosts()}
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

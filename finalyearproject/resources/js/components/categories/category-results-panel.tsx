import { ArrowLeft } from 'lucide-react';
import type { PostItem } from '@/types';
import { CONTENT_TYPES, resolveSubjectLabel } from './categories-config';
import { CategoryPostCard } from './category-post-card';
import type {
    CategoryLanguage,
    CategorySubject,
    ContentTypeKey,
    TransFn,
} from './types';

type CategoryResultsPanelProps = {
    languages: CategoryLanguage[];
    subjects: CategorySubject[];
    posts: PostItem[];
    selectedLanguage: string;
    selectedSubject: string;
    selectedType: ContentTypeKey | '';
    isLoading: boolean;
    currentUserId?: number;
    likingPostIds: number[];
    savingPostIds: number[];
    followingUserIds: number[];
    likeStateByPost: Record<number, { liked: boolean; likesCount: number }>;
    saveStateByPost: Record<number, { saved: boolean; savesCount: number }>;
    followStateByUser: Record<number, boolean>;
    trans: TransFn;
    onBackToFilters: () => void;
    onLike: (postId: number) => void;
    onSave: (postId: number) => void;
    onFollowToggle: (userId: number) => void;
};

export function CategoryResultsPanel({
    languages,
    subjects,
    posts,
    selectedLanguage,
    selectedSubject,
    selectedType,
    isLoading,
    currentUserId,
    likingPostIds,
    savingPostIds,
    followingUserIds,
    likeStateByPost,
    saveStateByPost,
    followStateByUser,
    trans,
    onBackToFilters,
    onLike,
    onSave,
    onFollowToggle,
}: CategoryResultsPanelProps) {
    return (
        <div className="min-h-[calc(100dvh-4rem)] bg-zinc-50/60 pb-28">
            <div className="border-b border-zinc-200 bg-white px-4 py-4 md:px-6">
                <div className="mx-auto flex max-w-4xl items-center gap-3">
                    <button
                        type="button"
                        onClick={onBackToFilters}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        {trans('navigation.categories')}
                    </button>
                    <ActiveFilterChips
                        languages={languages}
                        subjects={subjects}
                        selectedLanguage={selectedLanguage}
                        selectedSubject={selectedSubject}
                        selectedType={selectedType}
                        trans={trans}
                    />
                    {!isLoading && (
                        <span className="ml-auto text-xs text-zinc-400">
                            {posts.length} {trans('category.total_posts')}
                        </span>
                    )}
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-4 py-4 md:px-6">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <div
                                key={item}
                                className="h-32 animate-pulse rounded-xl bg-zinc-100 p-5"
                            />
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center text-zinc-500">
                        <p className="text-sm">
                            {trans('popular.no_posts') || 'No posts found.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-0">
                        {posts.map((post) => {
                            const likeState = likeStateByPost[post.id] ?? {
                                liked: Boolean(post.is_liked),
                                likesCount: post.likes_count ?? 0,
                            };
                            const saveState = saveStateByPost[post.id] ?? {
                                saved: Boolean(post.is_saved),
                                savesCount: post.saves_count ?? 0,
                            };
                            const userId = post.user?.id;

                            return (
                                <CategoryPostCard
                                    key={post.id}
                                    post={post}
                                    currentUserId={currentUserId}
                                    liked={likeState.liked}
                                    likesCount={likeState.likesCount}
                                    saved={saveState.saved}
                                    savesCount={saveState.savesCount}
                                    likeLoading={likingPostIds.includes(
                                        post.id,
                                    )}
                                    saveLoading={savingPostIds.includes(
                                        post.id,
                                    )}
                                    following={
                                        userId
                                            ? (followStateByUser[userId] ??
                                              Boolean(post.user?.is_following))
                                            : false
                                    }
                                    followLoading={
                                        userId
                                            ? followingUserIds.includes(userId)
                                            : false
                                    }
                                    trans={trans}
                                    onLike={onLike}
                                    onSave={onSave}
                                    onFollowToggle={onFollowToggle}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

type ActiveFilterChipsProps = {
    languages: CategoryLanguage[];
    subjects: CategorySubject[];
    selectedLanguage: string;
    selectedSubject: string;
    selectedType: ContentTypeKey | '';
    trans: TransFn;
};

function ActiveFilterChips({
    languages,
    subjects,
    selectedLanguage,
    selectedSubject,
    selectedType,
    trans,
}: ActiveFilterChipsProps) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {selectedLanguage && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {languages.find((l) => l.code === selectedLanguage)?.name ??
                        selectedLanguage}
                </span>
            )}
            {selectedSubject && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {resolveSubjectLabel(
                        subjects.find((s) => String(s.id) === selectedSubject)
                            ?.name ?? '',
                        trans,
                    )}
                </span>
            )}
            {selectedType && selectedType !== 'all' && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {trans(
                        CONTENT_TYPES.find((t) => t.key === selectedType)
                            ?.labelKey ?? '',
                    )}
                </span>
            )}
        </div>
    );
}

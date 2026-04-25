import { reactLang } from '@erag/lang-sync-inertia';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Award,
    Check,
    Crown,
    MessageCircle,
    Settings2,
    Sparkles,
    Star,
    ThumbsUp,
    Trophy,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BtnAiTranslate } from '@/components/ui/btn-ai-translate';
import { BtnFollow } from '@/components/ui/btn-follow';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import {
    getTranslatedBadgeDescription,
    getTranslatedBadgeName,
} from '@/lib/badge-translations';
import { formatTimeAgo } from '@/lib/post-utils';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

type Badge = {
    id: number;
    key: string;
    name: string;
    description: string;
    icon?: string | null;
    points_required: number;
    awarded_at?: string | null;
};

type ProfileUser = {
    id: number;
    name: string;
    email?: string | null;
    avatar?: string | null;
    is_following?: boolean;
    points?: number;
    badges?: Badge[];
    featured_badge_ids?: number[];
    followers_count?: number;
    following_count?: number;
};

type ProfilePost = {
    id: number;
    title: string;
    content: string;
    image?: string[] | null;
    created_at: string;
    likes_count?: number;
    comments_count?: number;
    language?: { code: string; name: string } | null;
};

type PageProps = {
    profileUser: ProfileUser;
    posts: ProfilePost[];
};

// ── Icon helpers ───────────────────────────────────────────────────────────────

const badgeIconMap = {
    Sparkles,
    Star,
    Trophy,
    Crown,
    Award,
} as const;

function BadgeIcon({
    iconKey,
    className,
}: {
    iconKey?: string | null;
    className?: string;
}) {
    const Icon =
        iconKey && iconKey in badgeIconMap
            ? badgeIconMap[iconKey as keyof typeof badgeIconMap]
            : Trophy;
    return <Icon className={className} />;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FeaturedBadgeChip({ badge }: { badge: Badge }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const { trans } = reactLang();

    return (
        <span
            className="relative inline-flex cursor-default items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 transition hover:border-amber-300 hover:bg-amber-100"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <BadgeIcon
                iconKey={badge.icon}
                className="h-3 w-3 text-amber-600"
            />
            <span>{getTranslatedBadgeName(trans, badge)}</span>
            {showTooltip && (
                <span className="absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-48 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 shadow-md">
                    {getTranslatedBadgeDescription(trans, badge)}
                </span>
            )}
        </span>
    );
}

function BadgeSelectChip({
    badge,
    selected,
    disabled,
    onToggle,
}: {
    badge: Badge;
    selected: boolean;
    disabled: boolean;
    onToggle: () => void;
}) {
    const { trans } = reactLang();

    return (
        <button
            type="button"
            disabled={disabled && !selected}
            onClick={onToggle}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                selected
                    ? 'border-[#e27193] bg-[#fff0f5] text-[#b93c61] hover:bg-[#ffd9e4]'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50',
                disabled && !selected && 'cursor-not-allowed opacity-40',
            )}
        >
            {selected && <Check className="h-3 w-3 shrink-0" />}
            <BadgeIcon iconKey={badge.icon} className="h-3 w-3 shrink-0" />
            <span>{getTranslatedBadgeName(trans, badge)}</span>
        </button>
    );
}

function StatCard({
    label,
    value,
    accent,
}: {
    label: string;
    value: number | string;
    accent?: string;
}) {
    return (
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-center">
            <span
                className={cn('text-xl font-bold', accent ?? 'text-zinc-900')}
            >
                {value}
            </span>
            <span className="mt-0.5 text-xs text-zinc-500">{label}</span>
        </div>
    );
}

// Shared gradient class that mirrors btn-create-post exactly (minus nav-specific layout classes)
const primaryBtnClass =
    'rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] text-white transition-all duration-200 hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black hover:shadow-[0_4px_12px_rgba(227,106,139,0.3)] focus-visible:border-[#d85380] focus-visible:ring-[#e36a8b]/35 dark:border-[#ef99b0] dark:from-[#ef99b0] dark:to-[#e27193] dark:text-white dark:hover:border-[#d85380] dark:hover:from-[#f5c4d6] dark:hover:to-[#f39db8] dark:hover:text-black';

// ── Main page ──────────────────────────────────────────────────────────────────

const MAX_FEATURED = 3;

export default function ProfilePage() {
    const { trans } = reactLang();
    const { profileUser, posts = [] } = usePage<PageProps>().props;

    const t = {
        pageTitle: trans('profile.page_title'),
        defaultUserName: trans('profile.default_user_name'),
        contact: trans('profile.contact'),
        noEmailSharedYet: trans('profile.no_email_shared_yet'),
        posts: trans('profile.posts'),
        postSingle: trans('profile.post_single'),
        postPlural: trans('profile.post_plural'),
        noPostsYet: trans('profile.no_posts_yet'),
        likes: trans('profile.likes'),
        comments: trans('profile.comments'),
        attachmentSingle: trans('profile.attachment_single'),
        attachmentPlural: trans('profile.attachment_plural'),
        points: trans('profile.points'),
        badges: trans('profile.badges'),
        noBadgesYet: trans('profile.no_badges_yet'),
    };

    const displayName = profileUser.name?.trim() || t.defaultUserName;
    const firstLetter = displayName.charAt(0).toUpperCase();
    const currentUserId = usePage<{
        auth?: { user?: { id?: number } };
    }>().props.auth?.user?.id;
    const isOwnProfile = currentUserId === profileUser.id;

    const [activeTab, setActiveTab] = useState<'posts' | 'badges'>('posts');
    const [showBadgeEditor, setShowBadgeEditor] = useState(false);
    const [featuredBadgeIds, setFeaturedBadgeIds] = useState<number[]>(
        profileUser.featured_badge_ids ?? [],
    );
    const [savingBadges, setSavingBadges] = useState(false);
    const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
    const [isFollowing, setIsFollowing] = useState(
        Boolean(profileUser.is_following),
    );
    const [followLoading, setFollowLoading] = useState(false);
    const [translatedAbout, setTranslatedAbout] = useState<{
        title: string;
        content: string;
    } | null>(null);

    const aboutBadgeLabel = trans('profile.about_of').replace(
        ':name',
        displayName,
    );
    const defaultAboutMain = isOwnProfile
        ? trans('profile.about_self_intro')
        : trans('profile.about_other_intro').replace(':name', displayName);
    const defaultAboutTip = isOwnProfile
        ? trans('profile.about_self_tip')
        : trans('profile.about_other_tip');
    const defaultAboutContent = `${defaultAboutMain}\n\n${defaultAboutTip}`;
    const aboutMainText = (translatedAbout?.content ?? defaultAboutContent)
        .split(/\n{2,}/)[0]
        ?.trim();

    const featuredBadges = (profileUser.badges ?? []).filter((b) =>
        featuredBadgeIds.includes(b.id),
    );
    const earnedBadges = profileUser.badges ?? [];

    useEffect(() => {
        setAvatarLoadFailed(false);
    }, [profileUser.avatar]);

    useEffect(() => {
        setIsFollowing(Boolean(profileUser.is_following));
    }, [profileUser.is_following]);

    const handleFollowToggle = async () => {
        if (
            !profileUser.id ||
            !currentUserId ||
            currentUserId === profileUser.id ||
            followLoading
        )
            return;

        const previous = isFollowing;
        setFollowLoading(true);
        setIsFollowing(!previous);

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';

        try {
            const response = await fetch(`/users/${profileUser.id}/follow`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!response.ok) throw new Error('Follow toggle failed.');
            const payload = (await response.json()) as {
                is_following: boolean;
            };
            setIsFollowing(payload.is_following);
        } catch {
            setIsFollowing(previous);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleBadgeToggle = (badgeId: number) => {
        setFeaturedBadgeIds((prev) => {
            if (prev.includes(badgeId))
                return prev.filter((id) => id !== badgeId);
            if (prev.length >= MAX_FEATURED) return prev;
            return [...prev, badgeId];
        });
    };

    const handleSaveFeaturedBadges = async () => {
        setSavingBadges(true);
        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';
        try {
            await fetch(`/users/${profileUser.id}/featured-badges`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ badge_ids: featuredBadgeIds }),
            });
            setShowBadgeEditor(false);
        } finally {
            setSavingBadges(false);
        }
    };

    return (
        <>
            <Head title={`${t.pageTitle} - ${displayName}`} />

            {/*
             * pt-6/pt-8 prevents top-clipping under the fixed header.
             * pb-24 ensures the last tab content is never hidden behind
             * any fixed bottom chrome and gives comfortable scroll clearance.
             */}
            <div className="mx-auto w-full max-w-4xl space-y-5 px-4 pt-6 pb-24 md:px-6 md:pt-8">
                {/* ── Profile header — open layout, NO card wrapper ────────── */}
                <section className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    {/*
                     * Avatar lives outside any card or bordered container.
                     * The circular clip + subtle ring is kept on the image
                     * itself so it reads as an avatar, not a boxed component.
                     */}
                    <div className="shrink-0">
                        {profileUser.avatar && !avatarLoadFailed ? (
                            <div className="h-20 w-20 overflow-hidden rounded-full ring-2 ring-zinc-200 md:h-24 md:w-24">
                                <img
                                    src={profileUser.avatar}
                                    alt={displayName}
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={() => setAvatarLoadFailed(true)}
                                />
                            </div>
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 text-2xl font-bold text-zinc-600 ring-2 ring-zinc-200 md:h-24 md:w-24">
                                {firstLetter}
                            </div>
                        )}
                    </div>

                    {/* Name + handle + badges + bio */}
                    <div className="min-w-0 flex-1">
                        {/* Name + follow */}
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
                                {displayName}
                            </h1>
                            {!isOwnProfile &&
                                currentUserId &&
                                currentUserId !== profileUser.id && (
                                    <BtnFollow
                                        following={isFollowing}
                                        loading={followLoading}
                                        onClick={() => {
                                            void handleFollowToggle();
                                        }}
                                    />
                                )}
                        </div>

                        {/* Handle */}
                        <p className="mt-0.5 text-sm text-zinc-500">
                            @user-{profileUser.id}
                        </p>

                        {/* Featured badge chips */}
                        {featuredBadges.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {featuredBadges.map((badge) => (
                                    <FeaturedBadgeChip
                                        key={badge.id}
                                        badge={badge}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Bio */}
                        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                            {aboutMainText}
                        </p>

                        {/* AI translate (other profiles) */}
                        {!isOwnProfile && (
                            <div className="mt-3">
                                <BtnAiTranslate
                                    title={aboutBadgeLabel}
                                    content={defaultAboutContent}
                                    onTranslate={setTranslatedAbout}
                                />
                            </div>
                        )}

                        {/* Edit displayed badges toggle (own profile) */}
                        {isOwnProfile && earnedBadges.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowBadgeEditor((v) => !v)}
                                className="mt-4 rounded-full"
                            >
                                <Settings2 className="h-3.5 w-3.5" />
                                {showBadgeEditor
                                    ? 'Close badge editor'
                                    : 'Edit displayed badges'}
                            </Button>
                        )}
                    </div>
                </section>

                {/* ── Badge editor panel ───────────────────────────────────── */}
                {showBadgeEditor && isOwnProfile && earnedBadges.length > 0 && (
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-zinc-900">
                                    Choose featured badges
                                </p>
                                <p className="mt-0.5 text-xs text-zinc-500">
                                    Select up to {MAX_FEATURED} badges to
                                    display on your profile.{' '}
                                    <span className="font-medium text-zinc-700">
                                        {featuredBadgeIds.length}/{MAX_FEATURED}{' '}
                                        selected
                                    </span>
                                </p>
                            </div>
                            {/* Save — matches btn-create-post gradient exactly */}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={savingBadges}
                                onClick={() => {
                                    void handleSaveFeaturedBadges();
                                }}
                                className={primaryBtnClass}
                            >
                                {savingBadges ? 'Saving…' : 'Save'}
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {earnedBadges.map((badge) => (
                                <BadgeSelectChip
                                    key={badge.id}
                                    badge={badge}
                                    selected={featuredBadgeIds.includes(
                                        badge.id,
                                    )}
                                    disabled={
                                        featuredBadgeIds.length >= MAX_FEATURED
                                    }
                                    onToggle={() => handleBadgeToggle(badge.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Stats row ────────────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                    <StatCard label={t.posts} value={posts.length} />
                    <StatCard
                        label={t.points}
                        value={profileUser.points ?? 0}
                        accent="text-amber-600"
                    />
                    <StatCard
                        label={t.badges}
                        value={earnedBadges.length}
                        accent="text-[#de6b89]"
                    />
                </div>

                {/* ── Tab bar ─────────────────────────────────────────────── */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('posts')}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                            activeTab === 'posts'
                                ? 'border-[#e27193] bg-[#fff0f5] text-[#b93c61]'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50',
                        )}
                    >
                        {t.posts}
                        <span
                            className={cn(
                                'rounded-full px-1.5 py-0.5 text-xs',
                                activeTab === 'posts'
                                    ? 'bg-[#ffd9e4] text-[#b93c61]'
                                    : 'bg-zinc-100 text-zinc-500',
                            )}
                        >
                            {posts.length}
                        </span>
                    </button>

                    {earnedBadges.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('badges')}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                                activeTab === 'badges'
                                    ? 'border-[#e27193] bg-[#fff0f5] text-[#b93c61]'
                                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50',
                            )}
                        >
                            {t.badges}
                            <span
                                className={cn(
                                    'rounded-full px-1.5 py-0.5 text-xs',
                                    activeTab === 'badges'
                                        ? 'bg-[#ffd9e4] text-[#b93c61]'
                                        : 'bg-zinc-100 text-zinc-500',
                                )}
                            >
                                {earnedBadges.length}
                            </span>
                        </button>
                    )}
                </div>

                {/* ── Posts tab ────────────────────────────────────────────── */}
                {activeTab === 'posts' && (
                    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
                        {posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <p className="text-3xl">✍️</p>
                                <p className="mt-3 text-sm text-zinc-500">
                                    {t.noPostsYet}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {posts.map((post) => (
                                    <article
                                        key={post.id}
                                        className="group p-5 transition hover:bg-zinc-50/70"
                                    >
                                        <Link
                                            href={`/posts/${post.id}`}
                                            className="block"
                                        >
                                            {/* Meta row */}
                                            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                                <span>
                                                    {formatTimeAgo(
                                                        post.created_at,
                                                    )}
                                                </span>
                                                <span>·</span>
                                                <span className="inline-flex items-center gap-1">
                                                    <ThumbsUp className="h-3 w-3" />
                                                    {post.likes_count ?? 0}{' '}
                                                    {t.likes}
                                                </span>
                                                <span>·</span>
                                                <span className="inline-flex items-center gap-1">
                                                    <MessageCircle className="h-3 w-3" />
                                                    {post.comments_count ?? 0}{' '}
                                                    {t.comments}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-base font-semibold text-zinc-900 transition group-hover:text-[#de6b89]">
                                                {post.title}
                                            </h3>

                                            {/* Excerpt */}
                                            <p
                                                className="mt-2 border-l-2 border-rose-200 pl-3 text-sm leading-6 whitespace-pre-wrap text-zinc-600"
                                                style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {post.content}
                                            </p>

                                            {/* Attachment count */}
                                            {post.image &&
                                                post.image.length > 0 && (
                                                    <p className="mt-2 text-xs text-zinc-400">
                                                        {post.image.length}{' '}
                                                        {post.image.length > 1
                                                            ? t.attachmentPlural
                                                            : t.attachmentSingle}
                                                    </p>
                                                )}
                                        </Link>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* ── Badges tab ────────────────────────────────────────────── */}
                {activeTab === 'badges' && (
                    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        {earnedBadges.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Trophy className="mb-3 h-10 w-10 text-zinc-300" />
                                <p className="text-sm text-zinc-500">
                                    {t.noBadgesYet}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {earnedBadges.map((badge) => {
                                    const isFeatured =
                                        featuredBadgeIds.includes(badge.id);
                                    return (
                                        <article
                                            key={badge.id}
                                            className={cn(
                                                'relative rounded-xl border p-4 transition',
                                                isFeatured
                                                    ? 'border-amber-200 bg-amber-50'
                                                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300',
                                            )}
                                        >
                                            {isFeatured && (
                                                <span className="absolute top-3 right-3 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                                                    Featured
                                                </span>
                                            )}
                                            <div className="mb-2 flex items-center gap-2">
                                                <BadgeIcon
                                                    iconKey={badge.icon}
                                                    className={cn(
                                                        'h-5 w-5',
                                                        isFeatured
                                                            ? 'text-amber-600'
                                                            : 'text-zinc-500',
                                                    )}
                                                />
                                                <p className="font-semibold text-zinc-900">
                                                    {getTranslatedBadgeName(
                                                        trans,
                                                        badge,
                                                    )}
                                                </p>
                                            </div>
                                            <p className="text-xs leading-relaxed text-zinc-600">
                                                {getTranslatedBadgeDescription(
                                                    trans,
                                                    badge,
                                                )}
                                            </p>
                                            <p className="mt-2 text-xs text-zinc-400">
                                                {badge.points_required}{' '}
                                                {t.points}
                                            </p>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </>
    );
}

ProfilePage.layout = (page: ReactNode) => <AppLayout children={page} />;

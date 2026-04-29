import { reactLang } from '@erag/lang-sync-inertia';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    Camera,
    Check,
    Crown,
    FileText,
    MessageCircle,
    Pencil,
    Settings2,
    Sparkles,
    Star,
    ThumbsUp,
    Trophy,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { LeaderboardTitleBadge } from '@/components/LeaderboardTitleBadge';
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
import { homePage } from '@/routes';

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
    about?: string | null;
    leaderboard_title?: string | null;
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
            className="relative inline-flex cursor-default items-center gap-1.5 rounded-full border border-amber-300 bg-linear-to-r from-amber-50 to-yellow-50 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-sm transition hover:border-amber-400 hover:shadow-amber-100 dark:border-amber-700 dark:from-amber-950/40 dark:to-yellow-950/30 dark:text-amber-300"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <BadgeIcon
                iconKey={badge.icon}
                className="h-3 w-3 text-amber-600 dark:text-amber-400"
            />
            <span>{getTranslatedBadgeName(trans, badge)}</span>
            {showTooltip && (
                <span className="absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-52 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
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
                    ? 'border-amber-300 bg-linear-to-r from-amber-50 to-yellow-50 text-amber-800 shadow-sm hover:border-amber-400 dark:border-amber-700 dark:from-amber-950/40 dark:text-amber-300'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
                disabled && !selected && 'cursor-not-allowed opacity-40',
            )}
        >
            {selected && <Check className="h-3 w-3 shrink-0 text-amber-600" />}
            <BadgeIcon
                iconKey={badge.icon}
                className={cn(
                    'h-3 w-3 shrink-0',
                    selected
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-zinc-500',
                )}
            />
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
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <span
                className={cn(
                    'text-xl font-bold',
                    accent ?? 'text-zinc-900 dark:text-zinc-100',
                )}
            >
                {value}
            </span>
            <span className="mt-0.5 text-xs text-zinc-500">{label}</span>
        </div>
    );
}

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
        followers: trans('profile.followers'),
        noBadgesYet: trans('profile.no_badges_yet'),
    };

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
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
    const [displayProfile, setDisplayProfile] = useState({
        name: profileUser.name,
        avatar: profileUser.avatar ?? null,
        about: profileUser.about ?? null,
    });
    const [isFollowing, setIsFollowing] = useState(
        Boolean(profileUser.is_following),
    );
    const [followersCount, setFollowersCount] = useState(
        profileUser.followers_count ?? 0,
    );
    const [followLoading, setFollowLoading] = useState(false);
    const [showProfileEditor, setShowProfileEditor] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSaveError, setProfileSaveError] = useState<string | null>(
        null,
    );
    const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
    const [profileNameInput, setProfileNameInput] = useState(profileUser.name);
    const [profileAboutInput, setProfileAboutInput] = useState(
        profileUser.about ?? '',
    );
    const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(
        null,
    );
    const [profileAvatarPreview, setProfileAvatarPreview] = useState<
        string | null
    >(null);
    const [translatedAbout, setTranslatedAbout] = useState<{
        title: string;
        content: string;
    } | null>(null);

    const displayName = displayProfile.name?.trim() || t.defaultUserName;
    const firstLetter = displayName.charAt(0).toUpperCase();
    const currentAvatar = displayProfile.avatar;
    const currentAbout = displayProfile.about?.trim() || null;
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
    const defaultAboutContent = currentAbout
        ? currentAbout
        : `${defaultAboutMain}\n\n${defaultAboutTip}`;
    const aboutContent = translatedAbout?.content ?? defaultAboutContent;
    const aboutMainText = currentAbout
        ? aboutContent.trim()
        : aboutContent.split(/\n{2,}/)[0]?.trim();

    const featuredBadges = (profileUser.badges ?? []).filter((b) =>
        featuredBadgeIds.includes(b.id),
    );
    const earnedBadges = profileUser.badges ?? [];

    useEffect(() => {
        setAvatarLoadFailed(false);
        setDisplayProfile({
            name: profileUser.name,
            avatar: profileUser.avatar ?? null,
            about: profileUser.about ?? null,
        });
        setProfileNameInput(profileUser.name);
        setProfileAboutInput(profileUser.about ?? '');
        setProfileAvatarFile(null);
        setProfileAvatarPreview(null);
    }, [profileUser.avatar, profileUser.name, profileUser.about]);
    useEffect(() => {
        if (!followLoading) setIsFollowing(Boolean(profileUser.is_following));
    }, [profileUser.is_following]);
    useEffect(() => {
        if (!followLoading) setFollowersCount(profileUser.followers_count ?? 0);
    }, [profileUser.followers_count]);

    useEffect(() => {
        if (!profileAvatarFile) {
            setProfileAvatarPreview(null);
            return;
        }

        const nextPreviewUrl = URL.createObjectURL(profileAvatarFile);
        setProfileAvatarPreview(nextPreviewUrl);

        return () => URL.revokeObjectURL(nextPreviewUrl);
    }, [profileAvatarFile]);

    const handleFollowToggle = async () => {
        if (
            !profileUser.id ||
            !currentUserId ||
            currentUserId === profileUser.id ||
            followLoading
        )
            return;
        const previous = isFollowing;
        const optimistic = !previous;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        setFollowLoading(true);
        setIsFollowing(optimistic);
        setFollowersCount((count) =>
            Math.max(0, count + (optimistic ? 1 : -1)),
        );
        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';
        try {
            const response = await fetch(`/users/${profileUser.id}/follow`, {
                method: 'POST',
                signal: controller.signal,
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
            if (payload.is_following !== optimistic) {
                setFollowersCount((count) =>
                    Math.max(0, count + (payload.is_following ? 1 : -1)),
                );
            }
            sessionStorage.setItem('followingPageDirty', '1');
        } catch {
            setIsFollowing(previous);
            setFollowersCount((count) =>
                Math.max(0, count + (previous ? 1 : -1)),
            );
        } finally {
            clearTimeout(timeout);
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
            setSaveSuccess(true);
            setShowBadgeEditor(false);
            setTimeout(() => setSaveSuccess(false), 3000);
        } finally {
            setSavingBadges(false);
        }
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        router.visit(homePage().url);
    };

    const handleOpenProfileEditor = () => {
        setProfileNameInput(displayName);
        setProfileAboutInput(currentAbout ?? '');
        setProfileAvatarFile(null);
        setProfileSaveError(null);
        setProfileSaveSuccess(false);
        setShowProfileEditor(true);
    };

    const handleSaveProfile = async () => {
        const nextName = profileNameInput.trim();

        if (!nextName) {
            setProfileSaveError(trans('profile.name_required'));
            return;
        }

        setProfileSaving(true);
        setProfileSaveError(null);

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';
        const formData = new FormData();
        formData.append('name', nextName);
        formData.append('about', profileAboutInput.trim());

        if (profileAvatarFile) {
            formData.append('avatar', profileAvatarFile);
        }

        try {
            const response = await fetch('/profilePage', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Profile update failed.');
            }

            const payload = (await response.json()) as {
                profileUser: {
                    name: string;
                    avatar: string | null;
                    about: string | null;
                };
            };
            setDisplayProfile({
                name: payload.profileUser.name,
                avatar: payload.profileUser.avatar ?? currentAvatar,
                about: payload.profileUser.about,
            });
            setTranslatedAbout(null);
            setAvatarLoadFailed(false);
            setProfileAvatarFile(null);
            setShowProfileEditor(false);
            setProfileSaveSuccess(true);
            setTimeout(() => setProfileSaveSuccess(false), 3000);
        } catch {
            setProfileSaveError(trans('profile.save_failed'));
        } finally {
            setProfileSaving(false);
        }
    };

    return (
        <>
            <Head title={`${t.pageTitle} - ${displayName}`} />

            <div className="mx-auto w-full max-w-4xl space-y-5 px-4 pt-6 pb-24 md:px-6 md:pt-8">
                <button
                    type="button"
                    aria-label="Back"
                    onClick={handleBack}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-sidebar-border bg-background from-[#ef99b0] to-[#e27193] text-foreground transition hover:border-2 hover:border-[#e27193] hover:bg-linear-to-r hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e27193]/40"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>

                {/* ── Profile header ────────────────────────────────────────── */}
                <section className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="shrink-0">
                        {currentAvatar && !avatarLoadFailed ? (
                            <div className="h-20 w-20 overflow-hidden rounded-full ring-2 ring-zinc-200 md:h-24 md:w-24 dark:ring-zinc-700">
                                <img
                                    src={currentAvatar}
                                    alt={displayName}
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={() => setAvatarLoadFailed(true)}
                                />
                            </div>
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 text-2xl font-bold text-zinc-600 ring-2 ring-zinc-200 md:h-24 md:w-24 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                                {firstLetter}
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-100">
                                {displayName}
                            </h1>
                            <LeaderboardTitleBadge
                                title={profileUser.leaderboard_title}
                            />
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

                        {/* Empty state: own profile, no featured badges, has earned badges */}
                        {isOwnProfile &&
                            featuredBadges.length === 0 &&
                            earnedBadges.length > 0 &&
                            !showBadgeEditor && (
                                <p className="mt-2.5 text-xs text-zinc-400 italic">
                                    {trans('profile.no_featured_badges_hint')}
                                </p>
                            )}

                        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {aboutMainText}
                        </p>

                        {!isOwnProfile && (
                            <div className="mt-3">
                                <BtnAiTranslate
                                    title={aboutBadgeLabel}
                                    content={defaultAboutContent}
                                    onTranslate={setTranslatedAbout}
                                />
                            </div>
                        )}

                        {isOwnProfile && earnedBadges.length > 0 && (
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleOpenProfileEditor}
                                    className="rounded-full"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    {trans('profile.edit_profile')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setShowBadgeEditor((v) => !v)
                                    }
                                    className="rounded-full"
                                >
                                    {showBadgeEditor ? (
                                        <>
                                            <X className="h-3.5 w-3.5" />{' '}
                                            {trans(
                                                'profile.close_badge_editor',
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Settings2 className="h-3.5 w-3.5" />{' '}
                                            {trans(
                                                'profile.edit_displayed_badges',
                                            )}
                                        </>
                                    )}
                                </Button>
                                {saveSuccess && (
                                    <span className="text-xs font-medium text-emerald-600">
                                        ✓ {trans('profile.badges_saved')}
                                    </span>
                                )}
                            </div>
                        )}
                        {isOwnProfile && earnedBadges.length === 0 && (
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleOpenProfileEditor}
                                    className="rounded-full"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    {trans('profile.edit_profile')}
                                </Button>
                            </div>
                        )}
                        {profileSaveSuccess && (
                            <p className="mt-2 text-xs font-medium text-emerald-600">
                                {trans('profile.profile_saved')}
                            </p>
                        )}
                    </div>
                </section>

                {showProfileEditor && isOwnProfile && (
                    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                    {trans('profile.edit_profile')}
                                </p>
                                <p className="mt-0.5 text-xs text-zinc-500">
                                    {trans('profile.edit_profile_hint')}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowProfileEditor(false)}
                                className="rounded-full"
                            >
                                <X className="h-3.5 w-3.5" />
                                {trans('profile.cancel')}
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                            <label className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-zinc-50 ring-2 ring-zinc-200 transition hover:ring-zinc-400 dark:bg-zinc-800 dark:ring-zinc-700">
                                {profileAvatarPreview || currentAvatar ? (
                                    <img
                                        src={
                                            profileAvatarPreview ??
                                            currentAvatar ??
                                            undefined
                                        }
                                        alt={displayName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-zinc-500">
                                        {firstLetter}
                                    </span>
                                )}
                                <span className="absolute inset-0 flex items-center justify-center bg-zinc-900/45 text-white opacity-0 transition group-hover:opacity-100">
                                    <Camera className="h-5 w-5" />
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(event) =>
                                        setProfileAvatarFile(
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                            </label>

                            <div className="space-y-3">
                                <div>
                                    <label
                                        htmlFor="profile-name"
                                        className="text-xs font-semibold text-zinc-600 dark:text-zinc-300"
                                    >
                                        {trans('profile.name_label')}
                                    </label>
                                    <input
                                        id="profile-name"
                                        value={profileNameInput}
                                        onChange={(event) =>
                                            setProfileNameInput(
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm transition outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-700/60"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="profile-about"
                                        className="text-xs font-semibold text-zinc-600 dark:text-zinc-300"
                                    >
                                        {trans('profile.about_label')}
                                    </label>
                                    <textarea
                                        id="profile-about"
                                        value={profileAboutInput}
                                        maxLength={800}
                                        rows={4}
                                        onChange={(event) =>
                                            setProfileAboutInput(
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 transition outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-700/60"
                                    />
                                    <p className="mt-1 text-right text-xs text-zinc-400">
                                        {profileAboutInput.length}/800
                                    </p>
                                </div>

                                {profileSaveError && (
                                    <p className="text-xs font-medium text-red-600">
                                        {profileSaveError}
                                    </p>
                                )}

                                <div className="flex flex-wrap justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setShowProfileEditor(false)
                                        }
                                        className="rounded-full"
                                    >
                                        {trans('profile.cancel')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        disabled={profileSaving}
                                        onClick={() => {
                                            void handleSaveProfile();
                                        }}
                                        className="rounded-full border border-zinc-900 bg-zinc-900 text-white transition hover:bg-zinc-700 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                    >
                                        {profileSaving
                                            ? trans('profile.saving')
                                            : trans('profile.save_profile')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Badge editor panel ───────────────────────────────────── */}
                {showBadgeEditor && isOwnProfile && earnedBadges.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <p className="flex items-center gap-1.5 text-sm font-bold text-amber-900 dark:text-amber-200">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                    {trans('profile.choose_featured_badges')}
                                </p>
                                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                                    {trans('profile.select_up_to').replace(
                                        ':max',
                                        String(MAX_FEATURED),
                                    )}{' '}
                                    <span className="font-semibold">
                                        {featuredBadgeIds.length}/{MAX_FEATURED}
                                    </span>{' '}
                                    {trans('profile.selected')}
                                </p>
                                {featuredBadgeIds.length >= MAX_FEATURED && (
                                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                        ⚠ {trans('profile.max_badges_reached')}
                                    </p>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={savingBadges}
                                onClick={() => {
                                    void handleSaveFeaturedBadges();
                                }}
                                className={primaryBtnClass}
                            >
                                {savingBadges
                                    ? trans('profile.saving')
                                    : trans('profile.save')}
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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                    <StatCard
                        label={t.followers}
                        value={followersCount}
                        accent="text-sky-600"
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
                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
                        )}
                    >
                        {t.posts}
                        <span
                            className={cn(
                                'rounded-full px-1.5 py-0.5 text-xs',
                                activeTab === 'posts'
                                    ? 'bg-[#ffd9e4] text-[#b93c61]'
                                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800',
                            )}
                        >
                            {posts.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('badges')}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                            activeTab === 'badges'
                                ? 'border-[#e27193] bg-[#fff0f5] text-[#b93c61]'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
                        )}
                    >
                        {t.badges}
                        <span
                            className={cn(
                                'rounded-full px-1.5 py-0.5 text-xs',
                                activeTab === 'badges'
                                    ? 'bg-[#ffd9e4] text-[#b93c61]'
                                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800',
                            )}
                        >
                            {earnedBadges.length}
                        </span>
                    </button>
                </div>

                {/* ── Posts tab ────────────────────────────────────────────── */}
                {activeTab === 'posts' && (
                    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                        {posts.length === 0 ? (
                            <div className="relative overflow-hidden rounded-2xl border border-dashed border-rose-200 bg-linear-to-br from-rose-50 via-white to-sky-50 px-5 py-12 text-center md:px-8 md:py-14">
                                <div className="mx-auto flex max-w-lg flex-col items-center">
                                    <div className="relative mb-5 h-20 w-28">
                                        <div className="absolute top-0 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-rose-100">
                                            <FileText className="h-7 w-7 text-[#e27193]" />
                                        </div>
                                        <div className="absolute bottom-0 left-3 h-10 w-10 rounded-full bg-sky-100 ring-4 ring-white" />
                                        <div className="absolute right-3 bottom-0 h-10 w-10 rounded-full bg-amber-100 ring-4 ring-white" />
                                    </div>
                                    <h2 className="text-lg font-bold text-zinc-900">{t.noPostsYet}</h2>
                                    <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
                                        {trans('profile.earn_badges_hint')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {posts.map((post) => (
                                    <article
                                        key={post.id}
                                        className="group p-5 transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                                    >
                                        <Link
                                            href={`/posts/${post.id}`}
                                            className="block"
                                        >
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
                                            <h3 className="text-base font-semibold text-zinc-900 transition group-hover:text-[#de6b89] dark:text-zinc-100">
                                                {post.title}
                                            </h3>
                                            <p
                                                className="mt-2 border-l-2 border-rose-200 pl-3 text-sm leading-6 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400"
                                                style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {post.content}
                                            </p>
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
                    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                        {earnedBadges.length === 0 ? (
                            <div className="relative overflow-hidden rounded-2xl border border-dashed border-rose-200 bg-linear-to-br from-rose-50 via-white to-sky-50 px-5 py-12 text-center md:px-8 md:py-14">
                                <div className="mx-auto flex max-w-lg flex-col items-center">
                                    <div className="relative mb-5 h-20 w-28">
                                        <div className="absolute top-0 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-rose-100">
                                            <Trophy className="h-7 w-7 text-[#e27193]" />
                                        </div>
                                        <div className="absolute bottom-0 left-3 h-10 w-10 rounded-full bg-sky-100 ring-4 ring-white" />
                                        <div className="absolute right-3 bottom-0 h-10 w-10 rounded-full bg-amber-100 ring-4 ring-white" />
                                    </div>
                                    <h2 className="text-lg font-bold text-zinc-900">{t.noBadgesYet}</h2>
                                    <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
                                        {trans('profile.earn_badges_hint')}
                                    </p>
                                </div>
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
                                                'relative rounded-2xl border-2 p-4 transition-all duration-200',
                                                isFeatured
                                                    ? 'border-amber-300 bg-linear-to-br from-amber-50 via-yellow-50 to-orange-50 shadow-md shadow-amber-100 dark:border-amber-700 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/30'
                                                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800',
                                            )}
                                        >
                                            {isFeatured && (
                                                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                                    <Sparkles className="h-3 w-3" />
                                                    {trans('profile.featured')}
                                                </span>
                                            )}
                                            <div className="mb-2 flex items-center gap-2">
                                                <div
                                                    className={cn(
                                                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                                                        isFeatured
                                                            ? 'bg-amber-100 dark:bg-amber-900/50'
                                                            : 'bg-zinc-200 dark:bg-zinc-700',
                                                    )}
                                                >
                                                    <BadgeIcon
                                                        iconKey={badge.icon}
                                                        className={cn(
                                                            'h-4.5 w-4.5',
                                                            isFeatured
                                                                ? 'text-amber-600 dark:text-amber-400'
                                                                : 'text-zinc-500',
                                                        )}
                                                    />
                                                </div>
                                                <p
                                                    className={cn(
                                                        'font-bold',
                                                        isFeatured
                                                            ? 'text-amber-800 dark:text-amber-200'
                                                            : 'text-zinc-900 dark:text-zinc-100',
                                                    )}
                                                >
                                                    {getTranslatedBadgeName(
                                                        trans,
                                                        badge,
                                                    )}
                                                </p>
                                            </div>
                                            <p
                                                className={cn(
                                                    'text-xs leading-relaxed',
                                                    isFeatured
                                                        ? 'text-amber-700 dark:text-amber-300'
                                                        : 'text-zinc-600 dark:text-zinc-400',
                                                )}
                                            >
                                                {getTranslatedBadgeDescription(
                                                    trans,
                                                    badge,
                                                )}
                                            </p>
                                            <p
                                                className={cn(
                                                    'mt-2 text-xs',
                                                    isFeatured
                                                        ? 'text-amber-600 dark:text-amber-400'
                                                        : 'text-zinc-400',
                                                )}
                                            >
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

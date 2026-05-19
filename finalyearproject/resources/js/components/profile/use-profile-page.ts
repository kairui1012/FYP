import { reactLang } from '@erag/lang-sync-inertia';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { homePage } from '@/routes';
import type { Badge, PageProps } from './types';

const MAX_FEATURED = 3;

export function useProfilePage() {
    const { trans } = reactLang();
    const { profileUser, posts = [] } = usePage<PageProps>().props;

    const t = {
        pageTitle: trans('profile.page_title'),
        defaultUserName: trans('profile.default_user_name'),
        posts: trans('profile.posts'),
        points: trans('profile.points'),
        badges: trans('profile.badges'),
        followers: trans('profile.followers'),
        following: trans('profile.following'),
        noPostsYet: trans('profile.no_posts_yet'),
        noBadgesYet: trans('profile.no_badges_yet'),
        likes: trans('profile.likes'),
        comments: trans('profile.comments'),
        attachmentSingle: trans('profile.attachment_single'),
        attachmentPlural: trans('profile.attachment_plural'),
    };

    const currentUserId = usePage<{ auth?: { user?: { id?: number } } }>().props.auth?.user?.id;
    const isOwnProfile = currentUserId === profileUser.id;

    const earnedBadges: Badge[] = profileUser.badges ?? [];

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
    const [isFollowing, setIsFollowing] = useState(Boolean(profileUser.is_following));
    const [followersCount, setFollowersCount] = useState(profileUser.followers_count ?? 0);
    const [followingCount, setFollowingCount] = useState(profileUser.following_count ?? 0);
    const [followLoading, setFollowLoading] = useState(false);
    const [showProfileEditor, setShowProfileEditor] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
    const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
    const [profileNameInput, setProfileNameInput] = useState(profileUser.name);
    const [profileAboutInput, setProfileAboutInput] = useState(profileUser.about ?? '');
    const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
    const [profileAvatarPreview, setProfileAvatarPreview] = useState<string | null>(null);

    const displayName = displayProfile.name?.trim() || t.defaultUserName;
    const firstLetter = displayName.charAt(0).toUpperCase();
    const currentAvatar = displayProfile.avatar;
    const currentAbout = displayProfile.about?.trim() || null;

    const defaultAboutMain = isOwnProfile
        ? trans('profile.about_self_intro')
        : trans('profile.about_other_intro').replace(':name', displayName);
    const defaultAboutTip = isOwnProfile
        ? trans('profile.about_self_tip')
        : trans('profile.about_other_tip');
    const defaultAboutContent = currentAbout
        ? currentAbout
        : `${defaultAboutMain}\n\n${defaultAboutTip}`;

    const aboutMainText = currentAbout?.trim() ?? defaultAboutMain;

    const featuredBadges = earnedBadges.filter((b) => featuredBadgeIds.includes(b.id));

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
    }, [followLoading, profileUser.is_following]);

    useEffect(() => {
        if (!followLoading) setFollowersCount(profileUser.followers_count ?? 0);
    }, [followLoading, profileUser.followers_count]);

    useEffect(() => {
        setFollowingCount(profileUser.following_count ?? 0);
    }, [profileUser.following_count]);

    useEffect(() => {
        if (!profileAvatarFile) {
            setProfileAvatarPreview(null);
            return;
        }
        const url = URL.createObjectURL(profileAvatarFile);
        setProfileAvatarPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [profileAvatarFile]);

    const handleFollowToggle = async () => {
        if (!profileUser.id || !currentUserId || currentUserId === profileUser.id || followLoading)
            return;
        const previous = isFollowing;
        const optimistic = !previous;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        setFollowLoading(true);
        setIsFollowing(optimistic);
        setFollowersCount((c) => Math.max(0, c + (optimistic ? 1 : -1)));
        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
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
            const payload = (await response.json()) as { is_following: boolean };
            setIsFollowing(payload.is_following);
            if (payload.is_following !== optimistic) {
                setFollowersCount((c) => Math.max(0, c + (payload.is_following ? 1 : -1)));
            }
            sessionStorage.setItem('followingPageDirty', '1');
        } catch {
            setIsFollowing(previous);
            setFollowersCount((c) => Math.max(0, c + (previous ? 1 : -1)));
        } finally {
            clearTimeout(timeout);
            setFollowLoading(false);
        }
    };

    const handleBadgeToggle = (badgeId: number) => {
        setFeaturedBadgeIds((prev) => {
            if (prev.includes(badgeId)) return prev.filter((id) => id !== badgeId);
            if (prev.length >= MAX_FEATURED) return prev;
            return [...prev, badgeId];
        });
    };

    const handleSaveFeaturedBadges = async () => {
        setSavingBadges(true);
        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
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
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        const formData = new FormData();
        formData.append('name', nextName);
        formData.append('about', profileAboutInput.trim());
        if (profileAvatarFile) formData.append('avatar', profileAvatarFile);

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

            if (!response.ok) throw new Error('Profile update failed.');

            const payload = (await response.json()) as {
                profileUser: { name: string; avatar: string | null; about: string | null };
            };
            setDisplayProfile({
                name: payload.profileUser.name,
                avatar: payload.profileUser.avatar ?? currentAvatar,
                about: payload.profileUser.about,
            });
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

    return {
        trans,
        t,
        profileUser,
        posts,
        currentUserId,
        isOwnProfile,
        earnedBadges,
        featuredBadges,
        displayName,
        firstLetter,
        currentAvatar,
        currentAbout,
        defaultAboutContent,
        aboutMainText,
        activeTab,
        setActiveTab,
        showBadgeEditor,
        setShowBadgeEditor,
        featuredBadgeIds,
        savingBadges,
        saveSuccess,
        avatarLoadFailed,
        setAvatarLoadFailed,
        isFollowing,
        followersCount,
        followingCount,
        followLoading,
        showProfileEditor,
        setShowProfileEditor,
        profileSaving,
        profileSaveError,
        profileSaveSuccess,
        profileNameInput,
        setProfileNameInput,
        profileAboutInput,
        setProfileAboutInput,
        profileAvatarFile,
        setProfileAvatarFile,
        profileAvatarPreview,
        handleFollowToggle,
        handleBadgeToggle,
        handleSaveFeaturedBadges,
        handleBack,
        handleOpenProfileEditor,
        handleSaveProfile,
    };
}

import { BadgeCheck, Pencil, Settings2, X } from 'lucide-react';
import { useState } from 'react';
import { BtnFollow } from '@/components/shared/follow-button';
import { LeaderboardTitleBadge } from '@/components/shared/leaderboard-title-badge';
import { VerifiedTeacherBadge } from '@/components/shared/verified-teacher-badge';
import type {
    Badge,
    ProfileUser,
    TransFn,
} from '@/components/ts/features/profile/profile-types';
import { Button } from '@/components/ui/button';
import {
    getTranslatedBadgeDescription,
    getTranslatedBadgeName,
} from '@/lib/badge-text-helpers';
import { BadgeIcon } from './badge-icon';
export function ProfileHeader({
    displayName,
    firstLetter,
    currentAvatar,
    avatarLoadFailed,
    onAvatarError,
    profileUser,
    featuredBadges,
    earnedBadges,
    isOwnProfile,
    currentUserId,
    isFollowing,
    followLoading,
    showBadgeEditor,
    saveSuccess,
    aboutMainText,
    profileSaveSuccess,
    trans,
    onFollowToggle,
    onOpenProfileEditor,
    onToggleBadgeEditor,
}: {
    displayName: string;
    firstLetter: string;
    currentAvatar: string | null;
    avatarLoadFailed: boolean;
    onAvatarError: () => void;
    profileUser: ProfileUser;
    featuredBadges: Badge[];
    earnedBadges: Badge[];
    isOwnProfile: boolean;
    currentUserId: number | undefined;
    isFollowing: boolean;
    followLoading: boolean;
    showBadgeEditor: boolean;
    saveSuccess: boolean;
    aboutMainText: string | undefined;
    profileSaveSuccess: boolean;
    trans: TransFn;
    onFollowToggle: () => void;
    onOpenProfileEditor: () => void;
    onToggleBadgeEditor: () => void;
}) {
    const isVerifiedTeacher =
        profileUser.is_verified && profileUser.role === 'teacher';
    const [tooltipBadgeId, setTooltipBadgeId] = useState<number | null>(null);

    return (
        <section className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="shrink-0">
                {currentAvatar && !avatarLoadFailed ? (
                    <div className="h-20 w-20 overflow-hidden rounded-full ring-2 ring-zinc-200 md:h-24 md:w-24 dark:ring-zinc-700">
                        <img
                            src={currentAvatar}
                            alt={displayName}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={onAvatarError}
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
                    <h1
                        className={`text-2xl font-bold tracking-tight md:text-3xl ${isVerifiedTeacher ? 'text-blue-600' : 'text-zinc-900 dark:text-zinc-100'}`}
                    >
                        {displayName}
                    </h1>
                    {isVerifiedTeacher && (
                        <VerifiedTeacherBadge className="h-6 w-6" />
                    )}
                    <LeaderboardTitleBadge
                        title={profileUser.leaderboard_title}
                    />
                    {!isOwnProfile &&
                        currentUserId &&
                        currentUserId !== profileUser.id && (
                            <BtnFollow
                                following={isFollowing}
                                loading={followLoading}
                                onClick={onFollowToggle}
                            />
                        )}
                </div>
                {isVerifiedTeacher && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-600 ring-1 ring-blue-200">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {trans('profile.verified_teacher')}
                    </div>
                )}

                <p className="mt-0.5 text-sm text-zinc-500">
                    @user-{profileUser.id}
                </p>

                {featuredBadges.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {featuredBadges.map((badge) => (
                            <span
                                key={badge.id}
                                className="relative inline-flex cursor-default items-center gap-1.5 rounded-full border border-amber-300 bg-linear-to-r from-amber-50 to-yellow-50 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-sm transition hover:border-amber-400 hover:shadow-amber-100 dark:border-amber-700 dark:from-amber-950/40 dark:to-yellow-950/30 dark:text-amber-300"
                                onMouseEnter={() => setTooltipBadgeId(badge.id)}
                                onMouseLeave={() => setTooltipBadgeId(null)}
                            >
                                <BadgeIcon
                                    iconKey={badge.icon}
                                    className="h-3 w-3 text-amber-600 dark:text-amber-400"
                                />
                                <span>
                                    {getTranslatedBadgeName(trans, badge)}
                                </span>
                                {tooltipBadgeId === badge.id && (
                                    <span className="absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-52 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                        {getTranslatedBadgeDescription(
                                            trans,
                                            badge,
                                        )}
                                    </span>
                                )}
                            </span>
                        ))}
                    </div>
                )}

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

                {isOwnProfile && earnedBadges.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onOpenProfileEditor}
                            className="rounded-full"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            {trans('profile.edit_profile')}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleBadgeEditor}
                            className="rounded-full"
                        >
                            {showBadgeEditor ? (
                                <>
                                    <X className="h-3.5 w-3.5" />{' '}
                                    {trans('profile.close_badge_editor')}
                                </>
                            ) : (
                                <>
                                    <Settings2 className="h-3.5 w-3.5" />{' '}
                                    {trans('profile.edit_displayed_badges')}
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
                            onClick={onOpenProfileEditor}
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
    );
}

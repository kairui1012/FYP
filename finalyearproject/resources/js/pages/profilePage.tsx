import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { BadgeEditorPanel } from '@/components/profile/badge-editor-panel';
import { ProfileBadgesTab } from '@/components/profile/profile-badges-tab';
import { ProfileEditor } from '@/components/profile/profile-editor';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfilePostsTab } from '@/components/profile/profile-posts-tab';
import { ProfileStats } from '@/components/profile/profile-stats';
import { ProfileTabBar } from '@/components/profile/profile-tab-bar';
import { useProfilePage } from '@/components/profile/use-profile-page';
import AppLayout from '@/layouts/app-layout';

export default function ProfilePage() {
    const {
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
        profileAboutInput,
        profileAvatarPreview,
        handleFollowToggle,
        handleBadgeToggle,
        handleSaveFeaturedBadges,
        handleBack,
        handleOpenProfileEditor,
        handleSaveProfile,
        setProfileNameInput,
        setProfileAboutInput,
        setProfileAvatarFile,
    } = useProfilePage();

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

                <ProfileHeader
                    displayName={displayName}
                    firstLetter={firstLetter}
                    currentAvatar={currentAvatar}
                    avatarLoadFailed={avatarLoadFailed}
                    onAvatarError={() => setAvatarLoadFailed(true)}
                    profileUser={profileUser}
                    featuredBadges={featuredBadges}
                    earnedBadges={earnedBadges}
                    isOwnProfile={isOwnProfile}
                    currentUserId={currentUserId}
                    isFollowing={isFollowing}
                    followLoading={followLoading}
                    showBadgeEditor={showBadgeEditor}
                    saveSuccess={saveSuccess}
                    aboutMainText={aboutMainText}
                    profileSaveSuccess={profileSaveSuccess}
                    trans={trans}
                    onFollowToggle={() => { void handleFollowToggle(); }}
                    onOpenProfileEditor={handleOpenProfileEditor}
                    onToggleBadgeEditor={() => setShowBadgeEditor((v) => !v)}
                />

                {showProfileEditor && isOwnProfile && (
                    <ProfileEditor
                        displayName={displayName}
                        firstLetter={firstLetter}
                        currentAvatar={currentAvatar}
                        profileAvatarPreview={profileAvatarPreview}
                        profileNameInput={profileNameInput}
                        profileAboutInput={profileAboutInput}
                        profileSaving={profileSaving}
                        profileSaveError={profileSaveError}
                        trans={trans}
                        onNameChange={setProfileNameInput}
                        onAboutChange={setProfileAboutInput}
                        onAvatarFileChange={setProfileAvatarFile}
                        onSave={() => { void handleSaveProfile(); }}
                        onCancel={() => setShowProfileEditor(false)}
                    />
                )}

                {showBadgeEditor && isOwnProfile && earnedBadges.length > 0 && (
                    <BadgeEditorPanel
                        earnedBadges={earnedBadges}
                        featuredBadgeIds={featuredBadgeIds}
                        savingBadges={savingBadges}
                        trans={trans}
                        onBadgeToggle={handleBadgeToggle}
                        onSave={() => { void handleSaveFeaturedBadges(); }}
                    />
                )}

                <ProfileStats
                    learningBadgesCount={earnedBadges.length}
                    points={profileUser.points ?? 0}
                    followersCount={followersCount}
                    labels={{
                        learningBadges: t.badges,
                        points: t.points,
                        followers: t.followers,
                    }}
                />

                <ProfileTabBar
                    activeTab={activeTab}
                    postsCount={posts.length}
                    badgesCount={earnedBadges.length}
                    labels={{ posts: t.posts, badges: t.badges }}
                    onTabChange={setActiveTab}
                />

                {activeTab === 'posts' && (
                    <ProfilePostsTab
                        posts={posts}
                        labels={{
                            noPostsYet: t.noPostsYet,
                            likes: t.likes,
                            comments: t.comments,
                            attachmentSingle: t.attachmentSingle,
                            attachmentPlural: t.attachmentPlural,
                        }}
                        trans={trans}
                    />
                )}

                {activeTab === 'badges' && (
                    <ProfileBadgesTab
                        earnedBadges={earnedBadges}
                        featuredBadgeIds={featuredBadgeIds}
                        pointsLabel={t.points}
                        noBadgesYetLabel={t.noBadgesYet}
                        trans={trans}
                    />
                )}
            </div>
        </>
    );
}

ProfilePage.layout = (page: ReactNode) => <AppLayout>{page}</AppLayout>;

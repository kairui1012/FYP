import { reactLang } from '@erag/lang-sync-inertia';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BtnAiTranslate } from '@/components/ui/btn-ai-translate';
import { BtnFollow } from '@/components/ui/btn-follow';
import { formatTimeAgo } from '@/lib/post-utils';

type ProfileUser = {
    id: number;
    name: string;
    email?: string | null;
    avatar?: string | null;
    is_following?: boolean;
    points?: number;
    badges?: {
        id: number;
        key: string;
        name: string;
        description: string;
        icon?: string | null;
        points_required: number;
        awarded_at?: string | null;
    }[];
};

type ProfilePost = {
    id: number;
    title: string;
    content: string;
    image?: string[] | null;
    created_at: string;
    likes_count?: number;
    comments_count?: number;
    language?: {
        code: string;
        name: string;
    } | null;
};

type PageProps = {
    profileUser: ProfileUser;
    posts: ProfilePost[];
};

export default function ProfilePage() {
    const { trans } = reactLang();
    const {
        profileUser,
        posts = [],
    } = usePage<PageProps>().props;
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
    const currentUserId = usePage<{ auth?: { user?: { id?: number } } }>().props.auth?.user?.id;
    const isOwnProfile = currentUserId === profileUser.id;
    const [translatedAbout, setTranslatedAbout] = useState<{
        title: string;
        content: string;
    } | null>(null);
    const [isFollowing, setIsFollowing] = useState(Boolean(profileUser.is_following));
    const [followLoading, setFollowLoading] = useState(false);
    const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

    const aboutTitle = trans('profile.about');
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
    const aboutTipText =
        (translatedAbout?.content ?? defaultAboutContent)
            .split(/\n{2,}/)
            .slice(1)
            .join('\n\n')
            .trim() || defaultAboutTip;

    useEffect(() => {
        setAvatarLoadFailed(false);
    }, [profileUser.avatar]);

    useEffect(() => {
        setIsFollowing(Boolean(profileUser.is_following));
    }, [profileUser.is_following]);

    const handleFollowToggle = async () => {
        if (!profileUser.id || !currentUserId || currentUserId === profileUser.id || followLoading) {
            return;
        }

        const previous = isFollowing;
        const optimistic = !previous;

        setFollowLoading(true);
        setIsFollowing(optimistic);

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

            if (!response.ok) {
                throw new Error('Follow toggle failed.');
            }

            const payload = (await response.json()) as { is_following: boolean };
            setIsFollowing(payload.is_following);
        } catch {
            setIsFollowing(previous);
        } finally {
            setFollowLoading(false);
        }
    };

    return (
        <>
            <Head title={`${t.pageTitle} - ${displayName}`} />

            <div className="mx-auto w-full max-w-4xl px-4 pb-10 md:px-6">
                <section className="pt-6 md:pt-8">
                    <div className="flex items-end gap-4 px-2 md:px-4">
                        {profileUser.avatar && !avatarLoadFailed ? (
                            <div className="relative z-20 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white md:h-28 md:w-28">
                                <img
                                    src={profileUser.avatar}
                                    alt={displayName}
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={() => setAvatarLoadFailed(true)}
                                />
                            </div>
                        ) : (
                            <div className="relative z-20 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-zinc-200 text-3xl font-semibold text-zinc-700 md:h-28 md:w-28">
                                {firstLetter}
                            </div>
                        )}

                        <div className="pb-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
                                    {displayName}
                                </h1>
                                {!isOwnProfile && currentUserId && currentUserId !== profileUser.id ? (
                                    <BtnFollow
                                        following={isFollowing}
                                        loading={followLoading}
                                        onClick={() => {
                                            void handleFollowToggle();
                                        }}
                                    />
                                ) : null}
                            </div>
                            <p className="text-sm text-zinc-500">
                                @user-{profileUser.id}
                            </p>
                            <p className="mt-1 inline-flex items-center rounded-sm bg-zinc-900 px-2 py-1 text-xs font-semibold text-white">
                                {t.points}: {profileUser.points ?? 0}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-8">
                    <div className="border-t border-zinc-200" />

                    <div className="grid gap-6 py-6 md:grid-cols-[180px_1fr] md:gap-10">
                        <p className="text-sm font-medium tracking-wide text-zinc-400 uppercase">
                            {t.contact}
                        </p>
                        <div>
                            <p className="text-base text-zinc-800">
                                {profileUser.email || t.noEmailSharedYet}
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-zinc-200" />

                    <div className="grid gap-6 py-6 md:grid-cols-[180px_1fr] md:gap-10">
                        <p className="text-sm font-medium tracking-wide text-zinc-400 uppercase">
                            {aboutTitle}
                        </p>
                        <div className="space-y-3 text-zinc-700">
                            <p className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold tracking-wide text-rose-700 uppercase">
                                {translatedAbout?.title ?? aboutBadgeLabel}
                            </p>
                            <p className="text-base leading-7 text-zinc-800">
                                {aboutMainText}
                            </p>
                            <p className="border-l-2 border-rose-200 pl-3 text-sm leading-7 text-zinc-500">
                                {aboutTipText}
                            </p>
                            {!isOwnProfile ? (
                                <BtnAiTranslate
                                    className="my-1"
                                    title={aboutBadgeLabel}
                                    content={defaultAboutContent}
                                    onTranslate={setTranslatedAbout}
                                />
                            ) : null}
                        </div>
                    </div>

                    <div className="border-t border-zinc-200" />

                    <div className="grid gap-6 py-6 md:grid-cols-[180px_1fr] md:gap-10">
                        <p className="text-sm font-medium tracking-wide text-zinc-400 uppercase">
                            {t.badges}
                        </p>
                        <div>
                            {profileUser.badges && profileUser.badges.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {profileUser.badges.map((badge) => (
                                        <span
                                            key={badge.id}
                                            className="inline-flex items-center rounded-sm bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800"
                                            title={badge.description}
                                        >
                                            {badge.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-500">{t.noBadgesYet}</p>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-zinc-200" />
                </section>

                <section className="mt-10">
                    <div className="mb-3 flex items-end justify-between">
                        <h2 className="text-lg font-semibold text-zinc-900">
                            {t.posts}
                        </h2>
                        <p className="text-sm text-zinc-500">
                            {posts.length}{' '}
                            {posts.length === 1 ? t.postSingle : t.postPlural}
                        </p>
                    </div>

                    <div className="border-t border-zinc-200" />

                    {posts.length === 0 ? (
                        <div className="mt-6 border border-dashed border-zinc-300 bg-white px-6 py-16 text-center text-3xl text-zinc-500">
                            <p>{t.noPostsYet}</p>
                        </div>
                    ) : (
                        posts.map((post) => (
                            <article
                                key={post.id}
                                className="group border-b border-zinc-200 py-5 transition-colors hover:bg-zinc-50/70"
                            >
                                <Link
                                    href={`/posts/${post.id}`}
                                    className="block"
                                >
                                    <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
                                        <span>
                                            {formatTimeAgo(post.created_at)}
                                        </span>
                                        <span>•</span>
                                        <span>
                                            {post.likes_count ?? 0} {t.likes}
                                        </span>
                                        <span>•</span>
                                        <span>
                                            {post.comments_count ?? 0}{' '}
                                            {t.comments}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-semibold text-zinc-900 transition-colors group-hover:text-[#de6b89]">
                                        {post.title}
                                    </h3>

                                    <p
                                        className="mt-3 border-l-2 border-rose-200 pl-4 text-sm leading-7 whitespace-pre-wrap text-zinc-700"
                                        style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 4,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {post.content}
                                    </p>

                                    {post.image && post.image.length > 0 ? (
                                        <p className="mt-2 text-xs text-zinc-500">
                                            {post.image.length}{' '}
                                            {post.image.length > 1
                                                ? t.attachmentPlural
                                                : t.attachmentSingle}
                                        </p>
                                    ) : null}
                                </Link>
                            </article>
                        ))
                    )}
                </section>
            </div>
        </>
    );
}

ProfilePage.layout = (page: ReactNode) => <AppLayout children={page} />;

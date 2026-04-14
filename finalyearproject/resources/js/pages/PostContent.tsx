import { Head, Link, router, usePage } from '@inertiajs/react';
import { lazy, Suspense, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { CommentSection } from '@/components/comment-section';
const PostAttachments = lazy(() => import('@/components/post-attachments').then(m => ({ default: m.PostAttachments })));
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatTimeAgo } from '@/lib/post-utils';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem, PostItem } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { BtnComment } from '@/components/ui/btn-comment';
import { BtnFollow } from '@/components/ui/btn-follow';
import { BtnLike } from '@/components/ui/btn-like';
import { BtnSave } from '@/components/ui/btn-save';
import { BtnShare } from '@/components/ui/btn-share';
import like from '@/routes/like';
import { BtnAiTranslate } from '@/components/ui/btn-ai-translate';

type PostContentProps = {
    post: PostItem;
};

function getLangBadgeProps(code: string) {
    if (code === 'en') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (code === 'zh') return { bg: 'bg-red-100', text: 'text-red-700' };
    if (code === 'bm' || code === 'my') return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-gray-200', text: 'text-gray-700' };
}

function getPostTypeBadgeProps(type: string) {
    if (type === 'question') return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    return { bg: 'bg-violet-100', text: 'text-violet-700' };
}

function getSubjectBadgeProps() {
    return { bg: 'bg-slate-100', text: 'text-slate-700' };
}

function trans(key: string, page: any) {
    const parts = key.split('.');
    let obj = page.props?.lang;
    for (const part of parts) {
        if (obj && typeof obj === 'object' && part in obj) {
            obj = obj[part];
        } else {
            return key;
        }
    }
    return typeof obj === 'string' ? obj : key;
}



export default function PostContent({ post }: PostContentProps) {
    const page = usePage();
    const currentUserId = (page.props as { auth?: { user?: { id?: number } } }).auth?.user?.id;
    const [translated, setTranslated] = useState<{ title: string; content: string } | null>(null);
    const [isLiked, setIsLiked] = useState(Boolean(post.is_liked));
    const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
    const [commentsCount, setCommentsCount] = useState(
        post.comments_count ?? post.comments?.length ?? 0,
    );
    const [isSaved, setIsSaved] = useState(Boolean(post.is_saved));
    const [savesCount, setSavesCount] = useState(post.saves_count ?? 0);
    const [liking, setLiking] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isFollowingAuthor, setIsFollowingAuthor] = useState(Boolean(post.user?.is_following));
    const [followingAuthorLoading, setFollowingAuthorLoading] = useState(false);

    useEffect(() => {
        document.documentElement.classList.remove('nprogress-busy');
        document.body.classList.remove('nprogress-busy');
        document.documentElement.style.cursor = '';
        document.body.style.cursor = '';
    }, []);

    useEffect(() => {
        setIsLiked(Boolean(post.is_liked));
        setLikesCount(post.likes_count ?? 0);
        setCommentsCount(post.comments_count ?? post.comments?.length ?? 0);
        setIsSaved(Boolean(post.is_saved));
        setSavesCount(post.saves_count ?? 0);
        setIsFollowingAuthor(Boolean(post.user?.is_following));
    }, [post.comments?.length, post.comments_count, post.is_liked, post.likes_count, post.is_saved, post.saves_count, post.user?.is_following]);

    useEffect(() => {
        if (window.location.hash !== '#comments') {
            return;
        }

        const scrollToComments = () => {
            document
                .getElementById('comments')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        requestAnimationFrame(scrollToComments);
    }, [post.id]);

    const handleLike = (postId: number) => {
        if (liking) {
            return;
        }

        const previousLiked = isLiked;
        const previousLikesCount = likesCount;
        const optimisticLiked = !previousLiked;

        setLiking(true);
        setIsLiked(optimisticLiked);
        setLikesCount((count) => Math.max(0, count + (optimisticLiked ? 1 : -1)));

        router.post(like.toggle.url({ posts: postId }), {}, {
            preserveScroll: true,
            preserveState: true,
            only: ['post'],
            onError: () => {
                setIsLiked(previousLiked);
                setLikesCount(previousLikesCount);
            },
            onSuccess: (page) => {
                const nextPost = (page.props as { post?: PostItem }).post;

                if (!nextPost) {
                    return;
                }

                setIsLiked(Boolean(nextPost.is_liked));
                setLikesCount(nextPost.likes_count ?? 0);
                setCommentsCount(
                    nextPost.comments_count ?? nextPost.comments?.length ?? 0,
                );
            },
            onFinish: () => {
                setLiking(false);
            },
        });
    };

    const handleSave = async (postId: number) => {
        if (saving) {
            return;
        }

        const previousSaved = isSaved;
        const previousSavesCount = savesCount;
        const optimisticSaved = !previousSaved;

        setSaving(true);
        setIsSaved(optimisticSaved);
        setSavesCount((count) => Math.max(0, count + (optimisticSaved ? 1 : -1)));

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';

        try {
            const response = await fetch(`/posts/${postId}/save`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to toggle save.');
            }

            const payload = (await response.json()) as {
                saved: boolean;
                saves_count: number;
            };

            setIsSaved(payload.saved);
            setSavesCount(payload.saves_count);
        } catch {
            setIsSaved(previousSaved);
            setSavesCount(previousSavesCount);
        } finally {
            setSaving(false);
        }
    };

    const handleFollowAuthor = async () => {
        const userId = post.user?.id;

        if (!userId || followingAuthorLoading || currentUserId === userId) {
            return;
        }

        const previous = isFollowingAuthor;
        const optimistic = !previous;

        setFollowingAuthorLoading(true);
        setIsFollowingAuthor(optimistic);

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';

        try {
            const response = await fetch(`/users/${userId}/follow`, {
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
            setIsFollowingAuthor(payload.is_following);
        } catch {
            setIsFollowingAuthor(previous);
        } finally {
            setFollowingAuthorLoading(false);
        }
    };

    const handleCommentClick = () => {
        const commentsSection = document.getElementById('comments');

        if (!commentsSection) {
            return;
        }

        if (window.location.hash !== '#comments') {
            window.history.replaceState(null, '', `${window.location.pathname}#comments`);
        }

        commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <>
            <Head title={translated?.title ?? post.title} />

            <div className="w-full bg-white pb-20">
                <div className="mx-auto w-full max-w-3xl ">
                    <div className="flex items-center justify-between px-4 pt-7 pb-6">
                        <div className="mb-5 flex items-center gap-6">
                            <Link
                                href={homePage()}
                                className="flex h-10 w-10 items-center justify-center rounded-full 
                                cursor-pointer
                                bg-background text-foreground 
                                border-2 border-sidebar-border
                                hover:border-2 hover:border-[#e27193]
                                hover:bg-linear-to-r from-[#ef99b0] to-[#e27193] hover:text-white"                            
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            <Link
                                href={post.user?.id ? `/profilePage/${post.user.id}` : '/profilePage'}
                                className="peer group/avatar cursor-pointer"
                            >
                                <Avatar className="h-11 w-11 shrink-0 overflow-hidden ring-2 ring-transparent transition-colors group-hover/avatar:ring-[#ef99b0]">
                                    {post.user?.avatar ? (
                                        <AvatarImage
                                            src={post.user.avatar}
                                            alt={post.user?.name ?? 'User avatar'}
                                        />
                                    ) : null}
                                    <AvatarFallback className="bg-zinc-200 text-base font-bold text-zinc-700">
                                        {(post.user?.name ?? 'U')
                                            .charAt(0)
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="flex flex-col leading-tight">
                                <div className="min-w-0 flex-1">
                                    <div className="mb-4 flex flex-wrap items-center gap-3 text-base">
                                        <Link
                                            href={post.user?.id ? `/profilePage/${post.user.id}` : '/profilePage'}
                                            className="cursor-pointer font-semibold text-zinc-900 transition-colors hover:text-[#de6b89] peer-hover:text-[#de6b89]"
                                        >
                                            {post.user?.name ?? 'Unknown User'}
                                        </Link>
                                        {post.user?.id && currentUserId && post.user.id !== currentUserId ? (
                                            <BtnFollow
                                                following={isFollowingAuthor}
                                                loading={followingAuthorLoading}
                                                onClick={() => {
                                                    void handleFollowAuthor();
                                                }}
                                            />
                                        ) : null}
                                        <span className="text-zinc-400">•</span>
                                        <span className="text-zinc-500 text-sm">
                                            {formatTimeAgo(post.created_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        {(() => {
                                            const type = post.post_type === 'question' ? 'question' : 'material';
                                            const { bg, text } = getPostTypeBadgeProps(type);
                                            const label = type === 'question'
                                                ? trans('createPost.ask_question', page)
                                                : trans('createPost.share_material', page);

                                            return (
                                                <span className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}>
                                                    {label}
                                                </span>
                                            );
                                        })()}
                                        {(() => {
                                            const code = post.language?.code || 'en';
                                            const { bg, text } = getLangBadgeProps(code);
                                            const label = trans(`language_label.${code}`, page);
                                            return (
                                                <span className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}>
                                                    {label}
                                                </span>
                                            );
                                        })()}
                                        {post.subject?.name ? (() => {
                                            const { bg, text } = getSubjectBadgeProps();
                                            return (
                                                <span className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}>
                                                    {post.subject.name}
                                                </span>
                                            );
                                        })() : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <h1 className="px-4 pt-2 pb-7 text-2xl font-bold leading-snug text-zinc-950">
                        {translated?.title ?? post.title}
                    </h1>
                    {(translated?.content ?? post.content) && (
                        <p className="px-4 pb-7 text-base leading-7 whitespace-pre-wrap text-zinc-700">
                            {translated?.content ?? post.content}
                        </p>
                    )}
                    <Suspense fallback={<div className="h-64 rounded-xl bg-zinc-100" />}>
                        <PostAttachments files={post.image} />
                    </Suspense>
                    <PostFooter
                        postId={post.id}
                        liked={isLiked}
                        loading={liking}
                        onLike={handleLike}
                        likes={likesCount}
                        comments={commentsCount}
                        onSave={handleSave}
                        saved={isSaved}
                        saves={savesCount}
                        saveLoading={saving}
                        onComment={handleCommentClick}
                    />
                    
                    <BtnAiTranslate
                        className='my-3'
                        title={post.title}
                        content={post.content ?? ''}
                        onTranslate={setTranslated}
                    />
                    <div className=" w-full border-t border-zinc-200 my-10"></div>
                    <div id="comments">
                        <CommentSection
                            post={post}
                            onCommentsCountChange={setCommentsCount}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

PostContent.layout = (page: ReactNode) => {
    const pageWithProps = page as ReactElement<PostContentProps>;
    const { post } = pageWithProps.props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Home',
            href: homePage(),
        },
        {
            title: post.title,
            href: `/posts/${post.id}`,
        },
    ];

    return <AppLayout breadcrumbs={breadcrumbs}>{pageWithProps}</AppLayout>;
};
type PostFooterProps = {
    postId: number;
    likes: number;
    saves: number;
    liked: boolean;
    saved: boolean;
    loading?: boolean;
    saveLoading?: boolean;
    onLike: (postId: number) => void;
    onSave: (postId: number) => void;
    onComment: () => void;
    comments: number;
};


function PostFooter({ postId, likes, saves, liked, saved, loading = false, saveLoading = false, onLike, onSave, comments, onComment }: PostFooterProps) {
    return (
        <div className="mt-7 mb-3 flex flex-wrap items-center gap-5 px-4 text-sm text-zinc-900">
            <BtnLike
                count={likes}
                liked={liked}
                loading={loading}
                onClick={() => onLike(postId)}
            />
            <BtnComment
                count={comments}
                onClick={onComment}
            />
            <BtnSave
                count={saves}
                saved={saved}
                loading={saveLoading}
                onClick={() => onSave(postId)}
            />
            <BtnShare postId={postId} />
        </div>
    );
}

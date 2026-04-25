import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { CommentSection } from '@/components/comment-section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BtnAiTranslate } from '@/components/ui/btn-ai-translate';
import { BtnComment } from '@/components/ui/btn-comment';
import { BtnFollow } from '@/components/ui/btn-follow';
import { BtnLike } from '@/components/ui/btn-like';
import { BtnSave } from '@/components/ui/btn-save';
import { BtnShare } from '@/components/ui/btn-share';
import AppLayout from '@/layouts/app-layout';
import { formatFormulaText } from '@/lib/formula-display';
import { getEmbedUrl } from '@/lib/video-utils';
import { formatTimeAgo } from '@/lib/post-utils';
import { homePage } from '@/routes';
import like from '@/routes/like';
import type { BreadcrumbItem, PostItem } from '@/types';
import { BtnAiAns } from '../components/ui/btn-ai-ans';

const PostAttachments = lazy(() =>
    import('@/components/post-attachments').then((m) => ({
        default: m.PostAttachments,
    })),
);

type PostContentProps = {
    post: PostItem;
};

function getLangBadgeProps(code: string) {
    if (code === 'en') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (code === 'zh') return { bg: 'bg-red-100', text: 'text-red-700' };
    if (code === 'bm' || code === 'my')
        return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-gray-200', text: 'text-gray-700' };
}

function getPostTypeBadgeProps(type: string) {
    if (type === 'quiz') return { bg: 'bg-amber-100', text: 'text-amber-700' };
    if (type === 'question')
        return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
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

function scrollCommentsInAppContent(commentsSection: HTMLElement | null) {
    if (!commentsSection) {
        return;
    }

    let container: HTMLElement | null = commentsSection.parentElement;
    while (container) {
        const { overflowY } = window.getComputedStyle(container);
        const isScrollable =
            (overflowY === 'auto' || overflowY === 'scroll') &&
            container.scrollHeight > container.clientHeight;

        if (isScrollable) {
            break;
        }

        container = container.parentElement;
    }

    const headerOffset = 96;

    if (!container) {
        const top =
            commentsSection.getBoundingClientRect().top +
            window.scrollY -
            headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
        return;
    }

    const top =
        commentsSection.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        headerOffset;

    container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export default function PostContent({ post }: PostContentProps) {
    const page = usePage();
    const currentUserId = (page.props as { auth?: { user?: { id?: number } } })
        .auth?.user?.id;
    const isOwner = Boolean(currentUserId && post.user?.id === currentUserId);
    const isAnonymousPost = Boolean(post.is_anonymous);
    const canManagePost = isOwner && !isAnonymousPost;
    const displayName = isAnonymousPost
        ? 'Anonymous User'
        : (post.user?.name ?? 'Unknown User');

    const [translated, setTranslated] = useState<{
        title: string;
        content: string;
    } | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(post.title);
    const [editContent, setEditContent] = useState(post.content ?? '');
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [editLoading, setEditLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isLiked, setIsLiked] = useState(Boolean(post.is_liked));
    const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
    const [commentsCount, setCommentsCount] = useState(
        post.comments_count ?? post.comments?.length ?? 0,
    );
    const [isSaved, setIsSaved] = useState(Boolean(post.is_saved));
    const [savesCount, setSavesCount] = useState(post.saves_count ?? 0);
    const [liking, setLiking] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isFollowingAuthor, setIsFollowingAuthor] = useState(
        Boolean(post.user?.is_following),
    );
    const [followingAuthorLoading, setFollowingAuthorLoading] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState<
        Record<number, string>
    >({});
    const [resultStates, setResultStates] = useState<
        Record<number, 'correct' | 'wrong' | null>
    >({});
    const displayedContent = formatFormulaText(
        translated?.content ?? post.content ?? '',
    );

    type QuizQuestion = {
        question: string | null;
        options: string[];
        answerIndex: number;
        creatorAnswer: string;
    };
    const quizData = useMemo((): { questions: QuizQuestion[] } | null => {
        const raw = post.quiz_data as
            | Record<string, unknown>
            | null
            | undefined;
        if (!raw) return null;

        // New multi-question format
        if (Array.isArray(raw.questions) && raw.questions.length > 0) {
            const questions: QuizQuestion[] = [];
            for (const q of raw.questions as Record<string, unknown>[]) {
                const opts = Array.isArray(q.options)
                    ? (q.options as unknown[]).filter(
                          (v): v is string => typeof v === 'string',
                      )
                    : [];
                const ai = Number(q.answer_index);
                if (
                    opts.length < 2 ||
                    Number.isNaN(ai) ||
                    ai < 0 ||
                    ai >= opts.length
                )
                    continue;
                questions.push({
                    question:
                        typeof q.question === 'string' ? q.question : null,
                    options: opts,
                    answerIndex: ai,
                    creatorAnswer: opts[ai] ?? '',
                });
            }
            return questions.length > 0 ? { questions } : null;
        }

        // Legacy single-question format
        const opts = Array.isArray(raw.options)
            ? (raw.options as unknown[]).filter(
                  (v): v is string => typeof v === 'string',
              )
            : [];
        const ai = Number(raw.answer_index);
        if (opts.length < 2 || Number.isNaN(ai) || ai < 0 || ai >= opts.length)
            return null;
        return {
            questions: [
                {
                    question: null,
                    options: opts,
                    answerIndex: ai,
                    creatorAnswer: opts[ai] ?? '',
                },
            ],
        };
    }, [post.quiz_data]);

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
    }, [
        post.comments?.length,
        post.comments_count,
        post.is_liked,
        post.likes_count,
        post.is_saved,
        post.saves_count,
        post.user?.is_following,
    ]);

    useEffect(() => {
        const attempts = Array.isArray(post.quiz_attempts) ? post.quiz_attempts : [];
        if (attempts.length === 0) {
            setSelectedAnswers({});
            setResultStates({});
            return;
        }

        const nextSelected: Record<number, string> = {};
        const nextResults: Record<number, 'correct' | 'wrong' | null> = {};

        for (const attempt of attempts) {
            const qIndex = Number(attempt.question_index);
            const selectedIndex = Number(attempt.selected_answer_index);
            if (Number.isNaN(qIndex) || Number.isNaN(selectedIndex) || qIndex < 0 || selectedIndex < 0) {
                continue;
            }

            const question = quizData?.questions[qIndex];
            if (!question || selectedIndex >= question.options.length) {
                continue;
            }

            nextSelected[qIndex] = String(selectedIndex);
            nextResults[qIndex] = attempt.is_correct ? 'correct' : 'wrong';
        }

        setSelectedAnswers(nextSelected);
        setResultStates(nextResults);
    }, [post.id, post.quiz_attempts, quizData]);

    useEffect(() => {
        const url = new URL(window.location.href);
        const shouldFocusComments =
            window.location.hash === '#comments' ||
            url.searchParams.get('focus') === 'comments';

        if (!shouldFocusComments) {
            return;
        }

        const firstFrame = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                scrollCommentsInAppContent(document.getElementById('comments'));
            });
        });

        const clearHashTimeout = window.setTimeout(() => {
            const cleanUrl = new URL(window.location.href);
            cleanUrl.hash = '';
            cleanUrl.searchParams.delete('focus');
            const query = cleanUrl.searchParams.toString();

            window.history.replaceState(
                null,
                '',
                `${cleanUrl.pathname}${query ? `?${query}` : ''}`,
            );
        }, 420);

        return () => {
            cancelAnimationFrame(firstFrame);
            window.clearTimeout(clearHashTimeout);
        };
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
        setLikesCount((count) =>
            Math.max(0, count + (optimisticLiked ? 1 : -1)),
        );

        router.post(
            like.toggle.url({ posts: postId }),
            {},
            {
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
                        nextPost.comments_count ??
                            nextPost.comments?.length ??
                            0,
                    );
                },
                onFinish: () => {
                    setLiking(false);
                },
            },
        );
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
        setSavesCount((count) =>
            Math.max(0, count + (optimisticSaved ? 1 : -1)),
        );

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

            const payload = (await response.json()) as {
                is_following: boolean;
            };
            setIsFollowingAuthor(payload.is_following);
        } catch {
            setIsFollowingAuthor(previous);
        } finally {
            setFollowingAuthorLoading(false);
        }
    };

    const handleEditStart = () => {
        if (!canManagePost) {
            return;
        }

        setEditTitle(post.title);
        setEditContent(post.content ?? '');
        setEditErrors({});
        setIsEditing(true);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditErrors({});
    };

    const handleEditSave = () => {
        setEditLoading(true);
        setEditErrors({});

        router.patch(
            `/posts/${post.id}`,
            { title: editTitle, content: editContent },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditing(false);
                },
                onError: (errors) => {
                    setEditErrors(errors as Record<string, string>);
                },
                onFinish: () => {
                    setEditLoading(false);
                },
            },
        );
    };

    const handleDeleteConfirm = () => {
        if (!canManagePost) {
            return;
        }

        setDeleteLoading(true);

        router.delete(`/posts/${post.id}`, {
            onError: () => {
                setDeleteLoading(false);
                setShowDeleteModal(false);
            },
        });
    };

    const handleCommentClick = () => {
        const commentsSection = document.getElementById('comments');

        if (!commentsSection) {
            return;
        }

        scrollCommentsInAppContent(commentsSection);
    };

    const handleCheckAnswer = async (qIndex: number) => {
        if (!quizData) return;
        const selected = selectedAnswers[qIndex];
        if (selected === undefined || selected === '') return;

        const question = quizData.questions[qIndex];
        if (!question) return;

        const chosenIndex = Number(selected);
        const isCorrect = chosenIndex === question.answerIndex;
        setResultStates((prev) => ({
            ...prev,
            [qIndex]: isCorrect ? 'correct' : 'wrong',
        }));

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';
        try {
            const response = await fetch(`/posts/${post.id}/complete-quiz`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    question_index: qIndex,
                    answer_index: chosenIndex,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save quiz status.');
            }
        } catch {
            console.error('Failed to save quiz status for Mistake Review.');
        }
    };

    return (
        <>
            <Head title={translated?.title ?? post.title} />

            <div className="w-full bg-white pb-40">
                <div className="mx-auto w-full max-w-3xl">
                    <div className="flex items-center justify-between px-4 pt-7 pb-6">
                        <div className="mb-5 flex items-center gap-6">
                            <Link
                                href={homePage()}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-sidebar-border bg-background from-[#ef99b0] to-[#e27193] text-foreground hover:border-2 hover:border-[#e27193] hover:bg-linear-to-r hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            {isAnonymousPost ? (
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-11 w-11 shrink-0 overflow-hidden ring-2 ring-transparent">
                                        <AvatarFallback className="bg-zinc-200 text-base font-bold text-zinc-700">
                                            ?
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col leading-tight">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-4 flex flex-wrap items-center gap-3 text-base">
                                                <span className="font-semibold text-zinc-900">
                                                    {displayName}
                                                </span>
                                                <span className="text-zinc-400">
                                                    •
                                                </span>
                                                <span className="text-sm text-zinc-500">
                                                    {formatTimeAgo(
                                                        post.created_at,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                                                {(() => {
                                                    const type =
                                                        post.post_type ===
                                                        'quiz'
                                                            ? 'quiz'
                                                            : post.post_type ===
                                                                'question'
                                                              ? 'question'
                                                              : 'material';
                                                    const { bg, text } =
                                                        getPostTypeBadgeProps(
                                                            type,
                                                        );
                                                    const label =
                                                        type === 'quiz'
                                                            ? trans(
                                                                  'createPost.create_quiz',
                                                                  page,
                                                              )
                                                            : type ===
                                                                'question'
                                                              ? trans(
                                                                    'createPost.ask_question',
                                                                    page,
                                                                )
                                                              : trans(
                                                                    'createPost.share_material',
                                                                    page,
                                                                );

                                                    return (
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}
                                                        >
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                                {(() => {
                                                    const code =
                                                        post.language?.code ||
                                                        'en';
                                                    const { bg, text } =
                                                        getLangBadgeProps(code);
                                                    const label = trans(
                                                        `language_label.${code}`,
                                                        page,
                                                    );
                                                    return (
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}
                                                        >
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                                {post.subject?.name
                                                    ? (() => {
                                                          const { bg, text } =
                                                              getSubjectBadgeProps();
                                                          return (
                                                              <span
                                                                  className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}
                                                              >
                                                                  {
                                                                      post
                                                                          .subject
                                                                          .name
                                                                  }
                                                              </span>
                                                          );
                                                      })()
                                                    : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href={
                                            post.user?.id
                                                ? `/profilePage/${post.user.id}`
                                                : '/profilePage'
                                        }
                                        className="peer group/avatar cursor-pointer"
                                    >
                                        <Avatar className="h-11 w-11 shrink-0 overflow-hidden ring-2 ring-transparent transition-colors group-hover/avatar:ring-[#ef99b0]">
                                            {post.user?.avatar ? (
                                                <AvatarImage
                                                    src={post.user.avatar}
                                                    alt={
                                                        post.user?.name ??
                                                        'User avatar'
                                                    }
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
                                                    href={
                                                        post.user?.id
                                                            ? `/profilePage/${post.user.id}`
                                                            : '/profilePage'
                                                    }
                                                    className="cursor-pointer font-semibold text-zinc-900 transition-colors peer-hover:text-[#de6b89] hover:text-[#de6b89]"
                                                >
                                                    {displayName}
                                                </Link>
                                                {post.user?.id &&
                                                currentUserId &&
                                                post.user.id !==
                                                    currentUserId ? (
                                                    <BtnFollow
                                                        following={
                                                            isFollowingAuthor
                                                        }
                                                        loading={
                                                            followingAuthorLoading
                                                        }
                                                        onClick={() => {
                                                            void handleFollowAuthor();
                                                        }}
                                                    />
                                                ) : null}
                                                <span className="text-zinc-400">
                                                    •
                                                </span>
                                                <span className="text-sm text-zinc-500">
                                                    {formatTimeAgo(
                                                        post.created_at,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                                                {(() => {
                                                    const type =
                                                        post.post_type ===
                                                        'quiz'
                                                            ? 'quiz'
                                                            : post.post_type ===
                                                                'question'
                                                              ? 'question'
                                                              : 'material';
                                                    const { bg, text } =
                                                        getPostTypeBadgeProps(
                                                            type,
                                                        );
                                                    const label =
                                                        type === 'quiz'
                                                            ? trans(
                                                                  'createPost.create_quiz',
                                                                  page,
                                                              )
                                                            : type ===
                                                                'question'
                                                              ? trans(
                                                                    'createPost.ask_question',
                                                                    page,
                                                                )
                                                              : trans(
                                                                    'createPost.share_material',
                                                                    page,
                                                                );

                                                    return (
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}
                                                        >
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                                {(() => {
                                                    const code =
                                                        post.language?.code ||
                                                        'en';
                                                    const { bg, text } =
                                                        getLangBadgeProps(code);
                                                    const label = trans(
                                                        `language_label.${code}`,
                                                        page,
                                                    );
                                                    return (
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}
                                                        >
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                                {post.subject?.name
                                                    ? (() => {
                                                          const { bg, text } =
                                                              getSubjectBadgeProps();
                                                          return (
                                                              <span
                                                                  className={`rounded-full px-2 py-0.5 font-medium ${bg} ${text}`}
                                                              >
                                                                  {
                                                                      post
                                                                          .subject
                                                                          .name
                                                                  }
                                                              </span>
                                                          );
                                                      })()
                                                    : null}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {isEditing ? (
                        <div className="px-4 pt-2 pb-4">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                maxLength={150}
                                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-2xl font-bold text-zinc-950 focus:border-[#e27193] focus:outline-none"
                            />
                            {editErrors.title && (
                                <p className="mt-1 text-sm text-rose-600">
                                    {editErrors.title}
                                </p>
                            )}
                        </div>
                    ) : (
                        <h1 className="px-4 pt-2 pb-7 text-2xl leading-snug font-bold text-zinc-950">
                            {translated?.title ?? post.title}
                        </h1>
                    )}
                    {isEditing ? (
                        <div className="px-4 pb-6">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                maxLength={2000}
                                rows={10}
                                className="w-full resize-y rounded-xl border border-zinc-300 px-3 py-2 text-base leading-7 text-zinc-700 focus:border-[#e27193] focus:outline-none"
                            />
                            {editErrors.content && (
                                <p className="mt-1 text-sm text-rose-600">
                                    {editErrors.content}
                                </p>
                            )}
                            <div className="mt-3 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleEditSave}
                                    disabled={editLoading}
                                    className="rounded-full bg-[#e27193] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#d05a7e] disabled:opacity-60"
                                >
                                    {editLoading
                                        ? trans('createPost.saving', page)
                                        : trans(
                                              'createPost.save_changes',
                                              page,
                                          )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleEditCancel}
                                    disabled={editLoading}
                                    className="rounded-full bg-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-300 disabled:opacity-60"
                                >
                                    {trans('createPost.cancel', page)}
                                </button>
                            </div>
                        </div>
                    ) : (
                        displayedContent && (
                            <p className="px-4 pb-7 text-base leading-7 whitespace-pre-wrap text-zinc-700">
                                {displayedContent}
                            </p>
                        )
                    )}
                    {post.video_url && getEmbedUrl(post.video_url) ? (
                        <div className="mx-4 mb-7 overflow-hidden rounded-xl border border-zinc-200 bg-black aspect-video">
                            <iframe
                                src={getEmbedUrl(post.video_url)!}
                                title="Video"
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    ) : null}
                    {post.post_type === 'quiz' && quizData ? (
                        <div className="mx-4 mb-7 space-y-4">
                            {quizData.questions.map((question, qIndex) => {
                                const selected = selectedAnswers[qIndex] ?? '';
                                const result = resultStates[qIndex] ?? null;

                                return (
                                    <div
                                        key={qIndex}
                                        className="rounded-2xl border-[1.5px] border-amber-300 bg-amber-50/40 p-4"
                                    >
                                        {quizData.questions.length > 1 && (
                                            <p className="mb-1 text-xs font-bold tracking-wider text-amber-600 uppercase">
                                                Q{qIndex + 1}
                                            </p>
                                        )}
                                        {question.question && (
                                            <p className="mb-2 text-sm font-semibold text-zinc-800">
                                                {question.question}
                                            </p>
                                        )}
                                        <p className="text-sm font-semibold text-amber-800">
                                            {trans(
                                                'createPost.quiz_take_label',
                                                page,
                                            )}
                                        </p>
                                        <div className="mt-3 space-y-2">
                                            {question.options.map(
                                                (option, index) => {
                                                    const optionLabel =
                                                        String.fromCharCode(
                                                            65 + index,
                                                        );
                                                    return (
                                                        <label
                                                            key={optionLabel}
                                                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-zinc-700"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`quiz-option-${post.id}-${qIndex}`}
                                                                value={index}
                                                                checked={
                                                                    selected ===
                                                                    String(
                                                                        index,
                                                                    )
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    setSelectedAnswers(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [qIndex]:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    );
                                                                    setResultStates(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [qIndex]:
                                                                                null,
                                                                        }),
                                                                    );
                                                                }}
                                                                className="h-4 w-4 accent-amber-600"
                                                            />
                                                            <span className="font-semibold text-amber-700">
                                                                {optionLabel}.
                                                            </span>
                                                            <span>
                                                                {option}
                                                            </span>
                                                        </label>
                                                    );
                                                },
                                            )}
                                        </div>

                                        <BtnAiAns
                                            page={page}
                                            trans={trans}
                                            question={
                                                question.question ?? post.title
                                            }
                                            options={question.options}
                                            creatorAnswer={
                                                question.creatorAnswer
                                            }
                                            selected={selected}
                                            manualResult={result}
                                            onCheckAnswer={() =>
                                                void handleCheckAnswer(qIndex)
                                            }
                                        />

                                        {selected === '' && (
                                            <p className="mt-2 text-xs text-amber-700">
                                                {trans(
                                                    'createPost.quiz_select_required',
                                                    page,
                                                )}
                                            </p>
                                        )}
                                        {result === 'correct' && (
                                            <p className="mt-3 text-sm font-semibold text-emerald-700">
                                                {trans(
                                                    'createPost.quiz_correct',
                                                    page,
                                                )}
                                            </p>
                                        )}
                                        {result === 'wrong' && (
                                            <p className="mt-3 text-sm font-semibold text-rose-700">
                                                {trans(
                                                    'createPost.quiz_wrong',
                                                    page,
                                                )}{' '}
                                                {trans(
                                                    'createPost.quiz_correct_answer_prefix',
                                                    page,
                                                )}{' '}
                                                {String.fromCharCode(
                                                    65 + question.answerIndex,
                                                )}
                                                .
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                    <Suspense
                        fallback={
                            <div className="h-64 rounded-xl bg-zinc-100" />
                        }
                    >
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
                        isOwner={canManagePost}
                        onEdit={handleEditStart}
                        onDelete={() => setShowDeleteModal(true)}
                        editLabel={trans('createPost.edit_post', page)}
                        deleteLabel={trans('createPost.delete_post', page)}
                    />

                    <div className="my-3 flex flex-wrap items-center gap-3 px-4">
                        <BtnAiTranslate
                            className="my-0"
                            title={post.title}
                            content={post.content ?? ''}
                            onTranslate={setTranslated}
                        />
                    </div>
                    <div className="my-10 w-full border-t border-zinc-200"></div>
                    <div id="comments" className="scroll-mt-40 pb-32">
                        <CommentSection
                            post={post}
                            onCommentsCountChange={setCommentsCount}
                        />
                    </div>
                </div>
            </div>
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    onClick={() => {
                        if (!deleteLoading) setShowDeleteModal(false);
                    }}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="mb-2 text-lg font-bold text-zinc-900">
                            {trans('createPost.delete_confirm_title', page)}
                        </h2>
                        <p className="mb-6 text-sm text-zinc-600">
                            {trans('createPost.delete_confirm_message', page)}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleteLoading}
                                className="rounded-full bg-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-300 disabled:opacity-60"
                            >
                                {trans('createPost.cancel', page)}
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                disabled={deleteLoading}
                                className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                            >
                                {deleteLoading
                                    ? trans('createPost.deleting', page)
                                    : trans(
                                          'createPost.delete_confirm_yes',
                                          page,
                                      )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
    isOwner: boolean;
    onEdit: () => void;
    onDelete: () => void;
    editLabel: string;
    deleteLabel: string;
};

function PostFooter({
    postId,
    likes,
    saves,
    liked,
    saved,
    loading = false,
    saveLoading = false,
    onLike,
    onSave,
    comments,
    onComment,
    isOwner,
    onEdit,
    onDelete,
    editLabel,
    deleteLabel,
}: PostFooterProps) {
    return (
        <div className="mt-7 mb-3 flex flex-wrap items-center gap-5 px-4 text-sm text-zinc-900">
            <BtnLike
                count={likes}
                liked={liked}
                loading={loading}
                onClick={() => onLike(postId)}
            />
            <BtnComment count={comments} onClick={onComment} />
            <BtnSave
                count={saves}
                saved={saved}
                loading={saveLoading}
                onClick={() => onSave(postId)}
            />
            <BtnShare postId={postId} />
            {isOwner && (
                <>
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-200 px-3.5 py-1.5 text-sm font-semibold text-zinc-600 transition-colors select-none hover:bg-linear-to-r hover:from-blue-400 hover:to-blue-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                    >
                        {editLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-200 px-3.5 py-1.5 text-sm font-semibold text-zinc-600 transition-colors select-none hover:bg-linear-to-r hover:from-rose-400 hover:to-rose-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                    >
                        {deleteLabel}
                    </button>
                </>
            )}
        </div>
    );
}

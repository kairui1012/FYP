import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { CommentSection } from '@/components/comment-section';
import { PostActionFooter } from '@/components/post-content/post-action-footer';
import { PostAttachmentsSection } from '@/components/post-content/post-attachments-section';
import { PostBackAuthorHeader } from '@/components/post-content/post-back-author-header';
import { trans } from '@/components/post-content/post-content-config';
import { PostDeleteModal } from '@/components/post-content/post-delete-modal';
import { PostEditableBody } from '@/components/post-content/post-editable-body';
import { PostQuizPanel } from '@/components/post-content/post-quiz-panel';
import { PostTranslateActions } from '@/components/post-content/post-translate-actions';
import { PostVideoEmbed } from '@/components/post-content/post-video-embed';
import type {
    PostContentProps,
    QuizData,
    QuizQuestion,
    QuizResultState,
} from '@/components/post-content/types';
import AppLayout from '@/layouts/app-layout';
import { formatFormulaText } from '@/lib/formula-display';
import { homePage } from '@/routes';
import like from '@/routes/like';
import type { BreadcrumbItem, PostItem } from '@/types';

function csrfHeaders(contentType?: 'json') {
    const csrfToken =
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? '';

    return {
        Accept: 'application/json',
        ...(contentType === 'json'
            ? { 'Content-Type': 'application/json' }
            : {}),
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
    };
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
        Record<number, QuizResultState>
    >({});

    const displayedContent = formatFormulaText(
        translated?.content ?? post.content ?? '',
    );
    const quizData = useMemo((): QuizData | null => {
        const raw = post.quiz_data as
            | Record<string, unknown>
            | null
            | undefined;
        if (!raw) return null;

        if (Array.isArray(raw.questions) && raw.questions.length > 0) {
            const questions: QuizQuestion[] = [];
            for (const question of raw.questions as Record<string, unknown>[]) {
                const options = Array.isArray(question.options)
                    ? (question.options as unknown[]).filter(
                          (value): value is string => typeof value === 'string',
                      )
                    : [];
                const answerIndex = Number(question.answer_index);
                if (
                    options.length < 2 ||
                    Number.isNaN(answerIndex) ||
                    answerIndex < 0 ||
                    answerIndex >= options.length
                ) {
                    continue;
                }
                questions.push({
                    question:
                        typeof question.question === 'string'
                            ? question.question
                            : null,
                    options,
                    answerIndex,
                    creatorAnswer: options[answerIndex] ?? '',
                });
            }
            return questions.length > 0 ? { questions } : null;
        }

        const options = Array.isArray(raw.options)
            ? (raw.options as unknown[]).filter(
                  (value): value is string => typeof value === 'string',
              )
            : [];
        const answerIndex = Number(raw.answer_index);
        if (
            options.length < 2 ||
            Number.isNaN(answerIndex) ||
            answerIndex < 0 ||
            answerIndex >= options.length
        ) {
            return null;
        }

        return {
            questions: [
                {
                    question: null,
                    options,
                    answerIndex,
                    creatorAnswer: options[answerIndex] ?? '',
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
        const attempts = Array.isArray(post.quiz_attempts)
            ? post.quiz_attempts
            : [];
        if (attempts.length === 0) {
            setSelectedAnswers({});
            setResultStates({});
            return;
        }

        const nextSelected: Record<number, string> = {};
        const nextResults: Record<number, QuizResultState> = {};

        for (const attempt of attempts) {
            const questionIndex = Number(attempt.question_index);
            const selectedIndex = Number(attempt.selected_answer_index);
            if (
                Number.isNaN(questionIndex) ||
                Number.isNaN(selectedIndex) ||
                questionIndex < 0 ||
                selectedIndex < 0
            ) {
                continue;
            }

            const question = quizData?.questions[questionIndex];
            if (!question || selectedIndex >= question.options.length) {
                continue;
            }

            nextSelected[questionIndex] = String(selectedIndex);
            nextResults[questionIndex] = attempt.is_correct
                ? 'correct'
                : 'wrong';
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
                onSuccess: (pageResponse) => {
                    const nextPost = (pageResponse.props as { post?: PostItem })
                        .post;

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

        try {
            const response = await fetch(`/posts/${postId}/save`, {
                method: 'POST',
                headers: csrfHeaders(),
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
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        setFollowingAuthorLoading(true);
        setIsFollowingAuthor(optimistic);

        try {
            const response = await fetch(`/users/${userId}/follow`, {
                method: 'POST',
                signal: controller.signal,
                headers: csrfHeaders(),
            });

            if (!response.ok) {
                throw new Error('Follow toggle failed.');
            }

            const payload = (await response.json()) as {
                is_following: boolean;
            };
            setIsFollowingAuthor(payload.is_following);
            sessionStorage.setItem('followingPageDirty', '1');
        } catch {
            setIsFollowingAuthor(previous);
        } finally {
            clearTimeout(timeout);
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
        scrollCommentsInAppContent(document.getElementById('comments'));
    };

    const handleAnswerSelect = (questionIndex: number, value: string) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionIndex]: value,
        }));
        setResultStates((prev) => ({
            ...prev,
            [questionIndex]: null,
        }));
    };

    const handleCheckAnswer = async (questionIndex: number) => {
        if (!quizData) return;
        const selected = selectedAnswers[questionIndex];
        if (selected === undefined || selected === '') return;

        const question = quizData.questions[questionIndex];
        if (!question) return;

        const chosenIndex = Number(selected);
        const isCorrect = chosenIndex === question.answerIndex;
        setResultStates((prev) => ({
            ...prev,
            [questionIndex]: isCorrect ? 'correct' : 'wrong',
        }));

        try {
            const response = await fetch(`/posts/${post.id}/complete-quiz`, {
                method: 'POST',
                headers: csrfHeaders('json'),
                body: JSON.stringify({
                    question_index: questionIndex,
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

            <div className="w-full bg-white pb-20 sm:pb-40">
                <div className="mx-auto w-full max-w-3xl">
                    <PostBackAuthorHeader
                        post={post}
                        page={page}
                        backHref={homePage()}
                        currentUserId={currentUserId}
                        displayName={displayName}
                        isAnonymousPost={isAnonymousPost}
                        isFollowingAuthor={isFollowingAuthor}
                        followingAuthorLoading={followingAuthorLoading}
                        trans={trans}
                        onFollowAuthor={handleFollowAuthor}
                    />

                    <PostEditableBody
                        page={page}
                        isEditing={isEditing}
                        title={translated?.title ?? post.title}
                        content={displayedContent}
                        editTitle={editTitle}
                        editContent={editContent}
                        editErrors={editErrors}
                        editLoading={editLoading}
                        trans={trans}
                        onEditTitleChange={setEditTitle}
                        onEditContentChange={setEditContent}
                        onSave={handleEditSave}
                        onCancel={handleEditCancel}
                    />

                    <PostVideoEmbed videoUrl={post.video_url} />

                    {post.post_type === 'quiz' ? (
                        <PostQuizPanel
                            postId={post.id}
                            postTitle={post.title}
                            page={page}
                            quizData={quizData}
                            selectedAnswers={selectedAnswers}
                            resultStates={resultStates}
                            trans={trans}
                            onAnswerSelect={handleAnswerSelect}
                            onCheckAnswer={(questionIndex) => {
                                void handleCheckAnswer(questionIndex);
                            }}
                        />
                    ) : null}

                    <PostAttachmentsSection files={post.image} />

                    <PostActionFooter
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

                    <PostTranslateActions
                        page={page}
                        title={post.title}
                        content={post.content ?? ''}
                        postType={post.post_type}
                        onTranslate={setTranslated}
                    />

                    <div className="my-10 w-full border-t border-zinc-200" />
                    <div
                        id="comments"
                        className="scroll-mt-20 pb-16 sm:scroll-mt-40 sm:pb-32"
                    >
                        <CommentSection
                            post={post}
                            onCommentsCountChange={setCommentsCount}
                        />
                    </div>
                </div>
            </div>

            {showDeleteModal && (
                <PostDeleteModal
                    page={page}
                    loading={deleteLoading}
                    trans={trans}
                    onCancel={() => setShowDeleteModal(false)}
                    onConfirm={handleDeleteConfirm}
                />
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

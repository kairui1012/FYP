import { reactLang } from '@erag/lang-sync-inertia';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import type {
    EditableMaterialBlock,
    EditableMaterialBlockType,
} from '@/components/postContentPageComponent/material-editable-body';
import type {
    PostContentProps,
    QuizResultState,
} from '@/components/ts/features/post-content/post-content-types';
import {
    csrfHeaders,
    scrollCommentsInAppContent,
} from '@/components/ts/features/post-content/post-content-utils';
import { buildQuizData } from '@/components/ts/features/post-content/quiz/build-quiz-data';
import {
    createEditableMaterialBlock,
    normalizeEditableMaterialBlocks,
    revokeMaterialBlockPreviews,
} from '@/components/ts/features/post-content/study-material/material-editing-utils';
import { useMaterialEditActions } from '@/components/ts/features/post-content/study-material/use-material-edit-actions';
import postsLikes from '@/routes/posts/likes';
import type { MaterialContentBlock, PostItem } from '@/types';

type UsePostContentControllerParams = {
    post: PostContentProps['post'];
    pageProps: Record<string, unknown>;
};

export function usePostContentController({
    post,
    pageProps,
}: UsePostContentControllerParams) {
    const { trans } = reactLang();
    const currentUserId = (pageProps as { auth?: { user?: { id?: number } } })
        .auth?.user?.id;
    const currentUserRole =
        (pageProps as { auth?: { user?: { role?: string } } }).auth?.user
            ?.role ?? 'student';

    const isOwner =
        post.is_owner === true ||
        Boolean(currentUserId && post.user?.id === currentUserId);
    const isAnonymousPost = Boolean(post.is_anonymous);
    const canPublishStudyMaterial = ['admin', 'teacher'].includes(
        currentUserRole,
    );
    const canViewLearningAnalytics = currentUserRole === 'teacher';
    const canManageMaterial =
        post.post_type === 'material' && canPublishStudyMaterial && isOwner;
    const canManagePost =
        post.post_type === 'material' ? canManageMaterial : isOwner;
    const displayName = isAnonymousPost
        ? trans('profile.anonymous_user')
        : (post.user?.name ?? trans('profile.unknown_user'));

    const [translated, setTranslated] = useState<{
        title: string;
        content: string;
    } | null>(null);
    const [translatedMaterialBlocks, setTranslatedMaterialBlocks] = useState<
        MaterialContentBlock[] | null
    >(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(post.title);
    const [editContent, setEditContent] = useState(post.content ?? '');
    const [materialEditBlocks, setMaterialEditBlocks] = useState<
        EditableMaterialBlock[]
    >([]);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [editLoading, setEditLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [reported, setReported] = useState(false);
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

    const materialEditBlocksRef = useRef<EditableMaterialBlock[]>([]);
    const {
        updateMaterialEditBlock,
        updateMaterialEditBlockFile,
        removeMaterialEditBlock,
        moveMaterialEditBlock,
        handleMaterialEditSave,
    } = useMaterialEditActions({
        canManageMaterial,
        postId: post.id,
        editTitle,
        materialEditBlocks,
        materialEditBlocksRef,
        setMaterialEditBlocks,
        setEditLoading,
        setEditErrors,
        setIsEditing,
    });

    const displayedContent = translated?.content ?? post.content ?? '';
    const displayedMaterialBlocks = useMemo(() => {
        if (post.post_type !== 'material') {
            return post.content_blocks ?? null;
        }

        return translatedMaterialBlocks ?? post.content_blocks ?? null;
    }, [post.content_blocks, post.post_type, translatedMaterialBlocks]);
    const quizData = useMemo(
        () =>
            buildQuizData(
                post.quiz_data as Record<string, unknown> | null | undefined,
            ),
        [post.quiz_data],
    );

    useEffect(() => {
        document.documentElement.classList.remove('nprogress-busy');
        document.body.classList.remove('nprogress-busy');
        document.documentElement.style.cursor = '';
        document.body.style.cursor = '';
    }, []);

    useEffect(() => {
        materialEditBlocksRef.current = materialEditBlocks;
    }, [materialEditBlocks]);

    useEffect(() => {
        return () => {
            materialEditBlocksRef.current.forEach((block) => {
                if (block.preview) {
                    URL.revokeObjectURL(block.preview);
                }
            });
        };
    }, []);

    useEffect(() => {
        setIsLiked(Boolean(post.is_liked));
        setLikesCount(post.likes_count ?? 0);
        setCommentsCount(post.comments_count ?? post.comments?.length ?? 0);
        setIsSaved(Boolean(post.is_saved));
        setSavesCount(post.saves_count ?? 0);
        setIsFollowingAuthor(Boolean(post.user?.is_following));
        setTranslatedMaterialBlocks(null);
    }, [
        post.comments?.length,
        post.comments_count,
        post.is_liked,
        post.likes_count,
        post.is_saved,
        post.saves_count,
        post.user?.is_following,
        post.id,
    ]);

    const materialTranslationTexts = useMemo(
        () =>
            (post.content_blocks ?? [])
                .filter(
                    (
                        block,
                    ): block is Extract<
                        MaterialContentBlock,
                        { type: 'text' }
                    > => block.type === 'text',
                )
                .map((block) => block.text),
        [post.content_blocks],
    );

    const handleMaterialTextBlocksTranslate = (
        translations: Record<string, string>,
    ) => {
        if (post.post_type !== 'material') {
            return;
        }

        setTranslatedMaterialBlocks(
            (post.content_blocks ?? []).map((block) => {
                if (block.type !== 'text') {
                    return block;
                }

                return {
                    ...block,
                    text: translations[block.text] ?? block.text,
                };
            }),
        );
    };

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
            postsLikes.toggle.url({ posts: postId }),
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
            const response = await fetch(`/posts/${postId}/bookmark`, {
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
        if (post.post_type === 'material') {
            revokeMaterialBlockPreviews(materialEditBlocksRef.current);
            setMaterialEditBlocks(
                normalizeEditableMaterialBlocks(
                    post.content_blocks,
                    post.content ?? '',
                ),
            );
        }
        setEditErrors({});
        setIsEditing(true);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditErrors({});
        revokeMaterialBlockPreviews(materialEditBlocksRef.current);
        setMaterialEditBlocks([]);
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

    const addMaterialEditBlock = (type: EditableMaterialBlockType) => {
        setMaterialEditBlocks((prev) => [
            ...prev,
            createEditableMaterialBlock(type),
        ]);
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

    const handleReportPost = async () => {
        if (isOwner || reportLoading || reported) {
            return;
        }

        setReportLoading(true);

        try {
            const response = await fetch(`/posts/${post.id}/report`, {
                method: 'POST',
                headers: csrfHeaders('json'),
                body: JSON.stringify({
                    reason: 'inappropriate',
                }),
            });

            const payload = (await response.json().catch(() => null)) as {
                message?: string;
            } | null;

            if (response.ok || payload?.message === 'Already reported.') {
                setReported(true);
                toast.success(trans('comment.report_sent'));
            } else {
                toast.error(trans('comment.report_failed'));
            }
        } finally {
            setReportLoading(false);
        }
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

    return {
        currentUserId,
        canViewLearningAnalytics,
        displayName,
        isAnonymousPost,
        canManagePost,
        translated,
        isEditing,
        editTitle,
        editContent,
        materialEditBlocks,
        editErrors,
        editLoading,
        showDeleteModal,
        deleteLoading,
        reportLoading,
        reported,
        isLiked,
        likesCount,
        commentsCount,
        isSaved,
        savesCount,
        liking,
        saving,
        isFollowingAuthor,
        followingAuthorLoading,
        selectedAnswers,
        resultStates,
        displayedContent,
        displayedMaterialBlocks,
        materialTranslationTexts,
        quizData,
        linkedQuizzes: post.linked_quizzes ?? [],
        analytics: post.learning_analytics,
        setTranslated,
        handleMaterialTextBlocksTranslate,
        setShowDeleteModal,
        setEditTitle,
        setEditContent,
        setCommentsCount,
        updateMaterialEditBlock,
        updateMaterialEditBlockFile,
        removeMaterialEditBlock,
        moveMaterialEditBlock,
        handleMaterialEditSave,
        handleLike,
        handleSave,
        handleFollowAuthor,
        handleEditStart,
        handleEditCancel,
        handleEditSave,
        addMaterialEditBlock,
        handleDeleteConfirm,
        handleCommentClick,
        handleReportPost,
        handleAnswerSelect,
        handleCheckAnswer,
    };
}

import { Link, usePage } from '@inertiajs/react';
import {
    Brain,
    Lightbulb,
    LoaderCircle,
    Pencil,
    Send,
    Star,
    Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatFullDate, formatTimeAgo } from '@/lib/post-utils';
import { cn } from '@/lib/utils';
import type { CommentItem, PostItem, User } from '@/types';

type CommentSectionProps = {
    post: PostItem;
    onCommentsCountChange?: (count: number) => void;
};

type CommentStoreResponse = {
    comment?: CommentItem;
    comments?: CommentItem[];
    comments_count?: number;
    errors?: Record<string, string[]>;
};

type SharedPageProps = {
    auth: {
        user: User;
    };
    lang?: Record<string, unknown>;
};
function trans(
    page: { props?: { lang?: Record<string, unknown> } },
    key: string,
    replacements: Record<string, string | number> = {},
) {
    const parts = key.split('.');
    let obj: unknown = page.props?.lang;

    for (const part of parts) {
        if (obj && typeof obj === 'object' && part in obj) {
            obj = (obj as Record<string, unknown>)[part];
        } else {
            return key;
        }
    }

    if (typeof obj !== 'string') {
        return key;
    }

    return Object.entries(replacements).reduce(
        (result, [placeholder, value]) =>
            result.replaceAll(`:${placeholder}`, String(value)),
        obj,
    );
}

export function CommentSection({
    post,
    onCommentsCountChange,
}: CommentSectionProps) {
    const page = usePage<SharedPageProps>();
    const currentUser = page.props.auth.user;
    const t = {
        title: trans(page, 'comment.title'),
        single: trans(page, 'comment.single'),
        plural: trans(page, 'comment.plural'),
        writePlaceholder: trans(page, 'comment.write_placeholder'),
        postComment: trans(page, 'comment.post_comment'),
        posting: trans(page, 'comment.posting'),
        noCommentsYet: trans(page, 'comment.no_comments_yet'),
        unknownUser: trans(page, 'comment.unknown_user'),
        writeRequired: trans(page, 'comment.write_required'),
        serverErrorPost: trans(page, 'comment.server_error_post'),
        failedPost: trans(page, 'comment.failed_post'),
        commentPosted: trans(page, 'comment.comment_posted'),
        genericPostError: trans(page, 'comment.generic_post_error'),
        reply: trans(page, 'comment.reply'),
        replyingTo: trans(page, 'comment.replying_to'),
        replyTo: trans(page, 'comment.reply_to'),
        cancelReply: trans(page, 'comment.cancel_reply'),
        edit: trans(page, 'comment.edit'),
        save: trans(page, 'comment.save'),
        cancelEdit: trans(page, 'comment.cancel_edit'),
        delete: trans(page, 'comment.delete'),
        deleting: trans(page, 'comment.deleting'),
        commentUpdated: trans(page, 'comment.comment_updated'),
        commentDeleted: trans(page, 'comment.comment_deleted'),
        failedUpdate: trans(page, 'comment.failed_update'),
        failedDelete: trans(page, 'comment.failed_delete'),
        layerLabel: trans(page, 'comment.layer_label'),
        floorLabel: trans(page, 'comment.floor_label'),
        bestAnswer: trans(page, 'comment.best_answer'),
        sortLatest: trans(page, 'comment.sort_latest'),
        sortTopLiked: trans(page, 'comment.sort_top_liked'),
    };
    const [comments, setComments] = useState<CommentItem[]>(
        post.comments ?? [],
    );
    const [sortMode, setSortMode] = useState<'latest' | 'top-liked'>('latest');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [replyingCommentId, setReplyingCommentId] = useState<number | null>(
        null,
    );
    const [replyContent, setReplyContent] = useState('');
    const [replySubmitting, setReplySubmitting] = useState(false);
    const [votingCommentIds, setVotingCommentIds] = useState<number[]>([]);
    const [deletingCommentIds, setDeletingCommentIds] = useState<number[]>([]);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(
        null,
    );
    const [editingContent, setEditingContent] = useState('');
    const [editingSubmitting, setEditingSubmitting] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setComments(post.comments ?? []);
    }, [post.comments]);

    useEffect(() => {
        onCommentsCountChange?.(countAllComments(comments));
    }, [comments, onCommentsCountChange]);

    useEffect(() => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return;
        }

        textarea.style.height = '0px';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
    }, [content]);

    const resetComposer = () => {
        setContent('');
        setErrorMessage(null);
    };

    const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        const nextValue = event.target.value;

        setContent(nextValue);
        setErrorMessage(null);
    };

    const submitComment = async () => {
        if (submitting) {
            return;
        }

        if (content.trim() === '') {
            setErrorMessage(t.writeRequired);
            return;
        }

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';
        const requestPayload: { content: string; parent_id?: number } = {
            content: content.trim(),
        };

        try {
            setSubmitting(true);
            setErrorMessage(null);

            const response = await fetch(`/posts/${post.id}/comments`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(requestPayload),
            });

            const responseType = response.headers.get('content-type') ?? '';
            const payload = responseType.includes('application/json')
                ? ((await response.json()) as CommentStoreResponse)
                : null;

            if (!response.ok) {
                const fallbackText = responseType.includes('application/json')
                    ? ''
                    : await response.text().catch(() => '');
                const nextError =
                    Object.values(payload?.errors ?? {})
                        .flat()
                        .find(Boolean) ??
                    (response.status >= 500
                        ? t.serverErrorPost
                        : fallbackText.trim() || t.failedPost);

                setErrorMessage(nextError);
                toast.error(nextError);
                return;
            }

            if (!payload?.comment && !payload?.comments) {
                throw new Error('Comment created but no payload was returned.');
            }

            if (payload?.comments) {
                setComments(payload.comments);
                onCommentsCountChange?.(
                    payload.comments_count ??
                        countAllComments(payload.comments),
                );
                resetComposer();
                toast.success(t.commentPosted);
                return;
            }

            setComments((previous) => {
                const nextComments = [payload.comment!, ...previous];
                onCommentsCountChange?.(
                    payload.comments_count ?? countAllComments(nextComments),
                );
                return nextComments;
            });

            resetComposer();
            toast.success(t.commentPosted);
        } catch (error) {
            const nextError =
                error instanceof Error && error.message.trim() !== ''
                    ? error.message
                    : t.genericPostError;
            setErrorMessage(nextError);
            toast.error(nextError);
        } finally {
            setSubmitting(false);
        }
    };

    const submitReply = async (parentCommentId: number) => {
        if (replySubmitting) {
            return;
        }

        if (replyContent.trim() === '') {
            toast.error(t.writeRequired);
            return;
        }

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';

        try {
            setReplySubmitting(true);

            const response = await fetch(`/posts/${post.id}/comments`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    content: replyContent.trim(),
                    parent_id: parentCommentId,
                }),
            });

            const responseType = response.headers.get('content-type') ?? '';
            const payload = responseType.includes('application/json')
                ? ((await response.json()) as CommentStoreResponse)
                : null;

            if (!response.ok || !payload?.comments) {
                const nextError =
                    Object.values(payload?.errors ?? {})
                        .flat()
                        .find(Boolean) ?? t.failedPost;
                throw new Error(nextError);
            }

            setComments(payload.comments);
            onCommentsCountChange?.(
                payload.comments_count ?? countAllComments(payload.comments),
            );
            setReplyingCommentId(null);
            setReplyContent('');
            toast.success(t.commentPosted);
        } catch (error) {
            const nextError =
                error instanceof Error && error.message.trim() !== ''
                    ? error.message
                    : t.genericPostError;
            toast.error(nextError);
        } finally {
            setReplySubmitting(false);
        }
    };

    const handleUpdateComment = async (commentId: number) => {
        if (editingSubmitting || editingContent.trim() === '') {
            if (editingContent.trim() === '') {
                toast.error(t.writeRequired);
            }
            return;
        }

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';

        try {
            setEditingSubmitting(true);

            const response = await fetch(`/comments/${commentId}`, {
                method: 'PATCH',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    content: editingContent.trim(),
                }),
            });

            const responseType = response.headers.get('content-type') ?? '';
            const payload = responseType.includes('application/json')
                ? ((await response.json()) as CommentStoreResponse)
                : null;

            if (!response.ok || !payload?.comments) {
                const nextError =
                    Object.values(payload?.errors ?? {})
                        .flat()
                        .find(Boolean) ?? t.failedUpdate;
                throw new Error(nextError);
            }

            setComments(payload.comments);
            setEditingCommentId(null);
            setEditingContent('');
            toast.success(t.commentUpdated);
        } catch (error) {
            const nextError =
                error instanceof Error && error.message.trim() !== ''
                    ? error.message
                    : t.failedUpdate;
            toast.error(nextError);
        } finally {
            setEditingSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (deletingCommentIds.includes(commentId)) {
            return;
        }

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';

        setDeletingCommentIds((previous) => [...previous, commentId]);

        try {
            const response = await fetch(`/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const responseType = response.headers.get('content-type') ?? '';
            const payload = responseType.includes('application/json')
                ? ((await response.json()) as CommentStoreResponse)
                : null;

            if (!response.ok || !payload?.comments) {
                const nextError =
                    Object.values(payload?.errors ?? {})
                        .flat()
                        .find(Boolean) ?? t.failedDelete;
                throw new Error(nextError);
            }

            setComments(payload.comments);
            if (editingCommentId === commentId) {
                setEditingCommentId(null);
                setEditingContent('');
            }
            toast.success(t.commentDeleted);
        } catch (error) {
            const nextError =
                error instanceof Error && error.message.trim() !== ''
                    ? error.message
                    : t.failedDelete;
            toast.error(nextError);
        } finally {
            setDeletingCommentIds((previous) =>
                previous.filter((id) => id !== commentId),
            );
        }
    };

    const handleReplyClick = (comment: CommentItem) => {
        setReplyingCommentId(comment.id);
        setReplyContent('');
    };

    const handleToggleCommentVote = async (
        commentId: number,
        direction: 'up' | 'down',
    ) => {
        if (votingCommentIds.includes(commentId)) {
            return;
        }

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';

        setVotingCommentIds((previous) => [...previous, commentId]);

        try {
            const response = await fetch(`/comments/${commentId}/vote`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ direction }),
            });

            if (!response.ok) {
                const responseType = response.headers.get('content-type') ?? '';
                let nextError = trans(page, 'comment.generic_post_error');

                if (responseType.includes('application/json')) {
                    const payload = (await response
                        .json()
                        .catch(() => null)) as {
                        message?: string;
                        errors?: Record<string, string[]>;
                    } | null;

                    nextError =
                        Object.values(payload?.errors ?? {})
                            .flat()
                            .find(Boolean) ??
                        payload?.message ??
                        nextError;
                } else {
                    const text = await response.text().catch(() => '');
                    if (text.trim() !== '') {
                        nextError = text.trim();
                    }
                }

                throw new Error(nextError);
            }

            const payload = (await response.json()) as {
                vote: number | null;
                is_upvoted: boolean;
                is_downvoted: boolean;
                upvotes_count: number;
                downvotes_count: number;
                score: number;
            };

            setComments((previous) =>
                sortCommentTreeByMode(
                    updateCommentTree(previous, commentId, (item) => ({
                        ...item,
                        user_vote: payload.vote ?? 0,
                        is_liked: payload.is_upvoted,
                        is_upvoted: payload.is_upvoted,
                        is_downvoted: payload.is_downvoted,
                        likes_count: payload.upvotes_count,
                        upvotes_count: payload.upvotes_count,
                        downvotes_count: payload.downvotes_count,
                        score: payload.score,
                    })),
                    sortMode,
                ),
            );
        } catch (error) {
            const nextError =
                error instanceof Error && error.message.trim() !== ''
                    ? error.message
                    : t.genericPostError;
            toast.error(nextError);
        } finally {
            setVotingCommentIds((previous) =>
                previous.filter((id) => id !== commentId),
            );
        }
    };

    const commentDisplayMeta = buildCommentDisplayMeta(comments);

    const renderCommentBranch = (
        comment: CommentItem,
        isRoot: boolean,
        isBestAnswer = false,
    ): ReactNode => {
        const displayMeta = commentDisplayMeta.get(comment.id);
        const floor = displayMeta?.floor ?? 1;
        const depth = displayMeta?.layer ?? comment.depth ?? 1;

        return (
            <div
                key={comment.id}
                className={cn(
                    isBestAnswer
                        ? 'py-2'
                        : isRoot
                          ? 'border-t border-zinc-200/80 py-4'
                          : 'mt-3 ml-6 border-l border-zinc-200 pl-4',
                )}
            >
                <CommentCard
                    comment={comment}
                    floor={floor}
                    depth={depth}
                    isBestAnswer={isBestAnswer}
                    onReply={() => handleReplyClick(comment)}
                    onUpvote={() =>
                        void handleToggleCommentVote(comment.id, 'up')
                    }
                    onDownvote={() =>
                        void handleToggleCommentVote(comment.id, 'down')
                    }
                    onStartEdit={() => {
                        setEditingCommentId(comment.id);
                        setEditingContent(comment.content);
                    }}
                    onCancelEdit={() => {
                        setEditingCommentId(null);
                        setEditingContent('');
                    }}
                    onSaveEdit={() => void handleUpdateComment(comment.id)}
                    onDelete={() => void handleDeleteComment(comment.id)}
                    replying={replyingCommentId === comment.id}
                    replyContent={
                        replyingCommentId === comment.id ? replyContent : ''
                    }
                    onReplyContentChange={setReplyContent}
                    onSubmitReply={() => void submitReply(comment.id)}
                    onCancelReply={() => {
                        setReplyingCommentId(null);
                        setReplyContent('');
                    }}
                    replySubmitting={replySubmitting}
                    isEditing={editingCommentId === comment.id}
                    editingContent={
                        editingCommentId === comment.id ? editingContent : ''
                    }
                    onEditingContentChange={setEditingContent}
                    editingSubmitting={editingSubmitting}
                    deleting={deletingCommentIds.includes(comment.id)}
                    voting={votingCommentIds.includes(comment.id)}
                />

                {comment.replies && comment.replies.length > 0
                    ? comment.replies.map((reply) =>
                          renderCommentBranch(reply, false),
                      )
                    : null}
            </div>
        );
    };

    const bestAnswer = selectBestAnswer(comments);
    const visibleComments = sortCommentTreeByMode(
        bestAnswer ? removeCommentFromTree(comments, bestAnswer.id) : comments,
        sortMode,
    );

    const handleComposerKeyDown = (
        event: KeyboardEvent<HTMLTextAreaElement>,
    ) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            void submitComment();
        }
    };

    return (
        <section className="px-4 pb-10">
            <div className="mb-4">
                <h2 className="text-base font-semibold text-zinc-950">
                    {t.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                    {comments.length}{' '}
                    {comments.length === 1 ? t.single : t.plural}
                </p>
            </div>

            {bestAnswer ? (
                <div className="mb-5 rounded-2xl bg-amber-100 px-4 py-3">
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                        <Star className="h-3.5 w-3.5 fill-amber-600 text-amber-600" />
                        {t.bestAnswer}
                    </div>

                    {renderCommentBranch(bestAnswer, true, true)}
                </div>
            ) : null}

            <div className="pb-4">
                <div className="flex gap-3">
                    <UserAvatar
                        name={currentUser.name}
                        avatar={currentUser.avatar ?? null}
                        className="mt-1 h-9 w-9"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="mb-2 text-sm font-medium text-zinc-900">
                            {currentUser.name}
                        </div>

                        <div className="p-0">
                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={handleContentChange}
                                    onKeyDown={handleComposerKeyDown}
                                    placeholder={t.writePlaceholder}
                                    className="min-h-21 w-full resize-none rounded-xl border-0 bg-zinc-100 px-5 py-4 text-base leading-7 text-zinc-800 transition outline-none placeholder:text-zinc-500 focus:bg-zinc-200/80 focus:ring-0"
                                />
                            </div>

                            {errorMessage && (
                                <p className="mt-3 text-sm font-medium text-red-600">
                                    {errorMessage}
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <div />

                                <Button
                                    type="button"
                                    onClick={() => void submitComment()}
                                    disabled={submitting}
                                    className="h-8 rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] px-4 text-white transition-all duration-200 hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? (
                                        <>
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                            {t.posting}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            {t.postComment}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-4 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setSortMode('latest')}
                    className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                        sortMode === 'latest'
                            ? 'border-[#ef99b0] bg-[#ffe8ef] text-[#c84671]'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50',
                    )}
                >
                    {t.sortLatest}
                </button>
                <button
                    type="button"
                    onClick={() => setSortMode('top-liked')}
                    className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                        sortMode === 'top-liked'
                            ? 'border-[#ef99b0] bg-[#ffe8ef] text-[#c84671]'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50',
                    )}
                >
                    {t.sortTopLiked}
                </button>
            </div>

            <div className="mt-4 divide-zinc-200/80">
                {visibleComments.length > 0 ? (
                    visibleComments.map((comment) =>
                        renderCommentBranch(comment, true),
                    )
                ) : (
                    <div className="py-8 text-center text-sm text-zinc-500">
                        {t.noCommentsYet}
                    </div>
                )}
            </div>
        </section>
    );
}

function CommentCard({
    comment,
    floor,
    depth,
    isBestAnswer,
    onReply,
    onUpvote,
    onDownvote,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onDelete,
    replying,
    replyContent,
    onReplyContentChange,
    onSubmitReply,
    onCancelReply,
    replySubmitting,
    isEditing,
    editingContent,
    onEditingContentChange,
    editingSubmitting,
    deleting,
    voting,
    className,
}: {
    comment: CommentItem;
    floor: number;
    depth: number;
    isBestAnswer: boolean;
    onReply: () => void;
    onUpvote: () => void;
    onDownvote: () => void;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onDelete: () => void;
    replying: boolean;
    replyContent: string;
    onReplyContentChange: (value: string) => void;
    onSubmitReply: () => void;
    onCancelReply: () => void;
    replySubmitting: boolean;
    isEditing: boolean;
    editingContent: string;
    onEditingContentChange: (value: string) => void;
    editingSubmitting: boolean;
    deleting: boolean;
    voting: boolean;
    className?: string;
}) {
    const page = usePage<SharedPageProps>();
    const currentUserId = page.props.auth.user.id;
    const userName = comment.user?.name ?? trans(page, 'comment.unknown_user');
    const canManage = comment.user?.id === currentUserId;
    const canReply = !isBestAnswer && comment.user?.id !== currentUserId;
    const isUpvoted = Boolean(comment.is_upvoted ?? comment.is_liked);
    const isDownvoted = Boolean(comment.is_downvoted);
    const helpfulCount = comment.upvotes_count ?? comment.likes_count ?? 0;
    const confusingCount = comment.downvotes_count ?? 0;
    const reactionButtonBaseClass =
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary shadow-xs hover:bg-primary/90 py-2 has-[>svg]:px-3 h-8 rounded-full border-2 px-3 text-xs transition-all duration-200';

    return (
        <article className={cn('py-4', className)}>
            <div className="flex items-start gap-3">
                <Link
                    href={
                        comment.user?.id
                            ? `/profilePage/${comment.user.id}`
                            : '/profilePage'
                    }
                    className="peer group/avatar cursor-pointer"
                >
                    <UserAvatar
                        name={userName}
                        avatar={comment.user?.avatar ?? null}
                        className="mt-0.5 h-9 w-9 ring-2 ring-transparent transition-colors group-hover/avatar:ring-[#ef99b0]"
                    />
                </Link>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {isBestAnswer ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                {trans(page, 'comment.best_answer')}
                            </span>
                        ) : null}
                        <Link
                            href={
                                comment.user?.id
                                    ? `/profilePage/${comment.user.id}`
                                    : '/profilePage'
                            }
                            className="cursor-pointer text-sm font-semibold text-zinc-950 transition-colors peer-hover:text-[#de6b89] hover:text-[#de6b89]"
                        >
                            {userName}
                        </Link>
                        <span className="text-zinc-300">•</span>
                        <time
                            className="text-xs text-zinc-500"
                            title={formatFullDate(comment.created_at)}
                        >
                            {formatTimeAgo(comment.created_at)}
                        </time>
                        <span className="text-zinc-300">•</span>
                        <span className="text-xs text-zinc-500">
                            {trans(page, 'comment.floor_label', { floor })}
                        </span>
                        <span className="text-xs text-zinc-500">
                            {trans(page, 'comment.layer_label', {
                                layer: depth,
                            })}
                        </span>
                    </div>

                    {comment.reply_to_user ? (
                        <div className="mt-2 text-xs text-zinc-500">
                            {trans(page, 'comment.reply_to')}{' '}
                            <Link
                                href={`/profilePage/${comment.reply_to_user.id}`}
                                className="font-semibold text-zinc-700 hover:text-[#de6b89]"
                            >
                                {comment.reply_to_user.name}
                            </Link>
                        </div>
                    ) : null}

                    {isEditing ? (
                        <div className="mt-2">
                            <textarea
                                value={editingContent}
                                onChange={(event) =>
                                    onEditingContentChange(event.target.value)
                                }
                                rows={3}
                                className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-800 transition outline-none focus:border-zinc-300"
                            />
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    onClick={onSaveEdit}
                                    disabled={editingSubmitting}
                                    className="h-8 rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] px-3 text-xs text-white transition-all duration-200 hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black"
                                >
                                    {editingSubmitting
                                        ? trans(page, 'comment.posting')
                                        : trans(page, 'comment.save')}
                                </Button>
                                <button
                                    type="button"
                                    onClick={onCancelEdit}
                                    className="inline-flex h-8 items-center justify-center gap-2 rounded-full border-2 border-[#ef99b0] bg-primary bg-linear-to-r from-[#ef99b0] to-[#e27193] px-3 py-2 text-xs font-medium whitespace-nowrap text-white shadow-xs transition-all duration-200 outline-none hover:border-[#d85380] hover:bg-primary/90 hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 has-[>svg]:px-3 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                                >
                                    {trans(page, 'comment.cancel_edit')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        comment.content.trim() !== '' && (
                            <div className="mt-2 border-l-2 border-zinc-200 pl-3 text-sm leading-6 text-zinc-800">
                                {renderCommentContent(comment.content)}
                            </div>
                        )
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {!isBestAnswer ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onUpvote}
                                    disabled={voting}
                                    className={cn(
                                        reactionButtonBaseClass,
                                        isUpvoted
                                            ? 'border-[#2f9e57] bg-linear-to-r from-[#46c46f] to-[#23924e] text-white hover:border-[#237842] hover:from-[#9be5b3] hover:to-[#66c989] hover:text-black'
                                            : 'border-[#8dd4a5] bg-linear-to-r from-[#d8f4e2] to-[#a9e4bc] text-[#1f6c3c] hover:border-[#5cb97f] hover:from-[#bceccb] hover:to-[#83d7a2] hover:text-black',
                                    )}
                                    aria-label={trans(page, 'comment.helpful')}
                                >
                                    <Lightbulb
                                        className={cn(
                                            'h-3.5 w-3.5',
                                            isUpvoted && 'fill-current',
                                        )}
                                    />
                                    <span>
                                        {trans(page, 'comment.helpful')}
                                    </span>
                                    <span className="tabular-nums">
                                        {helpfulCount}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={onDownvote}
                                    disabled={voting}
                                    className={cn(
                                        reactionButtonBaseClass,
                                        isDownvoted
                                            ? 'border-[#cf4d5d] bg-linear-to-r from-[#ed7985] to-[#d84053] text-white hover:border-[#b73a4a] hover:from-[#f5b0b8] hover:to-[#ee7f8d] hover:text-black'
                                            : 'border-[#efadb5] bg-linear-to-r from-[#fde0e4] to-[#f6b9c1] text-[#9f3341] hover:border-[#e4828e] hover:from-[#f9c7cf] hover:to-[#f19aa7] hover:text-black',
                                    )}
                                    aria-label={trans(
                                        page,
                                        'comment.confusing',
                                    )}
                                >
                                    <Brain className="h-3.5 w-3.5" />
                                    <span>
                                        {trans(page, 'comment.confusing')}
                                    </span>
                                    <span className="tabular-nums">
                                        {confusingCount}
                                    </span>
                                </button>
                            </>
                        ) : null}

                        {!isEditing && canReply ? (
                            <button
                                type="button"
                                onClick={onReply}
                                className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#ffe8ef] px-3 py-1.5 text-xs font-semibold text-[#c84671] transition hover:bg-[#ffd8e6]"
                            >
                                {trans(page, 'comment.reply')}
                            </button>
                        ) : null}

                        {canManage && !isEditing && !replying ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onStartEdit}
                                    className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-full bg-[#e7f9ef] px-3 py-1.5 text-xs font-semibold text-[#1f8a4d] transition hover:bg-[#d5f3e2]"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    {trans(page, 'comment.edit')}
                                </button>
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    disabled={deleting}
                                    className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {deleting
                                        ? trans(page, 'comment.deleting')
                                        : trans(page, 'comment.delete')}
                                </button>
                            </>
                        ) : null}
                    </div>

                    {replying ? (
                        <div className="mt-3">
                            <div className="mb-2 px-1 text-xs text-zinc-500">
                                {trans(page, 'comment.replying_to', {
                                    name: userName,
                                })}
                            </div>
                            <textarea
                                value={replyContent}
                                onChange={(event) =>
                                    onReplyContentChange(event.target.value)
                                }
                                rows={1}
                                placeholder={trans(
                                    page,
                                    'comment.write_placeholder',
                                )}
                                className="w-full resize-none rounded-[999px] border-2 border-[#ef99b0] bg-white px-4 py-3 text-sm leading-5 text-zinc-800 transition outline-none focus:border-[#e27193]"
                            />
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    onClick={onSubmitReply}
                                    disabled={replySubmitting}
                                    className="h-8 rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] px-3 text-xs text-white transition-all duration-200 hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black"
                                >
                                    {replySubmitting
                                        ? trans(page, 'comment.posting')
                                        : trans(page, 'comment.reply')}
                                </Button>
                                <button
                                    type="button"
                                    onClick={onCancelReply}
                                    className="inline-flex h-8 items-center justify-center gap-2 rounded-full border-2 border-[#7ec8ff] bg-primary bg-linear-to-r from-[#7ec8ff] to-[#4aa8ff] px-3 py-2 text-xs font-medium whitespace-nowrap text-white shadow-xs transition-all duration-200 outline-none hover:border-[#5aaeff] hover:bg-primary/90 hover:from-[#bfe6ff] hover:to-[#8fd0ff] hover:text-black focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 has-[>svg]:px-3 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                                >
                                    {trans(page, 'comment.cancel_reply')}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

function UserAvatar({
    name,
    avatar,
    className,
}: {
    name: string;
    avatar?: string | null;
    className?: string;
}) {
    const initial = name.trim().charAt(0).toUpperCase() || 'U';

    return (
        <Avatar className={cn('h-10 w-10', className)}>
            {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
            <AvatarFallback className="bg-zinc-200 font-semibold text-zinc-700">
                {initial}
            </AvatarFallback>
        </Avatar>
    );
}

function countAllComments(items: CommentItem[]): number {
    return items.reduce(
        (total, item) => total + 1 + countAllComments(item.replies ?? []),
        0,
    );
}

function buildCommentDisplayMeta(
    items: CommentItem[],
): Map<number, { floor: number; layer: number }> {
    const meta = new Map<number, { floor: number; layer: number }>();
    const rootComments = [...items].sort(compareCommentsByCreatedAt);

    rootComments.forEach((comment, index) => {
        assignCommentDisplayMeta(meta, comment, index + 1, 1);
    });

    return meta;
}

function assignCommentDisplayMeta(
    meta: Map<number, { floor: number; layer: number }>,
    comment: CommentItem,
    floor: number,
    layer: number,
) {
    meta.set(comment.id, { floor, layer });

    comment.replies?.forEach((reply) => {
        assignCommentDisplayMeta(meta, reply, floor, layer + 1);
    });
}

function compareCommentsByCreatedAt(
    left: CommentItem,
    right: CommentItem,
): number {
    const createdAtDelta =
        new Date(left.created_at).getTime() -
        new Date(right.created_at).getTime();

    if (createdAtDelta !== 0) {
        return createdAtDelta;
    }

    return left.id - right.id;
}

function updateCommentTree(
    items: CommentItem[],
    commentId: number,
    updater: (item: CommentItem) => CommentItem,
): CommentItem[] {
    return items.map((item) => {
        if (item.id === commentId) {
            return updater(item);
        }

        if (!item.replies || item.replies.length === 0) {
            return item;
        }

        return {
            ...item,
            replies: updateCommentTree(item.replies, commentId, updater),
        };
    });
}

function getCommentLikeCount(comment: CommentItem): number {
    return comment.upvotes_count ?? comment.likes_count ?? 0;
}

function sortCommentTreeByMode(
    items: CommentItem[],
    mode: 'latest' | 'top-liked',
): CommentItem[] {
    return [...items]
        .sort((left, right) => {
            if (mode === 'latest') {
                return (
                    new Date(right.created_at).getTime() -
                    new Date(left.created_at).getTime()
                );
            }

            const likeDelta =
                getCommentLikeCount(right) - getCommentLikeCount(left);
            if (likeDelta !== 0) {
                return likeDelta;
            }

            return (
                new Date(right.created_at).getTime() -
                new Date(left.created_at).getTime()
            );
        })
        .map((item) => ({
            ...item,
            replies: item.replies
                ? sortCommentTreeByMode(item.replies, mode)
                : item.replies,
        }));
}

function selectBestAnswer(items: CommentItem[]): CommentItem | null {
    const flattened = flattenComments(items);

    if (flattened.length === 0) {
        return null;
    }

    const sortedByLikes = [...flattened].sort((left, right) => {
        const likeDelta =
            getCommentLikeCount(right) - getCommentLikeCount(left);
        if (likeDelta !== 0) {
            return likeDelta;
        }

        return (
            new Date(left.created_at).getTime() -
            new Date(right.created_at).getTime()
        );
    });

    const candidate = sortedByLikes[0] ?? null;

    if (!candidate || getCommentLikeCount(candidate) <= 0) {
        return null;
    }

    return candidate;
}

function flattenComments(items: CommentItem[]): CommentItem[] {
    return items.flatMap((item) => [
        item,
        ...(item.replies ? flattenComments(item.replies) : []),
    ]);
}

function removeCommentFromTree(
    items: CommentItem[],
    commentId: number,
): CommentItem[] {
    return items
        .filter((item) => item.id !== commentId)
        .map((item) => ({
            ...item,
            replies: item.replies
                ? removeCommentFromTree(item.replies, commentId)
                : item.replies,
        }));
}

function renderCommentContent(content: string): ReactNode {
    return content.split('\n').map((line, lineIndex, lines) => (
        <span key={`${line}-${lineIndex}`}>
            <span>{line}</span>
            {lineIndex < lines.length - 1 ? <br /> : null}
        </span>
    ));
}

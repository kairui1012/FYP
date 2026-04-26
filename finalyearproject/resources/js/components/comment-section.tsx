import { Link, usePage } from '@inertiajs/react';
import {
    Brain,
    CheckCircle2,
    Flag,
    Lightbulb,
    LoaderCircle,
    Pencil,
    Send,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { LeaderboardTitleBadge } from '@/components/LeaderboardTitleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BestAnswerAiPanel } from '@/components/best-answer-ai-panel';
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

const REPLY_LIMIT = 3;

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
        wrong: trans(page, 'comment.wrong'),
        report: trans(page, 'comment.report'),
        reportSent: trans(page, 'comment.report_sent'),
        reportFailed: trans(page, 'comment.report_failed'),
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
    const [reportingCommentIds, setReportingCommentIds] = useState<number[]>(
        [],
    );
    const [reportedCommentIds, setReportedCommentIds] = useState<number[]>([]);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(
        null,
    );
    const [editingContent, setEditingContent] = useState('');
    const [editingSubmitting, setEditingSubmitting] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState<
        Record<number, boolean>
    >({});

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

    const handleReport = async (commentId: number) => {
        if (
            reportingCommentIds.includes(commentId) ||
            reportedCommentIds.includes(commentId)
        )
            return;

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';

        setReportingCommentIds((prev) => [...prev, commentId]);

        try {
            const response = await fetch(`/comments/${commentId}/report`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ reason: 'inappropriate' }),
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as {
                    message?: string;
                } | null;
                const msg = payload?.message ?? t.reportFailed;
                if (msg === 'Already reported.') {
                    setReportedCommentIds((prev) => [...prev, commentId]);
                    toast.success(t.reportSent);
                } else {
                    toast.error(t.reportFailed);
                }
                return;
            }

            setReportedCommentIds((prev) => [...prev, commentId]);
            toast.success(t.reportSent);
        } catch {
            toast.error(t.reportFailed);
        } finally {
            setReportingCommentIds((prev) =>
                prev.filter((id) => id !== commentId),
            );
        }
    };

    const handleToggleCommentVote = async (
        commentId: number,
        direction: 'up' | 'down' | 'wrong',
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
                is_wrong: boolean;
                upvotes_count: number;
                downvotes_count: number;
                wrong_votes_count: number;
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
                        is_wrong: payload.is_wrong,
                        likes_count: payload.upvotes_count,
                        upvotes_count: payload.upvotes_count,
                        downvotes_count: payload.downvotes_count,
                        wrong_votes_count: payload.wrong_votes_count ?? 0,
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

    const bestAnswer = selectBestAnswer(comments);

    const renderCommentBranch = (
        comment: CommentItem,
        isRoot: boolean,
        isBestAnswerPreview = false,
    ): ReactNode => {
        const isTheBestAnswer = bestAnswer?.id === comment.id;
        const replies = comment.replies ?? [];
        const isExpanded = expandedReplies[comment.id] ?? false;
        const visibleReplies = isExpanded
            ? replies
            : replies.slice(0, REPLY_LIMIT);
        const hiddenCount = replies.length - REPLY_LIMIT;

        return (
            <div key={comment.id}>
                <div
                    className={cn(
                        isBestAnswerPreview
                            ? 'py-2'
                            : isRoot
                              ? cn(
                                    'border-b border-zinc-200 py-4',
                                    isTheBestAnswer && 'bg-emerald-50/30',
                                )
                              : 'ml-6 border-l-2 border-zinc-200 py-2 pl-4',
                    )}
                >
                    {/* Inline best answer badge — shown in the comment list for the best answer comment */}
                    {!isBestAnswerPreview && isTheBestAnswer && (
                        <div className="mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-xs font-bold tracking-wide text-emerald-700 uppercase">
                                {t.bestAnswer}
                            </span>
                        </div>
                    )}

                    <CommentCard
                        comment={comment}
                        isBestAnswer={isBestAnswerPreview}
                        onReply={() => handleReplyClick(comment)}
                        onUpvote={() =>
                            void handleToggleCommentVote(comment.id, 'up')
                        }
                        onDownvote={() =>
                            void handleToggleCommentVote(comment.id, 'down')
                        }
                        onWrong={() =>
                            void handleToggleCommentVote(comment.id, 'wrong')
                        }
                        onReport={() => void handleReport(comment.id)}
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
                            editingCommentId === comment.id
                                ? editingContent
                                : ''
                        }
                        onEditingContentChange={setEditingContent}
                        editingSubmitting={editingSubmitting}
                        deleting={deletingCommentIds.includes(comment.id)}
                        voting={votingCommentIds.includes(comment.id)}
                        reporting={reportingCommentIds.includes(comment.id)}
                        reported={reportedCommentIds.includes(comment.id)}
                    />
                </div>

                {/* Nested replies */}
                {visibleReplies.map((reply) =>
                    renderCommentBranch(reply, false),
                )}

                {/* Show more / hide replies toggle */}
                {!isBestAnswerPreview && replies.length > REPLY_LIMIT && (
                    <div className="ml-6 py-1 pl-4">
                        <button
                            type="button"
                            onClick={() =>
                                setExpandedReplies((prev) => ({
                                    ...prev,
                                    [comment.id]: !isExpanded,
                                }))
                            }
                            className="text-xs text-zinc-500 transition-colors hover:text-[#e27193]"
                        >
                            {isExpanded
                                ? 'Hide replies'
                                : `Show more replies (${hiddenCount})`}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Keep full comment tree — best answer stays in original position
    const visibleComments = sortCommentTreeByMode(comments, sortMode);

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

            {bestAnswer && post.post_type === 'question' ? (
                <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50/40 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-emerald-200/70 bg-emerald-100/60 px-4 py-2.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-xs font-bold tracking-wide text-emerald-800 uppercase">
                            {t.bestAnswer}
                        </span>
                    </div>
                    <div className="px-4 pt-2 pb-4">
                        {renderCommentBranch(bestAnswer, true, true)}
                        <BestAnswerAiPanel
                            page={page}
                            trans={trans}
                            postTitle={post.title}
                            postContent={post.content ?? ''}
                            answerContent={bestAnswer.content}
                        />
                    </div>
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
                            <LeaderboardTitleBadge
                                title={currentUser.leaderboard_title}
                                className="ml-1.5"
                            />
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

            <div className="mb-4">
                <div className="inline-flex rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-zinc-200">
                    <button
                        type="button"
                        onClick={() => setSortMode('latest')}
                        className={cn(
                            'rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-150',
                            sortMode === 'latest'
                                ? 'bg-[#e27193] text-white shadow-sm'
                                : 'text-zinc-500 hover:text-[#e27193]',
                        )}
                    >
                        {t.sortLatest}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortMode('top-liked')}
                        className={cn(
                            'rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-150',
                            sortMode === 'top-liked'
                                ? 'bg-[#e27193] text-white shadow-sm'
                                : 'text-zinc-500 hover:text-[#e27193]',
                        )}
                    >
                        {t.sortTopLiked}
                    </button>
                </div>
            </div>

            <div className="mt-4">
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
    isBestAnswer,
    onReply,
    onUpvote,
    onDownvote,
    onWrong,
    onReport,
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
    reporting,
    reported,
    className,
}: {
    comment: CommentItem;
    isBestAnswer: boolean;
    onReply: () => void;
    onUpvote: () => void;
    onDownvote: () => void;
    onWrong: () => void;
    onReport: () => void;
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
    reporting: boolean;
    reported: boolean;
    className?: string;
}) {
    const page = usePage<SharedPageProps>();
    const currentUserId = page.props.auth.user.id;
    const userName = comment.user?.name ?? trans(page, 'comment.unknown_user');
    const canManage = comment.user?.id === currentUserId;
    const isOwnComment = comment.user?.id === currentUserId;
    const canReply = !isBestAnswer && !isOwnComment;
    const canReport = !isOwnComment;
    const isUpvoted = Boolean(comment.is_upvoted ?? comment.is_liked);
    const isDownvoted = Boolean(comment.is_downvoted);
    const isWrong = Boolean(comment.is_wrong);
    const helpfulCount = comment.upvotes_count ?? comment.likes_count ?? 0;
    const confusingCount = comment.downvotes_count ?? 0;
    const wrongCount = comment.wrong_votes_count ?? 0;

    const btnBase =
        'inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-xs font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    return (
        <article className={cn('py-3', className)}>
            <div className="flex items-start gap-3">
                <Link
                    href={
                        comment.user?.id
                            ? `/profilePage/${comment.user.id}`
                            : '/profilePage'
                    }
                    className="peer group/avatar shrink-0 cursor-pointer"
                >
                    <UserAvatar
                        name={userName}
                        avatar={comment.user?.avatar ?? null}
                        className="mt-0.5 h-8 w-8 ring-2 ring-transparent transition-colors group-hover/avatar:ring-[#ef99b0]"
                    />
                </Link>

                <div className="min-w-0 flex-1">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <Link
                            href={
                                comment.user?.id
                                    ? `/profilePage/${comment.user.id}`
                                    : '/profilePage'
                            }
                            className="cursor-pointer text-sm font-semibold text-zinc-900 transition-colors peer-hover:text-[#de6b89] hover:text-[#de6b89]"
                        >
                            {userName}
                        </Link>
                        <LeaderboardTitleBadge
                            title={comment.user?.leaderboard_title}
                        />
                        <span className="text-zinc-300">·</span>
                        <time
                            className="text-xs text-zinc-400"
                            title={formatFullDate(comment.created_at)}
                        >
                            {formatTimeAgo(comment.created_at)}
                        </time>
                    </div>

                    {/* Reply-to reference */}
                    {comment.reply_to_user ? (
                        <div className="mt-1 text-xs text-zinc-400">
                            {trans(page, 'comment.reply_to')}{' '}
                            <Link
                                href={`/profilePage/${comment.reply_to_user.id}`}
                                className="font-semibold text-zinc-600 hover:text-[#de6b89]"
                            >
                                {comment.reply_to_user.name}
                            </Link>
                            <LeaderboardTitleBadge
                                title={comment.reply_to_user.leaderboard_title}
                                className="ml-1.5"
                            />
                        </div>
                    ) : null}

                    {/* Content / Edit */}
                    {isEditing ? (
                        <div className="mt-2">
                            <textarea
                                value={editingContent}
                                onChange={(e) =>
                                    onEditingContentChange(e.target.value)
                                }
                                rows={3}
                                className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-6 text-zinc-800 transition outline-none focus:border-[#e27193] focus:bg-white"
                            />
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    onClick={onSaveEdit}
                                    disabled={editingSubmitting}
                                    className="h-7 rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] px-3 text-xs text-white transition-all hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black"
                                >
                                    {editingSubmitting
                                        ? trans(page, 'comment.posting')
                                        : trans(page, 'comment.save')}
                                </Button>
                                <button
                                    type="button"
                                    onClick={onCancelEdit}
                                    className="h-7 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                                >
                                    {trans(page, 'comment.cancel_edit')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        comment.content.trim() !== '' && (
                            <p className="mt-1.5 text-sm leading-6 whitespace-pre-wrap text-zinc-800">
                                {renderCommentContent(comment.content)}
                            </p>
                        )
                    )}

                    {/* Action bar */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {/* Reaction buttons — hidden on best answer preview */}
                        {!isBestAnswer ? (
                            <>
                                {/* Useful */}
                                <button
                                    type="button"
                                    onClick={onUpvote}
                                    disabled={voting}
                                    className={cn(
                                        btnBase,
                                        isUpvoted
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                            : 'border-emerald-400 bg-white text-emerald-700 hover:bg-emerald-50',
                                    )}
                                >
                                    <Lightbulb
                                        className={cn(
                                            'h-3.5 w-3.5',
                                            isUpvoted && 'fill-current',
                                        )}
                                    />
                                    {trans(page, 'comment.helpful')}
                                    <span className="tabular-nums opacity-70">
                                        {helpfulCount}
                                    </span>
                                </button>

                                {/* Confuse */}
                                <button
                                    type="button"
                                    onClick={onDownvote}
                                    disabled={voting}
                                    className={cn(
                                        btnBase,
                                        isDownvoted
                                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                                            : 'border-amber-400 bg-white text-amber-700 hover:bg-amber-50',
                                    )}
                                >
                                    <Brain className="h-3.5 w-3.5" />
                                    {trans(page, 'comment.confusing')}
                                    <span className="tabular-nums opacity-70">
                                        {confusingCount}
                                    </span>
                                </button>

                                {/* Wrong */}
                                <button
                                    type="button"
                                    onClick={onWrong}
                                    disabled={voting}
                                    className={cn(
                                        btnBase,
                                        isWrong
                                            ? 'border-rose-500 bg-rose-50 text-rose-700'
                                            : 'border-rose-400 bg-white text-rose-700 hover:bg-rose-50',
                                    )}
                                >
                                    <XCircle
                                        className={cn(
                                            'h-3.5 w-3.5',
                                            isWrong && 'fill-current',
                                        )}
                                    />
                                    {trans(page, 'comment.wrong')}
                                    <span className="tabular-nums opacity-70">
                                        {wrongCount}
                                    </span>
                                </button>
                            </>
                        ) : null}

                        {/* Reply */}
                        {!isEditing && canReply ? (
                            <button
                                type="button"
                                onClick={onReply}
                                className={cn(
                                    btnBase,
                                    'border-pink-300 bg-white text-pink-600 hover:bg-pink-50',
                                )}
                            >
                                {trans(page, 'comment.reply')}
                            </button>
                        ) : null}

                        {/* Edit / Delete (owner only) */}
                        {canManage && !isEditing && !replying ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onStartEdit}
                                    className={cn(
                                        btnBase,
                                        'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50',
                                    )}
                                >
                                    <Pencil className="h-3 w-3" />
                                    {trans(page, 'comment.edit')}
                                </button>
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    disabled={deleting}
                                    className={cn(
                                        btnBase,
                                        'border-rose-300 bg-white text-rose-500 hover:bg-rose-50',
                                    )}
                                >
                                    <Trash2 className="h-3 w-3" />
                                    {deleting
                                        ? trans(page, 'comment.deleting')
                                        : trans(page, 'comment.delete')}
                                </button>
                            </>
                        ) : null}

                        {/* Report (non-owner, non-best-answer preview) */}
                        {canReport && !isBestAnswer && !isEditing ? (
                            <button
                                type="button"
                                onClick={onReport}
                                disabled={reporting || reported}
                                className={cn(
                                    btnBase,
                                    'border-zinc-300 bg-white',
                                    reported
                                        ? 'text-zinc-400'
                                        : 'text-zinc-500 hover:bg-zinc-50',
                                )}
                            >
                                <Flag className="h-3 w-3" />
                                {trans(page, 'comment.report')}
                            </button>
                        ) : null}
                    </div>

                    {/* Reply composer */}
                    {replying ? (
                        <div className="mt-3">
                            <div className="mb-1.5 px-1 text-xs text-zinc-400">
                                {trans(page, 'comment.replying_to', {
                                    name: userName,
                                })}
                            </div>
                            <textarea
                                value={replyContent}
                                onChange={(e) =>
                                    onReplyContentChange(e.target.value)
                                }
                                rows={1}
                                placeholder={trans(
                                    page,
                                    'comment.write_placeholder',
                                )}
                                className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm leading-5 text-zinc-800 transition outline-none focus:border-[#e27193] focus:bg-white"
                            />
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    onClick={onSubmitReply}
                                    disabled={replySubmitting}
                                    className="h-7 rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] px-3 text-xs text-white transition-all hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black"
                                >
                                    {replySubmitting
                                        ? trans(page, 'comment.posting')
                                        : trans(page, 'comment.reply')}
                                </Button>
                                <button
                                    type="button"
                                    onClick={onCancelReply}
                                    className="h-7 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
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

function getCommentScore(comment: CommentItem): number {
    if (typeof comment.score === 'number') return comment.score;
    const up = comment.upvotes_count ?? comment.likes_count ?? 0;
    const down = comment.downvotes_count ?? 0;
    const wrong = comment.wrong_votes_count ?? 0;
    return up - down - 2 * wrong;
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

            const scoreDelta = getCommentScore(right) - getCommentScore(left);
            if (scoreDelta !== 0) return scoreDelta;

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

    if (flattened.length === 0) return null;

    const sorted = [...flattened].sort((left, right) => {
        const scoreDelta = getCommentScore(right) - getCommentScore(left);
        if (scoreDelta !== 0) return scoreDelta;
        return (
            new Date(left.created_at).getTime() -
            new Date(right.created_at).getTime()
        );
    });

    const candidate = sorted[0] ?? null;

    // Require score > 1 to qualify as best answer
    if (!candidate || getCommentScore(candidate) <= 1) return null;

    return candidate;
}

function flattenComments(items: CommentItem[]): CommentItem[] {
    return items.flatMap((item) => [
        item,
        ...(item.replies ? flattenComments(item.replies) : []),
    ]);
}

function renderCommentContent(content: string): ReactNode {
    return content.split('\n').map((line, lineIndex, lines) => (
        <span key={`${line}-${lineIndex}`}>
            <span>{line}</span>
            {lineIndex < lines.length - 1 ? <br /> : null}
        </span>
    ));
}

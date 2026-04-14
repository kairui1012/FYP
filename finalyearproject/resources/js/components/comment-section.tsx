import { Link, usePage } from '@inertiajs/react';
import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type KeyboardEvent,
    type ReactNode,
} from 'react';
import { toast } from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatFullDate, formatTimeAgo } from '@/lib/post-utils';
import { cn } from '@/lib/utils';
import type {
    CommentItem,
    CommentMention,
    MentionableUser,
    PostItem,
    User,
} from '@/types';
import {
    AtSign,
    Heart,
    ImagePlus,
    LoaderCircle,
    Send,
    X,
} from 'lucide-react';

const MAX_ATTACHMENTS = 4;

type CommentSectionProps = {
    post: PostItem;
    onCommentsCountChange?: (count: number) => void;
};

type ComposerAttachment = {
    id: string;
    file: File;
    previewUrl: string;
};

type CommentStoreResponse = {
    comment?: CommentItem;
    comments?: CommentItem[];
    comments_count?: number;
    errors?: Record<string, string[]>;
};

type MentionablesResponse = {
    data?: MentionableUser[];
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
        mentionSomeone: trans(page, 'comment.mention_someone'),
        loadingSuggestions: trans(page, 'comment.loading_suggestions'),
        noMatchingPeople: trans(page, 'comment.no_matching_people'),
        addImage: trans(page, 'comment.add_image'),
        photosLimitHint: trans(page, 'comment.photos_limit_hint', {
            count: MAX_ATTACHMENTS,
        }),
        postComment: trans(page, 'comment.post_comment'),
        posting: trans(page, 'comment.posting'),
        noCommentsYet: trans(page, 'comment.no_comments_yet'),
        unknownUser: trans(page, 'comment.unknown_user'),
        removeImage: trans(page, 'comment.remove_image'),
        commentPreview: trans(page, 'comment.comment_preview'),
        writeOrImageRequired: trans(page, 'comment.write_or_image_required'),
        serverErrorPost: trans(page, 'comment.server_error_post'),
        failedPost: trans(page, 'comment.failed_post'),
        commentPosted: trans(page, 'comment.comment_posted'),
        genericPostError: trans(page, 'comment.generic_post_error'),
        uploadLimit: trans(page, 'comment.upload_limit', {
            count: MAX_ATTACHMENTS,
        }),
        imageOnlyLimit: trans(page, 'comment.image_only_limit', {
            count: MAX_ATTACHMENTS,
        }),
        reply: trans(page, 'comment.reply'),
        replyingTo: trans(page, 'comment.replying_to'),
        cancelReply: trans(page, 'comment.cancel_reply'),
        layerLabel: trans(page, 'comment.layer_label'),
        floorLabel: trans(page, 'comment.floor_label'),
        like: trans(page, 'comment.like'),
        liked: trans(page, 'comment.liked'),
    };
    const [comments, setComments] = useState<CommentItem[]>(post.comments ?? []);
    const [content, setContent] = useState('');
    const [selectedMentions, setSelectedMentions] = useState<CommentMention[]>(
        [],
    );
    const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
    const [activeMention, setActiveMention] = useState<{
        query: string;
        start: number;
        end: number;
    } | null>(null);
    const [mentionResults, setMentionResults] = useState<MentionableUser[]>([]);
    const [highlightedMentionIndex, setHighlightedMentionIndex] = useState(0);
    const [loadingMentions, setLoadingMentions] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [replyTo, setReplyTo] = useState<{
        id: number;
        name: string;
    } | null>(null);
    const [likingCommentIds, setLikingCommentIds] = useState<number[]>([]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachmentStoreRef = useRef<ComposerAttachment[]>([]);

    useEffect(() => {
        setComments(post.comments ?? []);
    }, [post.comments]);

    useEffect(() => {
        onCommentsCountChange?.(countAllComments(comments));
    }, [comments, onCommentsCountChange]);

    useEffect(() => {
        attachmentStoreRef.current = attachments;
    }, [attachments]);

    useEffect(() => {
        return () => {
            attachmentStoreRef.current.forEach((attachment) => {
                URL.revokeObjectURL(attachment.previewUrl);
            });
        };
    }, []);

    useEffect(() => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return;
        }

        textarea.style.height = '0px';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
    }, [content]);

    useEffect(() => {
        if (!activeMention) {
            setMentionResults([]);
            setLoadingMentions(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            try {
                setLoadingMentions(true);

                const searchParams = new URLSearchParams();
                if (activeMention.query.trim() !== '') {
                    searchParams.set('query', activeMention.query.trim());
                }

                const response = await fetch(
                    `/posts/${post.id}/comments/mentions?${searchParams.toString()}`,
                    {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json',
                        },
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    throw new Error('Failed to load mention suggestions.');
                }

                const payload =
                    (await response.json()) as MentionablesResponse;

                setMentionResults(payload.data ?? []);
                setHighlightedMentionIndex(0);
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                setMentionResults([]);
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingMentions(false);
                }
            }
        }, 180);

        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [activeMention, post.id]);

    const syncMentionState = (value: string, caretPosition: number | null) => {
        setSelectedMentions((previous) =>
            previous.filter((mention) => value.includes(`@${mention.handle}`)),
        );

        if (caretPosition === null) {
            setActiveMention(null);
            return;
        }

        const textBeforeCaret = value.slice(0, caretPosition);
        const match = textBeforeCaret.match(/(^|\s)@([a-z0-9-]*)$/i);

        if (!match) {
            setActiveMention(null);
            return;
        }

        const query = match[2] ?? '';
        const start = caretPosition - query.length - 1;

        setActiveMention({
            query,
            start,
            end: caretPosition,
        });
    };

    const resetComposer = () => {
        attachmentStoreRef.current.forEach((attachment) => {
            URL.revokeObjectURL(attachment.previewUrl);
        });

        setContent('');
        setSelectedMentions([]);
        setAttachments([]);
        setActiveMention(null);
        setMentionResults([]);
        setErrorMessage(null);
        setReplyTo(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleContentChange = (
        event: ChangeEvent<HTMLTextAreaElement>,
    ) => {
        const nextValue = event.target.value;

        setContent(nextValue);
        setErrorMessage(null);
        syncMentionState(nextValue, event.target.selectionStart);
    };

    const handleAttachmentSelect = (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const pickedFiles = Array.from(event.target.files ?? []);

        if (pickedFiles.length === 0) {
            return;
        }

        const remainingSlots = MAX_ATTACHMENTS - attachments.length;

        if (remainingSlots <= 0) {
            toast.error(t.uploadLimit);
            event.target.value = '';
            return;
        }

        const acceptedFiles = pickedFiles
            .filter((file) => file.type.startsWith('image/'))
            .slice(0, remainingSlots)
            .map((file, index) => ({
                id: `${file.name}-${file.lastModified}-${index}`,
                file,
                previewUrl: URL.createObjectURL(file),
            }));

        if (acceptedFiles.length !== pickedFiles.length) {
            toast.error(t.imageOnlyLimit);
        }

        setAttachments((previous) => [...previous, ...acceptedFiles]);
        setErrorMessage(null);
        event.target.value = '';
    };

    const removeAttachment = (attachmentId: string) => {
        setAttachments((previous) => {
            const target = previous.find(
                (attachment) => attachment.id === attachmentId,
            );

            if (target) {
                URL.revokeObjectURL(target.previewUrl);
            }

            return previous.filter(
                (attachment) => attachment.id !== attachmentId,
            );
        });
    };

    const insertMention = (user: MentionableUser) => {
        if (!activeMention) {
            return;
        }

        const before = content.slice(0, activeMention.start);
        const after = content.slice(activeMention.end);
        const mentionToken = `@${user.handle}`;
        const cleanedAfter = after.replace(/^\s+/, '');
        const nextValue = `${before}${mentionToken} ${
            cleanedAfter === '' ? '' : cleanedAfter
        }`;
        const nextCaretPosition = before.length + mentionToken.length + 1;

        setContent(nextValue);
        setSelectedMentions((previous) => {
            const deduped = previous.filter((mention) => mention.id !== user.id);

            return [
                ...deduped,
                {
                    id: user.id,
                    name: user.name,
                    handle: user.handle,
                    avatar: user.avatar,
                },
            ];
        });
        setActiveMention(null);
        setMentionResults([]);

        window.requestAnimationFrame(() => {
            const textarea = textareaRef.current;

            if (!textarea) {
                return;
            }

            textarea.focus();
            textarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
        });
    };

    const submitComment = async () => {
        if (submitting) {
            return;
        }

        if (content.trim() === '' && attachments.length === 0) {
            setErrorMessage(t.writeOrImageRequired);
            return;
        }

        const formData = new FormData();
        const csrfToken =
            document.querySelector<HTMLMetaElement>(
                'meta[name="csrf-token"]',
            )?.content ?? '';

        formData.append('content', content.trim());
        if (replyTo) {
            formData.append('parent_id', String(replyTo.id));
        }
        formData.append(
            'mentions',
            JSON.stringify(
                selectedMentions.filter((mention) =>
                    content.includes(`@${mention.handle}`),
                ),
            ),
        );

        attachments.forEach((attachment) => {
            formData.append('attachments[]', attachment.file);
        });

        try {
            setSubmitting(true);
            setErrorMessage(null);

            const response = await fetch(`/posts/${post.id}/comments`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            const responseType = response.headers.get('content-type') ?? '';
            const payload = responseType.includes('application/json')
                ? ((await response.json()) as CommentStoreResponse)
                : null;

            if (!response.ok) {
                const nextError =
                    Object.values(payload?.errors ?? {})
                        .flat()
                        .find(Boolean) ??
                    (response.status >= 500
                        ? t.serverErrorPost
                        : t.failedPost);

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
                    payload.comments_count ?? countAllComments(payload.comments),
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
            const nextError = t.genericPostError;
            setErrorMessage(nextError);
            toast.error(nextError);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReplyClick = (comment: CommentItem) => {
        setReplyTo({
            id: comment.id,
            name: comment.user?.name ?? t.unknownUser,
        });

        window.requestAnimationFrame(() => {
            textareaRef.current?.focus();
        });
    };

    const handleToggleCommentLike = async (commentId: number) => {
        if (likingCommentIds.includes(commentId)) {
            return;
        }

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';

        setLikingCommentIds((previous) => [...previous, commentId]);

        try {
            const response = await fetch(`/comments/${commentId}/like`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to toggle comment like.');
            }

            const payload = (await response.json()) as {
                liked: boolean;
                likes_count: number;
            };

            setComments((previous) =>
                updateCommentTree(previous, commentId, (item) => ({
                    ...item,
                    is_liked: payload.liked,
                    likes_count: payload.likes_count,
                })),
            );
        } catch {
            toast.error(t.genericPostError);
        } finally {
            setLikingCommentIds((previous) =>
                previous.filter((id) => id !== commentId),
            );
        }
    };

    const renderCommentBranch = (
        comment: CommentItem,
        floor: number,
        isRoot: boolean,
    ): ReactNode => {
        const depth = comment.depth ?? 1;

        return (
            <div
                key={comment.id}
                className={cn(
                    isRoot
                        ? 'border-t border-zinc-200/80 py-4'
                        : 'mt-3 ml-6 border-l border-zinc-200 pl-4',
                )}
            >
                <CommentCard
                    comment={comment}
                    floor={floor}
                    depth={depth}
                    onReply={() => handleReplyClick(comment)}
                    onToggleLike={() => void handleToggleCommentLike(comment.id)}
                    liking={likingCommentIds.includes(comment.id)}
                />

                {comment.replies && comment.replies.length > 0
                    ? comment.replies.map((reply) =>
                          renderCommentBranch(reply, floor, false),
                      )
                    : null}
            </div>
        );
    };

    const handleComposerKeyDown = (
        event: KeyboardEvent<HTMLTextAreaElement>,
    ) => {
        if (activeMention && mentionResults.length > 0) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setHighlightedMentionIndex((previous) =>
                    (previous + 1) % mentionResults.length,
                );
                return;
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setHighlightedMentionIndex((previous) =>
                    previous === 0
                        ? mentionResults.length - 1
                        : previous - 1,
                );
                return;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                insertMention(mentionResults[highlightedMentionIndex]);
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                setActiveMention(null);
                setMentionResults([]);
                return;
            }
        }

        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            void submitComment();
        }
    };

    return (
        <section className="px-4 pb-10">
            <div className="mb-4">
                <h2 className="text-base font-semibold text-zinc-950">{t.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                    {comments.length} {comments.length === 1 ? t.single : t.plural}
                </p>
            </div>

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

                        {replyTo ? (
                            <div className="mb-2 flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                <span>
                                    {trans(page, 'comment.replying_to', {
                                        name: replyTo.name,
                                    })}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setReplyTo(null)}
                                    className="font-semibold hover:text-rose-900"
                                >
                                    {t.cancelReply}
                                </button>
                            </div>
                        ) : null}

                        <div className="p-0">
                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={handleContentChange}
                                    onKeyDown={handleComposerKeyDown}
                                    onClick={() =>
                                        syncMentionState(
                                            content,
                                            textareaRef.current?.selectionStart ?? null,
                                        )
                                    }
                                    onKeyUp={() =>
                                        syncMentionState(
                                            content,
                                            textareaRef.current?.selectionStart ?? null,
                                        )
                                    }
                                    placeholder={t.writePlaceholder}
                                    className="min-h-[84px] w-full resize-none rounded-xl border-0 bg-zinc-100 px-5 py-4 text-base leading-7 text-zinc-800 outline-none transition placeholder:text-zinc-500 focus:bg-zinc-200/80 focus:ring-0"
                                />

                                {activeMention && (
                                    <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-md">
                                        <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 text-xs font-medium text-zinc-500">
                                            <AtSign className="h-3.5 w-3.5" />
                                            {t.mentionSomeone}
                                        </div>

                                        {loadingMentions ? (
                                            <div className="flex items-center gap-2 px-3 py-3 text-sm text-zinc-500">
                                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                                {t.loadingSuggestions}
                                            </div>
                                        ) : mentionResults.length > 0 ? (
                                            <div className="max-h-72 overflow-y-auto py-1">
                                                {mentionResults.map((user, index) => (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() => insertMention(user)}
                                                        className={cn(
                                                            'flex w-full items-center gap-3 px-3 py-2.5 text-left transition',
                                                            index === highlightedMentionIndex
                                                                ? 'bg-zinc-100'
                                                                : 'hover:bg-zinc-50',
                                                        )}
                                                    >
                                                        <UserAvatar
                                                            name={user.name}
                                                            avatar={user.avatar ?? null}
                                                            className="h-9 w-9"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-sm font-semibold text-zinc-900">
                                                                {user.name}
                                                            </div>
                                                            <div className="truncate text-xs text-zinc-500">
                                                                @{user.handle}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-3 py-3 text-sm text-zinc-500">
                                                {t.noMatchingPeople}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {attachments.length > 0 && (
                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {attachments.map((attachment) => (
                                        <div
                                            key={attachment.id}
                                            className="relative overflow-hidden rounded-md border border-zinc-200 bg-white"
                                        >
                                            <img
                                                src={attachment.previewUrl}
                                                alt={t.commentPreview}
                                                className="h-20 w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(attachment.id)}
                                                className="absolute top-1.5 right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                                                aria-label={t.removeImage}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {errorMessage && (
                                <p className="mt-3 text-sm font-medium text-red-600">
                                    {errorMessage}
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex h-8 items-center gap-2 rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] px-3 text-xs font-semibold text-white transition-all duration-200 hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black"
                                    >
                                        <ImagePlus className="h-3.5 w-3.5" />
                                        {t.addImage}
                                    </button>
                                    <span className="text-xs text-zinc-500">
                                        {t.photosLimitHint}
                                    </span>
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => void submitComment()}
                                    disabled={submitting}
                                    className="h-8 rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] px-4 text-white transition-all duration-200 hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black disabled:opacity-60 disabled:cursor-not-allowed"
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

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            multiple
                            className="hidden"
                            onChange={handleAttachmentSelect}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-4 divide-zinc-200/80">
                {comments.length > 0 ? (
                    comments.map((comment, index) =>
                        renderCommentBranch(comment, index + 1, true),
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
    onReply,
    onToggleLike,
    liking,
    className,
}: {
    comment: CommentItem;
    floor: number;
    depth: number;
    onReply: () => void;
    onToggleLike: () => void;
    liking: boolean;
    className?: string;
}) {
    const page = usePage<SharedPageProps>();
    const userName = comment.user?.name ?? trans(page, 'comment.unknown_user');
    const likeText = comment.is_liked
        ? trans(page, 'comment.liked')
        : trans(page, 'comment.like');

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
                        <Link
                            href={
                                comment.user?.id
                                    ? `/profilePage/${comment.user.id}`
                                    : '/profilePage'
                            }
                            className="cursor-pointer text-sm font-semibold text-zinc-950 transition-colors hover:text-[#de6b89] peer-hover:text-[#de6b89]"
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
                            {trans(page, 'comment.layer_label', { layer: depth })}
                        </span>
                    </div>

                    {comment.content.trim() !== '' && (
                        <div className="mt-2 border-l-2 border-zinc-200 pl-3 text-sm leading-6 text-zinc-800">
                            {renderCommentContent(
                                comment.content,
                                comment.mentions ?? [],
                            )}
                        </div>
                    )}

                    {comment.attachments && comment.attachments.length > 0 && (
                        <div
                            className={cn(
                                'mt-3 grid gap-2',
                                comment.attachments.length === 1
                                    ? 'grid-cols-1'
                                    : 'grid-cols-2',
                            )}
                        >
                            {comment.attachments.map((attachment, index) => (
                                <div
                                    key={`${attachment}-${index}`}
                                    className="overflow-hidden rounded-md bg-zinc-100"
                                >
                                    <img
                                        src={toStorageUrl(attachment)}
                                        alt={trans(page, 'comment.attachment_alt', {
                                            number: index + 1,
                                        })}
                                        className="h-36 w-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-3 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={onReply}
                            className="text-xs font-medium text-zinc-500 transition hover:text-zinc-800"
                        >
                            {trans(page, 'comment.reply')}
                        </button>
                        <button
                            type="button"
                            onClick={onToggleLike}
                            disabled={liking}
                            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Heart
                                className={cn(
                                    'h-3.5 w-3.5',
                                    comment.is_liked ? 'fill-rose-500 text-rose-500' : '',
                                )}
                            />
                            <span>{likeText}</span>
                            <span>{comment.likes_count ?? 0}</span>
                        </button>
                    </div>
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

function renderCommentContent(
    content: string,
    mentions: CommentMention[],
): ReactNode {
    const mentionMap = new Map(
        mentions.map((mention) => [mention.handle.toLowerCase(), mention]),
    );

    return content.split('\n').map((line, lineIndex, lines) => (
        <span key={`${line}-${lineIndex}`}>
            {line.split(/(@[a-z0-9][a-z0-9-]*)/gi).map((part, partIndex) => {
                if (!part.startsWith('@')) {
                    return <span key={`${part}-${partIndex}`}>{part}</span>;
                }

                const mention = mentionMap.get(part.slice(1).toLowerCase());

                if (!mention) {
                    return <span key={`${part}-${partIndex}`}>{part}</span>;
                }

                return (
                    <Link
                        key={`${mention.handle}-${partIndex}`}
                        href={`/profilePage/${mention.id}`}
                        className="font-semibold text-zinc-900 underline underline-offset-2"
                    >
                        {part}
                    </Link>
                );
            })}
            {lineIndex < lines.length - 1 ? <br /> : null}
        </span>
    ));
}

function toStorageUrl(path: string): string {
    if (
        path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('/')
    ) {
        return path;
    }

    return `/storage/${path}`;
}

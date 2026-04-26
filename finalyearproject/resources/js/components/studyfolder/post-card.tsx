import { Link } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { BtnSave } from '@/components/ui/btn-save';
import { QuizStatusBadge } from '@/components/ui/quiz-status-badge';
import { formatFormulaText } from '@/lib/formula-display';
import { formatTimeAgo, getLanguageLabel } from '@/lib/post-utils';
import type { BookmarkFolderItem, PostItem } from '@/types';
import {
    getFirstQuizQuestion,
    getPostTypeBadgeProps,
    getSubjectBadgeProps,
} from './study-folder-utils';
import type { TransFn } from './types';

const PostAttachments = lazy(() =>
    import('@/components/post-attachments').then((m) => ({
        default: m.PostAttachments,
    })),
);

type PostCardProps = {
    post: PostItem;
    folders: BookmarkFolderItem[];
    activeFolderId: number | null | undefined;
    movingPostIds: number[];
    savingPostIds: number[];
    onMove: (postId: number, folderId: number) => Promise<void>;
    onToggleSave: (postId: number) => void;
    trans: TransFn;
    showFolderSelect: boolean;
    showQuizPreview?: boolean;
};

export function PostCard({
    post,
    folders,
    activeFolderId,
    movingPostIds,
    savingPostIds,
    onMove,
    onToggleSave,
    trans,
    showFolderSelect,
    showQuizPreview = false,
}: PostCardProps) {
    const type =
        post.post_type === 'quiz'
            ? 'quiz'
            : post.post_type === 'question'
              ? 'question'
              : 'material';
    const { bg, text } = getPostTypeBadgeProps(type);
    const typeLabel =
        type === 'quiz'
            ? trans('createPost.create_quiz')
            : type === 'question'
              ? trans('createPost.ask_question')
              : trans('createPost.share_material');

    const quizStatus =
        post.is_quiz_completed === true
            ? 'correct'
            : post.is_quiz_completed === false && post.post_type === 'quiz'
              ? 'incorrect'
              : 'unanswered';

    const { question, correctAnswer } =
        post.post_type === 'quiz' && showQuizPreview
            ? getFirstQuizQuestion(post)
            : { question: null, correctAnswer: null };

    return (
        <article>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-sm text-zinc-500">
                    {post.is_anonymous ? (
                        <span className="truncate font-semibold text-zinc-500">
                            Anonymous User
                        </span>
                    ) : (
                        <Link
                            href={
                                post.user?.id
                                    ? `/profilePage/${post.user.id}`
                                    : '/profilePage'
                            }
                            className="truncate font-semibold text-zinc-800 transition hover:text-zinc-950"
                        >
                            {post.user?.name ?? trans('bookmark.unknown_user')}
                        </Link>
                    )}
                    <span>•</span>
                    <span className="shrink-0">
                        {formatTimeAgo(post.created_at)}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {showFolderSelect && folders.length > 0 ? (
                        <select
                            value={
                                post.bookmark_folder_id ?? activeFolderId ?? ''
                            }
                            disabled={movingPostIds.includes(post.id)}
                            onChange={(event) => {
                                void onMove(
                                    post.id,
                                    Number(event.target.value),
                                );
                            }}
                            className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {folders.map((folder) => (
                                <option key={folder.id} value={folder.id}>
                                    {folder.name}
                                </option>
                            ))}
                        </select>
                    ) : null}

                    <BtnSave
                        count={post.saves_count ?? 0}
                        saved={Boolean(post.is_saved)}
                        loading={savingPostIds.includes(post.id)}
                        onClick={() => onToggleSave(post.id)}
                    />
                </div>
            </div>

            <Link href={`/posts/${post.id}`} className="group block">
                <h2 className="text-lg font-bold text-zinc-900 transition group-hover:text-zinc-950">
                    {post.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 whitespace-pre-wrap text-zinc-600">
                    {formatFormulaText(post.content ?? '')}
                </p>
            </Link>

            {showQuizPreview &&
            post.post_type === 'quiz' &&
            (question || correctAnswer) ? (
                <div className="mt-4 rounded-[22px] border border-[#f4d6b3] bg-[#fff8ef] p-4">
                    {question ? (
                        <p className="text-sm font-semibold text-amber-800">
                            {question}
                        </p>
                    ) : null}
                    {correctAnswer ? (
                        <p className="mt-2 text-sm text-zinc-600">
                            <span className="font-semibold text-zinc-800">
                                {trans('bookmark.correct_answer_label')}:
                            </span>{' '}
                            {correctAnswer}
                        </p>
                    ) : null}
                </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${text}`}
                >
                    {typeLabel}
                </span>

                {post.language?.code ? (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                        {getLanguageLabel(post.language.code)}
                    </span>
                ) : null}

                {post.subject?.name
                    ? (() => {
                          const { bg: subjectBg, text: subjectText } =
                              getSubjectBadgeProps();
                          return (
                              <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${subjectBg} ${subjectText}`}
                              >
                                  {post.subject.name}
                              </span>
                          );
                      })()
                    : null}

                {post.post_type === 'quiz' && showQuizPreview ? (
                    <QuizStatusBadge status={quizStatus} />
                ) : null}

                <Link
                    href={`/posts/${post.id}`}
                    className="ml-auto inline-flex items-center gap-1 rounded-2xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800"
                >
                    <ExternalLink className="h-3 w-3" />
                    {showQuizPreview && post.post_type === 'quiz'
                        ? 'View Quiz'
                        : trans('bookmark.view_post')}
                </Link>
            </div>

            {post.image && post.image.length > 0 ? (
                <div className="mt-4">
                    <Suspense fallback={null}>
                        <PostAttachments files={post.image} compact />
                    </Suspense>
                </div>
            ) : null}
        </article>
    );
}

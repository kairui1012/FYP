import { Link } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { VerifiedTeacherBadge } from '@/components/VerifiedTeacherBadge';
import { BtnSave } from '@/components/ui/btn-save';
import { MaterialLearningStateBadge } from '@/components/ui/material-learning-state-badge';
import { QuizStatusBadge } from '@/components/ui/quiz-status-badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatFormulaText } from '@/lib/formula-display';
import {
    formatTimeAgo,
    getLanguageLabel,
    getSubjectLabel,
} from '@/lib/post-utils';
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
    showQuizStatus?: boolean;
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
    showQuizStatus = true,
}: PostCardProps) {
    const type =
        post.post_type === 'quiz'
            ? 'quiz'
            : post.post_type === 'question'
              ? 'question'
              : 'material';
    const { bg, text } = getPostTypeBadgeProps(type);
    const subjectLabel = getSubjectLabel(post.subject?.name, trans);
    const typeLabel =
        type === 'quiz'
            ? trans('createPost.create_quiz')
            : type === 'question'
              ? trans('createPost.ask_question')
              : trans('createPost.share_material');

    const quizStatus =
        post.is_quiz_completed === true && post.is_quiz_correct !== false
            ? 'correct'
            : post.post_type === 'quiz' &&
                (post.is_quiz_completed === false || post.is_quiz_correct === false)
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
                        <>
                            <Link
                                href={
                                    post.user?.id
                                        ? `/profilePage/${post.user.id}`
                                        : '/profilePage'
                                }
                                className={`truncate font-semibold transition ${post.user?.is_verified ? 'text-blue-600 hover:text-blue-700' : 'text-zinc-800 hover:text-zinc-950'}`}
                            >
                                {post.user?.name ?? trans('bookmark.unknown_user')}
                            </Link>
                            {post.user?.is_verified && (
                                <VerifiedTeacherBadge />
                            )}
                        </>
                    )}
                    <span>•</span>
                    <span className="shrink-0">
                        {formatTimeAgo(post.created_at)}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {showFolderSelect && folders.length > 0 ? (
                        <Select
                            value={
                                String(
                                    post.bookmark_folder_id ?? activeFolderId ?? '',
                                )
                            }
                            disabled={movingPostIds.includes(post.id)}
                            onValueChange={(value) => {
                                void onMove(post.id, Number(value));
                            }}
                        >
                            <SelectTrigger className="w-fit">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {folders.map((folder) => (
                                    <SelectItem
                                        key={folder.id}
                                        value={String(folder.id)}
                                    >
                                        {folder.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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

                {subjectLabel
                    ? (() => {
                          const { bg: subjectBg, text: subjectText } =
                              getSubjectBadgeProps();
                          return (
                              <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${subjectBg} ${subjectText}`}
                              >
                                  {subjectLabel}
                              </span>
                          );
                      })()
                    : null}

                {post.post_type === 'quiz' && showQuizPreview && showQuizStatus ? (
                    <QuizStatusBadge status={quizStatus} />
                ) : null}
                {post.post_type === 'material' ? (
                    <MaterialLearningStateBadge
                        state={post.material_learning_state}
                    />
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

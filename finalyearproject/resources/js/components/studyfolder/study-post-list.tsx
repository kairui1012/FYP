import { BookOpen, CheckCircle2 } from 'lucide-react';
import { Fragment } from 'react';
import type { PostItem } from '@/types';
import { EmptyState } from './empty-state';
import { PostCard } from './post-card';
import type { QuizFolderMode, TransFn } from './types';

type StudyPostListProps = {
    posts: PostItem[];
    studyMode: QuizFolderMode;
    trans: TransFn;
    savingPostIds: number[];
    onToggleSave: (id: number) => void;
};

export function StudyPostList({
    posts,
    studyMode,
    trans,
    savingPostIds,
    onToggleSave,
}: StudyPostListProps) {
    const emptyMessage =
        studyMode === 'completed'
            ? trans('bookmark.no_quiz_completed')
            : trans('bookmark.no_correct_answers');

    if (posts.length === 0) {
        return (
            <EmptyState
                icon={studyMode === 'completed' ? <BookOpen /> : <CheckCircle2 />}
                title={emptyMessage}
            />
        );
    }

    return (
        <div>
            {posts.map((post, index) => (
                <Fragment key={post.id}>
                    {index > 0 && <hr className="my-5 border-zinc-100" />}
                    <PostCard
                        post={post}
                        folders={[]}
                        activeFolderId={null}
                        movingPostIds={[]}
                        savingPostIds={savingPostIds}
                        onMove={() => Promise.resolve()}
                        onToggleSave={onToggleSave}
                        trans={trans}
                        showFolderSelect={false}
                        showQuizPreview
                    />
                </Fragment>
            ))}
        </div>
    );
}

import { Bookmark, BookOpen } from 'lucide-react';
import { StatusPill } from './status-pill';
import type { TransFn } from './types';

type StudyFolderHeaderProps = {
    totalSaves: number;
    savedQuizzesCount: number;
    trans: TransFn;
};

export function StudyFolderHeader({
    totalSaves,
    savedQuizzesCount,
    trans,
}: StudyFolderHeaderProps) {
    return (
        <section className="px-1 py-2">
            <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-2xl">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                        My Study Folder
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                        {trans('bookmark.description')}
                    </p>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2.5 lg:justify-end">
                    <StatusPill
                        icon={<Bookmark className="h-4 w-4" />}
                        label="Saved Posts"
                        value={totalSaves}
                    />
                    <StatusPill
                        icon={<BookOpen className="h-4 w-4" />}
                        label="Saved Quizzes"
                        value={savedQuizzesCount}
                    />
                </div>
            </div>
        </section>
    );
}

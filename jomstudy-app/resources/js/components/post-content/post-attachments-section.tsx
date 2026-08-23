import { lazy, Suspense } from 'react';

const PostAttachments = lazy(() =>
    import('@/components/post-attachments').then((module) => ({
        default: module.PostAttachments,
    })),
);

type PostAttachmentsSectionProps = {
    files: string[] | null;
};

export function PostAttachmentsSection({ files }: PostAttachmentsSectionProps) {
    return (
        <Suspense fallback={<div className="h-64 rounded-xl bg-zinc-100" />}>
            <PostAttachments files={files} />
        </Suspense>
    );
}

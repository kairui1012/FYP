import { lazy, Suspense } from 'react';

const PostAttachmentViewer = lazy(() =>
    import('@/components/shared/post-attachment-viewer').then((module) => ({
        default: module.PostAttachmentViewer,
    })),
);

type PostAttachmentsSectionProps = {
    files: string[] | null;
};

export function PostAttachmentsSection({ files }: PostAttachmentsSectionProps) {
    return (
        <Suspense fallback={<div className="h-64 rounded-xl bg-zinc-100" />}>
            <PostAttachmentViewer files={files} />
        </Suspense>
    );
}

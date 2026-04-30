import { Head, usePage } from '@inertiajs/react';
import type { ReactElement, ReactNode } from 'react';
import { PostActionFooter } from '@/components/post-content/post-action-footer';
import { PostAttachmentsSection } from '@/components/post-content/post-attachments-section';
import { PostBackAuthorHeader } from '@/components/post-content/post-back-author-header';
import { PostContentCommentsPanel } from '@/components/post-content/post-content-comments-panel';
import { trans } from '@/components/post-content/post-content-config';
import { PostContentMainSection } from '@/components/post-content/post-content-main-section';
import { PostDeleteModal } from '@/components/post-content/post-delete-modal';
import { PostTranslateActions } from '@/components/post-content/post-translate-actions';
import type { PostContentProps } from '@/components/post-content/types';
import { usePostContentController } from '@/components/post-content/use-post-content-controller';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem } from '@/types';

export default function PostContent({ post }: PostContentProps) {
    const page = usePage();
    const controller = usePostContentController({
        post,
        pageProps: page.props as Record<string, unknown>,
    });

    return (
        <>
            <Head title={controller.translated?.title ?? post.title} />

            <div className="w-full bg-white pb-20 sm:pb-40">
                <div className="mx-auto w-full max-w-3xl">
                    <PostBackAuthorHeader
                        post={post}
                        page={page}
                        backHref={homePage()}
                        currentUserId={controller.currentUserId}
                        displayName={controller.displayName}
                        isAnonymousPost={controller.isAnonymousPost}
                        isFollowingAuthor={controller.isFollowingAuthor}
                        followingAuthorLoading={controller.followingAuthorLoading}
                        trans={trans}
                        onFollowAuthor={controller.handleFollowAuthor}
                    />

                    <PostContentMainSection
                        page={page}
                        post={post}
                        translatedTitle={controller.translated?.title ?? post.title}
                        displayedContent={controller.displayedContent}
                        isAdmin={controller.isAdmin}
                        isEditing={controller.isEditing}
                        linkedQuizzes={controller.linkedQuizzes}
                        analytics={controller.analytics}
                        quizData={controller.quizData}
                        selectedAnswers={controller.selectedAnswers}
                        resultStates={controller.resultStates}
                        editTitle={controller.editTitle}
                        editContent={controller.editContent}
                        materialEditBlocks={controller.materialEditBlocks}
                        editErrors={controller.editErrors}
                        editLoading={controller.editLoading}
                        trans={trans}
                        onEditTitleChange={controller.setEditTitle}
                        onEditContentChange={controller.setEditContent}
                        onSaveEdit={controller.handleEditSave}
                        onCancelEdit={controller.handleEditCancel}
                        onAddMaterialBlock={controller.addMaterialEditBlock}
                        onUpdateMaterialBlock={controller.updateMaterialEditBlock}
                        onUpdateMaterialBlockFile={
                            controller.updateMaterialEditBlockFile
                        }
                        onRemoveMaterialBlock={controller.removeMaterialEditBlock}
                        onMoveMaterialBlock={controller.moveMaterialEditBlock}
                        onSaveMaterialEdit={controller.handleMaterialEditSave}
                        onAnswerSelect={controller.handleAnswerSelect}
                        onCheckAnswer={(questionIndex) => {
                            void controller.handleCheckAnswer(questionIndex);
                        }}
                    />

                    <PostAttachmentsSection files={post.image} />

                    <PostActionFooter
                        postId={post.id}
                        liked={controller.isLiked}
                        loading={controller.liking}
                        onLike={controller.handleLike}
                        likes={controller.likesCount}
                        comments={controller.commentsCount}
                        onSave={controller.handleSave}
                        saved={controller.isSaved}
                        saves={controller.savesCount}
                        saveLoading={controller.saving}
                        onComment={controller.handleCommentClick}
                        isOwner={controller.canManagePost}
                        onEdit={controller.handleEditStart}
                        onDelete={() => controller.setShowDeleteModal(true)}
                        editLabel={trans('createPost.edit_post', page)}
                        deleteLabel={trans('createPost.delete_post', page)}
                    />

                    <PostTranslateActions
                        page={page}
                        title={post.title}
                        content={post.content ?? ''}
                        postType={post.post_type}
                        onTranslate={controller.setTranslated}
                    />

                    <div className="my-10 w-full border-t border-zinc-200" />
                    <PostContentCommentsPanel
                        page={page}
                        post={post}
                        onCommentsCountChange={controller.setCommentsCount}
                    />
                </div>
            </div>

            {controller.showDeleteModal && (
                <PostDeleteModal
                    page={page}
                    loading={controller.deleteLoading}
                    trans={trans}
                    onCancel={() => controller.setShowDeleteModal(false)}
                    onConfirm={controller.handleDeleteConfirm}
                />
            )}
        </>
    );
}

PostContent.layout = (page: ReactNode) => {
    const pageWithProps = page as ReactElement<PostContentProps>;
    const { post } = pageWithProps.props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Home',
            href: homePage(),
        },
        {
            title: post.title,
            href: `/posts/${post.id}`,
        },
    ];

    return <AppLayout breadcrumbs={breadcrumbs}>{pageWithProps}</AppLayout>;
};

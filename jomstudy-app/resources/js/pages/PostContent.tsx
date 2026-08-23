import { Head, usePage } from '@inertiajs/react';
import type { ReactElement, ReactNode } from 'react';
import { PostActionFooter } from '@/components/post-content/post-action-footer';
import { PostAttachmentsSection } from '@/components/post-content/post-attachments-section';
import { PostBackAuthorHeader } from '@/components/post-content/post-back-author-header';
import { PostContentCommentsPanel } from '@/components/post-content/post-content-comments-panel';
import { trans } from '@/component-new/config/post-content-config';
import { PostContentMainSection } from '@/components/post-content/post-content-main-section';
import { PostDeleteModal } from '@/components/post-content/post-delete-modal';
import { PostTranslateActions } from '@/components/post-content/post-translate-actions';
import type { PostContentProps } from '@/components/post-content/types';
import { usePostContentController } from '@/components/post-content/use-post-content-controller';
import AppLayout from '@/layouts/app-layout';
import { followingPage, homePage } from '@/routes';
import type { BreadcrumbItem } from '@/types';

export default function PostContent({ post }: PostContentProps) {
    const page = usePage();
    const controller = usePostContentController({
        post,
        pageProps: page.props as Record<string, unknown>,
    });
    const materialTranslationTexts =
        post.post_type === 'material'
            ? controller.materialTranslationTexts
            : undefined;

    const urlSearch = page.url.includes('?') ? page.url.split('?')[1] : '';
    const urlParams = new URLSearchParams(urlSearch);
    const fromTab = urlParams.get('tab');
    const source = urlParams.get('source');
    const backHref =
        source === 'following'
            ? followingPage().url
            : fromTab === 'feed' || fromTab === 'learn'
            ? `${homePage().url}?tab=${fromTab}`
            : homePage().url;

    return (
        <>
            <Head title={controller.translated?.title ?? post.title} />

            <div className="w-full bg-white pb-20 sm:pb-40">
                <div className="mx-auto w-full max-w-3xl">
                    <PostBackAuthorHeader
                        post={post}
                        page={page}
                        backHref={backHref}
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
                        displayedMaterialBlocks={
                            controller.displayedMaterialBlocks
                        }
                        canViewLearningAnalytics={
                            controller.canViewLearningAnalytics
                        }
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
                        canReport={Boolean(controller.currentUserId)}
                        reportLoading={controller.reportLoading}
                        reported={controller.reported}
                        onEdit={controller.handleEditStart}
                        onDelete={() => controller.setShowDeleteModal(true)}
                        onReport={() => {
                            void controller.handleReportPost();
                        }}
                        editLabel={trans('createPost.edit_post', page)}
                        deleteLabel={trans('createPost.delete_post', page)}
                        reportLabel={trans('comment.report', page)}
                        reportedLabel={trans('comment.report_sent', page)}
                    />

                    <PostTranslateActions
                        page={page}
                        title={post.title}
                        content={post.content ?? ''}
                        texts={materialTranslationTexts}
                        onTranslate={controller.setTranslated}
                        onTranslateTexts={
                            post.post_type === 'material'
                                ? controller.handleMaterialTextBlocksTranslate
                                : undefined
                        }
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

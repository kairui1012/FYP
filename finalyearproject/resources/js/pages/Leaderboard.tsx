import { reactLang } from '@erag/lang-sync-inertia';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import AppLayout from '@/layouts/app-layout';
import { leaderboard as leaderboardRoute } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Leaderboard',
        href: leaderboardRoute(),
    },
];

interface User {
    id: number;
    name: string;
    avatar?: string;
    like_count?: number;
    comment_count?: number;
}

interface LeaderboardProps {
    topPostLikers: User[];
    topCommenters: User[];
    topContributorsByComments: User[];
    topCommentLikers: User[];
}

export default function Leaderboard({ topPostLikers, topCommenters, topContributorsByComments, topCommentLikers }: LeaderboardProps) {
    const { trans } = reactLang();
    const t = {
        pageTitle: trans('profile.page_title'), // Using a similar translation key
        communityTitle: trans('leaderboard.community_title') || 'Community Leaderboard',
        communitySubtitle: trans('leaderboard.community_subtitle') || 'Top contributors in various community activities',
        topLikedPosts: trans('leaderboard.top_liked_posts') || 'Top Liked Posts',
        mostCommentedPosts: trans('leaderboard.most_commented_posts') || 'Most Commented Posts',
        topCommentContributors: trans('leaderboard.top_comment_contributors') || 'Top Comment Contributors',
        mostLikedComments: trans('leaderboard.most_liked_comments') || 'Most Liked Comments',
        likes: trans('leaderboard.likes') || 'Likes',
        comments: trans('leaderboard.comments') || 'Comments',
        commentsMade: trans('leaderboard.comments_made') || 'Comments Made',
        commentLikes: trans('leaderboard.comment_likes') || 'Comment Likes',
    };
    
    const [activeTab, setActiveTab] = useState<'post-likes' | 'post-comments' | 'comment-contributions' | 'comment-likes'>('post-likes');

    const renderUserList = (users: User[], countLabel: string) => (
        <div className="mt-6 space-y-3">
            {users.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            {index + 1}
                        </div>
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="bg-zinc-200 dark:bg-zinc-700">
                                {user.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.name}</span>
                    </div>
                    <div className="text-right">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {user.like_count || user.comment_count || 0}
                        </span>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{countLabel}</div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="pb-8">
            <Head title={trans('navigation.leaderboard')} />
            <div className="w-full max-w-none p-4 md:p-6 md:pb-10">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{t.communityTitle}</h1>
                        <p className="text-zinc-600 dark:text-zinc-400">{t.communitySubtitle}</p>
                    </div>
                    
                    <div className="flex border-b border-zinc-200 dark:border-zinc-800 pb-4">
                        <button
                            className={`py-3 px-1 font-medium text-sm ${activeTab === 'post-likes' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
                            onClick={() => setActiveTab('post-likes')}
                        >
                            {t.topLikedPosts}
                        </button>
                        <button
                            className={`py-3 px-1 font-medium text-sm mx-6 ${activeTab === 'post-comments' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
                            onClick={() => setActiveTab('post-comments')}
                        >
                            {t.mostCommentedPosts}
                        </button>
                        <button
                            className={`py-3 px-1 font-medium text-sm ${activeTab === 'comment-contributions' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
                            onClick={() => setActiveTab('comment-contributions')}
                        >
                            {t.topCommentContributors}
                        </button>
                        <button
                            className={`py-3 px-1 font-medium text-sm ml-6 ${activeTab === 'comment-likes' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
                            onClick={() => setActiveTab('comment-likes')}
                        >
                            {t.mostLikedComments}
                        </button>
                    </div>

                    {activeTab === 'post-likes' && renderUserList(topPostLikers, t.likes)}
                    {activeTab === 'post-comments' && renderUserList(topCommenters, t.comments)}
                    {activeTab === 'comment-contributions' && renderUserList(topContributorsByComments, t.commentsMade)}
                    {activeTab === 'comment-likes' && renderUserList(topCommentLikers, t.commentLikes)}
                </div>
            </div>
        </div>
    );
}

Leaderboard.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
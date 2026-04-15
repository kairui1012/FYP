import { reactLang } from '@erag/lang-sync-inertia';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import AppLayout from '@/layouts/app-layout';
import { leaderboard as leaderboardRoute } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Heart, MessageCircle, Sparkles } from 'lucide-react';

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
    totalLeaderboard: {
        topPostLikers: User[];
        topCommenters: User[];
        topContributorsByComments: User[];
        topCommentLikers: User[];
    };
    weeklyLeaderboard: {
        topPostLikers: User[];
        topCommenters: User[];
        topContributorsByComments: User[];
        topCommentLikers: User[];
    };
    weeklyMeta: {
        start: string;
        end: string;
        nextRefreshAt: string;
    };
}

type ScopeKey = 'weekly' | 'total';

type TabKey =
    | 'post-likes'
    | 'post-comments'
    | 'comment-contributions'
    | 'comment-likes';

type LeaderboardDataset = {
    key: TabKey;
    label: string;
    users: User[];
    metricLabel: string;
    icon: ReactNode;
    accent: string;
};

export default function Leaderboard({ totalLeaderboard, weeklyLeaderboard, weeklyMeta }: LeaderboardProps) {
    const { trans } = reactLang();
    const t = {
        pageTitle: trans('profile.page_title'), // Using a similar translation key
        communityTitle: trans('leaderboard.community_title') || 'Community Leaderboard',
        communitySubtitle: trans('leaderboard.community_subtitle') || 'Top contributors in various community activities',
        weeklyHot: trans('leaderboard.weekly_hot') || 'This Week Hot',
        totalRanking: trans('leaderboard.total_ranking') || 'Total Ranking',
        weeklyRefresh: trans('leaderboard.weekly_refresh') || 'Weekly refresh',
        topTen: trans('leaderboard.top_ten') || 'Top 10',
        topLikedPosts: trans('leaderboard.top_liked_posts') || 'Top Liked Posts',
        mostCommentedPosts: trans('leaderboard.most_commented_posts') || 'Most Commented Posts',
        topCommentContributors: trans('leaderboard.top_comment_contributors') || 'Top Comment Contributors',
        mostLikedComments: trans('leaderboard.most_liked_comments') || 'Most Liked Comments',
        likes: trans('leaderboard.likes') || 'Likes',
        comments: trans('leaderboard.comments') || 'Comments',
        commentsMade: trans('leaderboard.comments_made') || 'Comments Made',
        commentLikes: trans('leaderboard.comment_likes') || 'Comment Likes',
    };

    const [activeScope, setActiveScope] = useState<ScopeKey>('weekly');
    const [activeTab, setActiveTab] = useState<TabKey>('post-likes');

    const source = activeScope === 'weekly' ? weeklyLeaderboard : totalLeaderboard;

    const datasets: LeaderboardDataset[] = [
        {
            key: 'post-likes',
            label: t.topLikedPosts,
            users: source.topPostLikers,
            metricLabel: t.likes,
            icon: <Heart className="h-4 w-4" />,
            accent: 'from-rose-400 to-pink-500',
        },
        {
            key: 'post-comments',
            label: t.mostCommentedPosts,
            users: source.topCommenters,
            metricLabel: t.comments,
            icon: <MessageCircle className="h-4 w-4" />,
            accent: 'from-sky-400 to-blue-500',
        },
        {
            key: 'comment-contributions',
            label: t.topCommentContributors,
            users: source.topContributorsByComments,
            metricLabel: t.commentsMade,
            icon: <Sparkles className="h-4 w-4" />,
            accent: 'from-amber-400 to-orange-500',
        },
        {
            key: 'comment-likes',
            label: t.mostLikedComments,
            users: source.topCommentLikers,
            metricLabel: t.commentLikes,
            icon: <Crown className="h-4 w-4" />,
            accent: 'from-violet-400 to-fuchsia-500',
        },
    ];

    const activeDataset = datasets.find((dataset) => dataset.key === activeTab) ?? datasets[0];
    
    const readMetric = (user: User) => user.like_count ?? user.comment_count ?? 0;
    
    // Filter out users with 0 metric (0 posts and 0 likes)
    const activeUsers = activeDataset.users.filter((user) => readMetric(user) > 0);
    const topTenUsers = activeUsers.slice(0, 10);
    const topThreeUsers = topTenUsers.slice(0, 3);
    const listUsers = topTenUsers.slice(3, 10);

    const refreshDate = new Date(weeklyMeta.nextRefreshAt);

    const rankStyle = (rank: number) => {
        if (rank === 1) return 'bg-amber-100 text-amber-800';
        if (rank === 2) return 'bg-slate-200 text-slate-800';
        if (rank === 3) return 'bg-orange-100 text-orange-800';
        return 'bg-zinc-100 text-zinc-700';
    };

    return (
        <div className="pb-8">
            <Head title={trans('navigation.leaderboard')} />
            <div className="w-full max-w-none p-4 md:p-6 md:pb-10">
                <div className="mx-auto max-w-5xl space-y-6">
                    <div className="space-y-3">
                        <h1 className="mb-2 text-3xl font-bold text-zinc-900">{t.communityTitle}</h1>
                        <p className="text-zinc-600">{t.communitySubtitle}</p>
                        <div className="inline-flex gap-2 rounded-lg border border-zinc-200 p-1">
                            <button
                                onClick={() => setActiveScope('weekly')}
                                className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                                    activeScope === 'weekly' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                {t.weeklyHot}
                            </button>
                            <button
                                onClick={() => setActiveScope('total')}
                                className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                                    activeScope === 'total' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                {t.totalRanking}
                            </button>
                        </div>
                    </div>
                    {activeScope === 'weekly' && !Number.isNaN(refreshDate.getTime()) ? (
                        <div className="mt-3 inline-flex items-center gap-2 bg-zinc-600 px-3 py-2 text-xs text-zinc-100">
                            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                            <span className="font-medium text-amber-100">{t.weeklyRefresh}</span>
                            <span className="h-1.5 w-1.5 bg-amber-200 animate-pulse" />
                            <span>{weeklyMeta.start} ~ {weeklyMeta.end}</span>
                            <span className="text-zinc-400">|</span>
                            <span>Next: {refreshDate.toLocaleString()}</span>
                        </div>
                    ) : null}


                    <div className="overflow-x-auto pb-1">
                        {datasets.map((dataset) => {
                            const isActive = activeTab === dataset.key;

                            return (
                                <button
                                    key={dataset.key}
                                    onClick={() => setActiveTab(dataset.key)}
                                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                                        isActive
                                            ? `bg-linear-to-r ${dataset.accent} text-white`
                                            : 'text-zinc-600 hover:bg-zinc-100'
                                    }`}
                                >
                                    {dataset.icon}
                                    {dataset.label}
                                </button>
                            );
                        })}

                    </div>

                    {activeUsers.length === 0 ? (
                        <div className="border border-dashed border-zinc-300 p-10 text-center text-zinc-500">
                            No leaderboard data yet.
                        </div>
                    ) : (
                        <div className="space-y-4 border-t border-zinc-200 pt-4">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                {topThreeUsers.map((user, index) => {
                                    const rank = index + 1;

                                    return (
                                        <article key={user.id} className="rounded-xl border border-zinc-100 px-3 py-3">
                                            <div className="mb-3 flex items-center justify-between">
                                                <span
                                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${rankStyle(rank)}`}
                                                >
                                                    {rank}
                                                </span>
                                                <span className="text-xs text-zinc-500">{activeDataset.metricLabel}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={user.avatar} alt={user.name} />
                                                    <AvatarFallback className="bg-zinc-200 text-zinc-700">
                                                        {user.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-zinc-900">{user.name}</p>
                                                    <p className="text-sm font-bold text-zinc-900">{readMetric(user)}</p>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            <div className="divide-y divide-zinc-200">
                                {listUsers.map((user, index) => {
                                    const rank = index + 4;

                                    return (
                                        <div key={user.id} className="flex items-center justify-between py-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-700">
                                                    {rank}
                                                </span>
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={user.avatar} alt={user.name} />
                                                    <AvatarFallback className="bg-zinc-200 text-zinc-700">
                                                        {user.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-zinc-900">{user.name}</p>
                                                    <p className="text-xs text-zinc-500">{activeDataset.metricLabel}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-zinc-900">{readMetric(user)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

Leaderboard.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
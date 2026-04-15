import { reactLang } from '@erag/lang-sync-inertia';
import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { achievements as achievementsRoute } from '@/routes';
import { Crown, Sparkles, Star, Trophy } from 'lucide-react';

type Badge = {
    id: number;
    key: string;
    name: string;
    description: string;
    icon?: string | null;
    points_required: number;
    awarded_at?: string | null;
};

type PageProps = {
    summary: {
        points: number;
        posts_count: number;
        likes_received_count: number;
    };
    badges: Badge[];
    next_badge: Badge | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Achievements',
        href: achievementsRoute(),
    },
];

const badgeIconMap = {
    Sparkles,
    Star,
    Trophy,
    Crown,
} as const;

export default function AchievementsPage() {
    const { trans } = reactLang();
    const { summary, badges, next_badge } = usePage<PageProps>().props;

    const t = {
        title: trans('navigation.achievements'),
        description: trans('achievement.description', 'Track your achievements and milestones'),
        yourAchievements: trans('achievement.your_achievements', 'Your Achievements'),
        points: trans('achievement.points', 'Points'),
        postsCreated: trans('achievement.posts_created', 'Posts Created'),
        likesReceived: trans('achievement.likes_received', 'Likes Received'),
        noAchievements: trans('achievement.no_achievements', 'No achievements yet'),
        earnAchievements: trans('achievement.earn_achievements', 'Complete activities to earn achievements'),
        nextBadge: trans('achievement.next_badge', 'Next badge'),
        pointsToUnlock: trans('achievement.points_to_unlock', 'points to unlock'),
    };

    return (
        <>
            <Head title={t.title} />

            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 md:px-6">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900">{t.title}</h1>
                    <p className="mt-2 text-zinc-600">
                        {t.description}
                    </p>
                </div>

                <section className="grid gap-3 md:grid-cols-3">
                    <article className="border border-zinc-200 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">{t.points}</p>
                        <p className="mt-1 text-2xl font-bold text-zinc-900">{summary.points}</p>
                    </article>
                    <article className="border border-zinc-200 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">{t.postsCreated}</p>
                        <p className="mt-1 text-2xl font-bold text-zinc-900">{summary.posts_count}</p>
                    </article>
                    <article className="border border-zinc-200 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">{t.likesReceived}</p>
                        <p className="mt-1 text-2xl font-bold text-zinc-900">{summary.likes_received_count}</p>
                    </article>
                </section>

                {next_badge ? (
                    <section className="bg-zinc-900 px-4 py-3 text-zinc-100">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">{t.nextBadge}</p>
                        <p className="mt-1 text-sm font-medium text-zinc-100">
                            {next_badge.name} · {Math.max(next_badge.points_required - summary.points, 0)} {t.pointsToUnlock}
                        </p>
                    </section>
                ) : null}

                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                        <Trophy className="h-5 w-5" />
                        {t.yourAchievements}
                    </h2>

                    {badges.length === 0 ? (
                        <div className="border border-dashed border-zinc-300 py-10 text-center">
                            <Trophy className="mx-auto h-12 w-12 text-zinc-400" />
                            <h3 className="mt-4 text-lg font-medium text-zinc-800">
                                {t.noAchievements}
                            </h3>
                            <p className="mt-2 text-sm text-zinc-500">
                                {t.earnAchievements}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {badges.map((badge) => {
                                const Icon = badge.icon && badge.icon in badgeIconMap
                                    ? badgeIconMap[badge.icon as keyof typeof badgeIconMap]
                                    : Trophy;

                                return (
                                    <article key={badge.id} className="border border-zinc-200 px-4 py-3">
                                        <div className="mb-2 flex items-center gap-2">
                                            <Icon className="h-4 w-4 text-amber-600" />
                                            <p className="font-semibold text-zinc-900">{badge.name}</p>
                                        </div>
                                        <p className="text-sm text-zinc-600">{badge.description}</p>
                                        <p className="mt-2 text-xs text-zinc-500">
                                            {badge.points_required} {t.points}
                                        </p>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

AchievementsPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
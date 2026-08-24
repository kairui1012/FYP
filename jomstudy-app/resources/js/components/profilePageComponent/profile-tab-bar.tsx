import { cn } from '@/lib/common-helpers';

type ProfileTab = 'posts' | 'badges';

type ProfileTabButtonProps = {
    id: ProfileTab;
    label: string;
    count: number;
    activeTab: ProfileTab;
    onTabChange: (tab: ProfileTab) => void;
};

function ProfileTabButton({
    id,
    label,
    count,
    activeTab,
    onTabChange,
}: ProfileTabButtonProps) {
    const activeClass = 'border-[#e27193] bg-[#fff0f5] text-[#b93c61]';
    const inactiveClass =
        'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400';
    const activeBadge = 'bg-[#ffd9e4] text-[#b93c61]';
    const inactiveBadge = 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800';

    return (
        <button
            type="button"
            onClick={() => onTabChange(id)}
            className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                activeTab === id ? activeClass : inactiveClass,
            )}
        >
            {label}
            <span
                className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs',
                    activeTab === id ? activeBadge : inactiveBadge,
                )}
            >
                {count}
            </span>
        </button>
    );
}

export function ProfileTabBar({
    activeTab,
    postsCount,
    badgesCount,
    labels,
    onTabChange,
}: {
    activeTab: ProfileTab;
    postsCount: number;
    badgesCount: number;
    labels: { posts: string; badges: string };
    onTabChange: (tab: ProfileTab) => void;
}) {
    return (
        <div className="flex gap-2">
            <ProfileTabButton
                id="posts"
                label={labels.posts}
                count={postsCount}
                activeTab={activeTab}
                onTabChange={onTabChange}
            />
            <ProfileTabButton
                id="badges"
                label={labels.badges}
                count={badgesCount}
                activeTab={activeTab}
                onTabChange={onTabChange}
            />
        </div>
    );
}

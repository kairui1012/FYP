type HomeHeroSectionProps = {
    isHomePage: boolean;
    isFollowingPage: boolean;
    activeTab: 'learn' | 'feed';
    onChangeTab: (tab: 'learn' | 'feed') => void;
    text: {
        heroTitle: string;
        heroSubtitle: string;
        followingTitle: string;
        followingSubtitle: string;
        learnTab: string;
        feedTab: string;
    };
};

export function HomeHeroSection({
    isHomePage,
    isFollowingPage,
    activeTab,
    onChangeTab,
    text,
}: HomeHeroSectionProps) {
    return (
        <section className="rounded-3xl bg-linear-to-r from-[#f6faf8] via-[#eef6ff] to-[#fff6f0] p-5 shadow-sm ring-1 ring-zinc-200/70 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                        {isFollowingPage ? text.followingTitle : text.heroTitle}
                    </h1>
                    <p className="mt-1 text-sm text-zinc-600">
                        {isFollowingPage
                            ? text.followingSubtitle
                            : text.heroSubtitle}
                    </p>
                </div>
                {isHomePage ? (
                    <div className="inline-flex w-fit self-start rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-zinc-200">
                        <button
                            type="button"
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'learn' ? 'bg-[#e27193] text-white shadow-sm' : 'text-zinc-600 hover:text-[#e27193]'}`}
                            onClick={() => onChangeTab('learn')}
                        >
                            {text.learnTab}
                        </button>
                        <button
                            type="button"
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'feed' ? 'bg-[#e27193] text-white shadow-sm' : 'text-zinc-600 hover:text-[#e27193]'}`}
                            onClick={() => onChangeTab('feed')}
                        >
                            {text.feedTab}
                        </button>
                    </div>
                ) : null}
            </div>
        </section>
    );
}

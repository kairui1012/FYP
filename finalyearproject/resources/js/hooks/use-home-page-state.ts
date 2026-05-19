import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export function useHomePageState(pageContext: 'home' | 'following') {
    const isHomePage = pageContext === 'home';
    const isFollowingPage = pageContext === 'following';
    const [activeTab, setActiveTab] = useState<'learn' | 'feed'>(() => {
        if (!isHomePage) return 'feed';
        const params = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );
        const tab = params.get('tab');
        return tab === 'feed' ? 'feed' : 'learn';
    });

    useEffect(() => {
        if (isFollowingPage && sessionStorage.getItem('followingPageDirty')) {
            sessionStorage.removeItem('followingPageDirty');
            router.reload({ only: ['posts'] });
        }
    }, [isFollowingPage]);

    // Clean up NProgress artifacts left by Inertia navigation
    useEffect(() => {
        document.documentElement.classList.remove('nprogress-busy');
        document.body.classList.remove('nprogress-busy');
        document.documentElement.style.cursor = '';
        document.body.style.cursor = '';
    }, []);

    return {
        isHomePage,
        isFollowingPage,
        activeTab: isHomePage ? activeTab : 'feed',
        setActiveTab,
    };
}

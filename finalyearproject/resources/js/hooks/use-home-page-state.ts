import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { PostItem } from '@/types';

export function useHomePageState(
    pageContext: 'home' | 'following',
    posts: PostItem[],
) {
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
        if (!isHomePage) setActiveTab('feed');
    }, [isHomePage]);

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

    return { isHomePage, isFollowingPage, activeTab, setActiveTab };
}

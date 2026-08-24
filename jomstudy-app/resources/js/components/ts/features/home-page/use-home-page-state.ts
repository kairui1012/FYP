import { useEffect, useState } from 'react';
import type { HomePageContext } from './home-page-types';

export function useHomePageState(pageContext: HomePageContext) {
    const isHomePage = pageContext === 'home';
    const [activeTab, setActiveTab] = useState<'learn' | 'feed'>(() => {
        if (!isHomePage) return 'feed';

        const params = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );
        return params.get('tab') === 'feed' ? 'feed' : 'learn';
    });

    useEffect(() => {
        document.documentElement.classList.remove('nprogress-busy');
        document.body.classList.remove('nprogress-busy');
        document.documentElement.style.cursor = '';
        document.body.style.cursor = '';
    }, []);

    return {
        isHomePage,
        activeTab: isHomePage ? activeTab : 'feed',
        setActiveTab,
    };
}

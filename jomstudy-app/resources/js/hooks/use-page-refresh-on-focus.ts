import { router } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Reload the current Inertia page whenever the tab/window regains focus.
 *
 * Inertia pages compute their data once on the server when first loaded, so
 * actions taken elsewhere (following a user, earning an achievement, etc.) do
 * not show up until a manual refresh. Re-fetching on focus keeps the page in
 * sync without wiring up per-action reload logic.
 *
 * @param only Optional list of props to reload. Omit to reload the whole page.
 */
export function usePageRefreshOnFocus(only?: string[]) {
    useEffect(() => {
        const handleFocus = () => {
            if (document.visibilityState === 'hidden') return;
            router.reload(only ? { only } : {});
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [only?.join(',')]);
}

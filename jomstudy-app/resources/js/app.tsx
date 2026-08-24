import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import '../css/app.css';
import { initializeThemePreference } from '@/hooks/use-theme-preference';

const appName = import.meta.env.VITE_APP_NAME || 'jomstudy';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <>
                    <App {...props} />
                    <Toaster
                        position="bottom-center"
                        toastOptions={{
                            style: {
                                borderRadius: '9999px',
                                padding: '10px 16px',
                            },
                        }}
                    />
                </>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeThemePreference();

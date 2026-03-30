import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Home',
        href: homePage(),
    },
];

export default function HomePage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Home" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative flex-1 overflow-hidden  md:min-h-min dark:border-sidebar-border">
                </div>
            </div>
        </AppLayout>
        // <div className="flex min-h-screen w-full flex-col">{children}</div>
    );
}

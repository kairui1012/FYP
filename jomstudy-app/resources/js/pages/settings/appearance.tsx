import { reactLang } from '@erag/lang-sync-inertia';
import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/settingsPageComponent/appearance-tabs';
import Heading from '@/components/shared/settings-heading';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editAppearance } from '@/routes/appearance';
import type { BreadcrumbItem } from '@/types';

export default function Appearance() {
    const { trans } = reactLang();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: trans('settings.appearance_heading'),
            href: editAppearance(),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={trans('settings.appearance_heading')} />

            <h1 className="sr-only">{trans('settings.appearance_heading')}</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title={trans('settings.appearance_heading')}
                        description={trans('settings.appearance_description')}
                    />
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

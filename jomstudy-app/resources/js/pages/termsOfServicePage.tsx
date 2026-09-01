import { reactLang } from '@erag/lang-sync-inertia';
import { Head } from '@inertiajs/react';
import type { ReactElement, ReactNode } from 'react';
import { PublicLegalLayout } from '@/components/shared/public-legal-layout';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const termsRoute = '/terms-of-service';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Terms of Service',
        href: termsRoute,
    },
];

export default function TermsOfServicePage() {
    const { trans } = reactLang();
    const sections = [
        {
            title: trans('legal.legal_terms_accounts_title'),
            body: trans('legal.legal_terms_accounts_body'),
        },
        {
            title: trans('legal.legal_terms_conduct_title'),
            body: trans('legal.legal_terms_conduct_body'),
        },
        {
            title: trans('legal.legal_terms_content_title'),
            body: trans('legal.legal_terms_content_body'),
        },
        {
            title: trans('legal.legal_terms_moderation_title'),
            body: trans('legal.legal_terms_moderation_body'),
        },
        {
            title: trans('legal.legal_terms_liability_title'),
            body: trans('legal.legal_terms_liability_body'),
        },
        {
            title: trans('legal.legal_terms_changes_title'),
            body: trans('legal.legal_terms_changes_body'),
        },
        {
            title: trans('legal.legal_terms_contact_title'),
            body: trans('legal.legal_terms_contact_body'),
        },
    ];

    return (
        <div className="min-h-[calc(100svh-4rem)] bg-zinc-50 pb-20">
            <Head title={trans('legal.legal_terms_title')}>
                <meta
                    name="description"
                    head-key="description"
                    content="Read the terms and conditions for using Learning Community Platform."
                />
                <meta property="og:title" head-key="og:title" content={trans('legal.legal_terms_title')} />
                <meta
                    property="og:description"
                    head-key="og:description"
                    content="Read the terms and conditions for using Learning Community Platform."
                />
                <meta name="twitter:title" head-key="twitter:title" content={trans('legal.legal_terms_title')} />
                <meta
                    name="twitter:description"
                    head-key="twitter:description"
                    content="Read the terms and conditions for using Learning Community Platform."
                />
                <link rel="canonical" href={termsRoute} head-key="canonical" />
            </Head>

            <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
                <header className="mb-6 border-b border-zinc-200 pb-5">
                    <h1 className="text-3xl font-semibold text-zinc-950">
                        {trans('legal.legal_terms_title')}
                    </h1>
                    <p className="mt-2 text-sm text-zinc-500">
                        {trans('legal.legal_last_updated')}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-zinc-700 md:text-base">
                        {trans('legal.legal_terms_intro')}
                    </p>
                </header>

                <div className="space-y-4">
                    {sections.map((section) => (
                        <section
                            key={section.title}
                            className="rounded-xl border border-zinc-200 bg-white p-5"
                        >
                            <h2 className="text-lg font-semibold text-zinc-900">
                                {section.title}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-zinc-700 md:text-base">
                                {section.body}
                            </p>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}

TermsOfServicePage.layout = (page: ReactNode) => {
    const pageWithProps = page as ReactElement<{
        auth?: { user?: unknown };
    }>;
    const isAuthenticated = Boolean(pageWithProps.props?.auth?.user);

    if (isAuthenticated) {
        return <AppLayout breadcrumbs={breadcrumbs}>{pageWithProps}</AppLayout>;
    }

    return <PublicLegalLayout>{pageWithProps}</PublicLegalLayout>;
};

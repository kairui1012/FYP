import { reactLang } from '@erag/lang-sync-inertia';
import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AppHeaderForUnlogin } from '@/component-new/header/header-for-unlogin';
import { Button } from '@/component-new/button/button';

const privacyRoute = '/privacy-policy';

function PublicLegalLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <AppHeaderForUnlogin />
            {children}
        </>
    );
}

export default function PrivacyPolicyPage() {
    const { trans } = reactLang();
    const sections = [
        {
            title: trans('legal.legal_privacy_collect_title'),
            body: trans('legal.legal_privacy_collect_body'),
        },
        {
            title: trans('legal.legal_privacy_use_title'),
            body: trans('legal.legal_privacy_use_body'),
        },
        {
            title: trans('legal.legal_privacy_share_title'),
            body: trans('legal.legal_privacy_share_body'),
        },
        {
            title: trans('legal.legal_privacy_retention_title'),
            body: trans('legal.legal_privacy_retention_body'),
        },
        {
            title: trans('legal.legal_privacy_rights_title'),
            body: trans('legal.legal_privacy_rights_body'),
        },
        {
            title: trans('legal.legal_privacy_contact_title'),
            body: trans('legal.legal_privacy_contact_body'),
        },
    ];

    return (
        <div className="min-h-[calc(100svh-4rem)] bg-zinc-50 pb-20">
            <Head title={trans('legal.legal_privacy_title')}>
                <meta
                    name="description"
                    head-key="description"
                    content="Read how Learning Community Platform collects, uses, and protects your personal data."
                />
                <meta property="og:title" head-key="og:title" content={trans('legal.legal_privacy_title')} />
                <meta
                    property="og:description"
                    head-key="og:description"
                    content="Read how Learning Community Platform collects, uses, and protects your personal data."
                />
                <meta name="twitter:title" head-key="twitter:title" content={trans('legal.legal_privacy_title')} />
                <meta
                    name="twitter:description"
                    head-key="twitter:description"
                    content="Read how Learning Community Platform collects, uses, and protects your personal data."
                />
                <link rel="canonical" href={privacyRoute} head-key="canonical" />
            </Head>

            <div className="mx-auto w-full max-w-4xl px-4 py-8 ">
                <header className="mb-3 border-b border-zinc-200 pb-3">
                    <h1 className="text-3xl font-semibold text-zinc-950">
                        {trans('legal.legal_privacy_title')}
                    </h1>
                     
                    <p className="mt-2 text-sm text-zinc-500">
                        {trans('legal.legal_last_updated')}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-zinc-700 md:text-base">
                        {trans('legal.legal_privacy_intro')}
                    </p>

                    <Button
                        asChild
                        variant="outline"
                        className="border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 my-2"
                    >
                        <Link href="/">
                            {trans('navigation.back_to_home')}
                        </Link>
                    </Button>
                </header>

                <div className="space-y-3">
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

PrivacyPolicyPage.layout = (page: ReactNode) => (
    <PublicLegalLayout>{page}</PublicLegalLayout>
);

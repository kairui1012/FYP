import { reactLang } from '@erag/lang-sync-inertia';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, Brain, MessageSquare, Trophy, Globe, Bookmark } from 'lucide-react';
import { AppHeaderForUnlogin } from '@/component-new/header/header-for-unlogin';
import { Button } from '@/component-new/button/button';
import { login, register } from '@/routes';

type LandingPageProps = {
    canRegister: boolean;
};

const highlights = [
    { title: 'landing.features.ai_learning.title', description: 'landing.features.ai_learning.description', icon: Brain },
    { title: 'landing.features.resource_sharing.title', description: 'landing.features.resource_sharing.description', icon: BookOpen },
    { title: 'landing.features.qna_community.title', description: 'landing.features.qna_community.description', icon: MessageSquare },
    { title: 'landing.features.achievements.title', description: 'landing.features.achievements.description', icon: Trophy },
    { title: 'landing.features.multilingual_support.title', description: 'landing.features.multilingual_support.description', icon: Globe },
    { title: 'landing.features.save_follow.title', description: 'landing.features.save_follow.description', icon: Bookmark },
];

const faqs = [
    { question: 'landing.faqs.q1.question', answer: 'landing.faqs.q1.answer' },
    { question: 'landing.faqs.q2.question', answer: 'landing.faqs.q2.answer' },
    { question: 'landing.faqs.q3.question', answer: 'landing.faqs.q3.answer' },
];

export default function LandingPage({ canRegister }: LandingPageProps) {
    const { trans } = reactLang();
    return (
        <>
            <Head>
                <title>Learning Community Platform | Study, Share, Improve</title>
                <meta
                    name="description"
                    head-key="description"
                    content="A collaborative learning platform for students and educators to share study materials, ask questions, and track learning progress."
                />
                <meta property="og:title" head-key="og:title" content="Learning Community Platform | Study, Share, Improve" />
                <meta
                    property="og:description"
                    head-key="og:description"
                    content="Share study materials, join discussions, and improve learning outcomes with a community-first platform."
                />
                <meta property="og:url" head-key="og:url" content="/" />
                <meta name="twitter:title" head-key="twitter:title" content="Learning Community Platform | Study, Share, Improve" />
                <meta
                    name="twitter:description"
                    head-key="twitter:description"
                    content="A collaborative learning platform for students and educators to share study materials, ask questions, and track learning progress."
                />
                <link rel="canonical" href="/" head-key="canonical" />
            </Head>

            <div className="min-h-screen bg-[#fffdf8] text-zinc-900">
                <AppHeaderForUnlogin />

                <main>
                    <section className="relative overflow-hidden border-b border-zinc-200/80 bg-[radial-gradient(circle_at_10%_20%,#ffe6df_0,#fff4eb_36%,#fffdf8_75%)]">
                        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 md:px-8 md:py-24">
                            <div className="max-w-3xl">
                                <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
                                    <span className="text-[#d6597a]">{trans('landing.hero_title_long')}</span>
                                </h1>
                                <p className="mt-6 max-w-2xl text-base text-zinc-700 sm:text-lg">{trans('landing.hero_subtitle')}</p>

                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    <Button asChild className="h-11 bg-[#d6597a] px-6 text-sm font-semibold hover:bg-[#c84e6f]">
                                        <Link href={login()}>{trans('landing.start_learning')}</Link>
                                    </Button>
                                    {canRegister ? (
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="h-11 border-zinc-300 bg-white px-6 text-sm font-semibold"
                                        >
                                            <Link href={register()}>{trans('landing.create_account')}</Link>
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mx-auto w-full max-w-6xl px-4 py-14 md:px-8 md:py-20">
                        <div className="grid gap-5 sm:grid-cols-2">
                            {highlights.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <article
                                        key={item.title}
                                        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_8px_30px_rgb(0_0_0/0.04)]"
                                    >
                                        <div className="mb-4 inline-flex rounded-xl bg-[#fff0ea] p-2.5 text-[#d6597a]">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-lg font-bold tracking-tight">{trans(item.title)}</h2>
                                        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{trans(item.description)}</p>
                                    </article>
                                );
                            })}
                        </div>
                    </section>

                    <section className="border-y border-zinc-200 bg-[#fff7f2]">
                        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-8 md:py-18">
                            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{trans('landing.faqs.title')}</h2>
                            <div className="mt-6 space-y-4">
                                {faqs.map((faq) => (
                                    <article key={faq.question} className="rounded-xl border border-zinc-200 bg-white p-5">
                                        <h3 className="text-base font-semibold">{trans(faq.question)}</h3>
                                        <p className="mt-2 text-sm text-zinc-600">{trans(faq.answer)}</p>
                                    </article>
                                ))}
                            </div>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Button
                                    asChild
                                    variant="outline"
                                    className="border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                                >
                                    <a href="/privacy-policy">
                                        {trans('navigation.privacy_policy')}
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}

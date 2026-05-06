import { Head, Link } from '@inertiajs/react';
import { BookOpen, Brain, MessageSquare, Trophy } from 'lucide-react';
import { AppHeaderForUnlogin } from '@/components/app-header-for-unlogin';
import { Button } from '@/components/ui/button';
import { login, register } from '@/routes';

type LandingPageProps = {
    canRegister: boolean;
};

const highlights = [
    {
        title: 'Study Materials That Stay Organized',
        description: 'Share notes, learning materials, and quizzes in one clean place for every subject.',
        icon: BookOpen,
    },
    {
        title: 'Ask Questions and Get Better Answers',
        description: 'Post academic questions, join comment discussions, and learn from your peers faster.',
        icon: MessageSquare,
    },
    {
        title: 'Track Progress and Achievements',
        description: 'Monitor learning progress, quiz outcomes, and points to stay motivated consistently.',
        icon: Trophy,
    },
    {
        title: 'AI-Assisted Learning Support',
        description: 'Use AI-assisted tools to understand concepts and review difficult content more effectively.',
        icon: Brain,
    },
];

const faqs = [
    {
        question: 'Who is this platform for?',
        answer: 'This platform is built for students and educators who want to share learning content and collaborate in one community.',
    },
    {
        question: 'Do I need an account to use all features?',
        answer: 'Yes. You can browse this landing page publicly, but posting, saving, and progress tracking require an account.',
    },
    {
        question: 'Can I log in with Google?',
        answer: 'Yes. Google sign-in is available so you can get started quickly.',
    },
];

export default function LandingPage({ canRegister }: LandingPageProps) {
    return (
        <>
            <Head>
                <title>Learning Community Platform | Study, Share, Improve</title>
                <meta
                    name="description"
                    content="A collaborative learning platform for students and educators to share study materials, ask questions, and track learning progress."
                />
                <meta property="og:title" content="Learning Community Platform | Study, Share, Improve" />
                <meta
                    property="og:description"
                    content="Share study materials, join discussions, and improve learning outcomes with a community-first platform."
                />
            </Head>

            <div className="min-h-screen bg-[#fffdf8] text-zinc-900">
                <AppHeaderForUnlogin />

                <main>
                    <section className="relative overflow-hidden border-b border-zinc-200/80 bg-[radial-gradient(circle_at_10%_20%,#ffe6df_0,#fff4eb_36%,#fffdf8_75%)]">
                        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 md:px-8 md:py-24">
                            <div className="max-w-3xl">
                                <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
                                    Turn Study Notes into
                                    <span className="text-[#d6597a]"> Shared Learning Momentum</span>
                                </h1>
                                <p className="mt-6 max-w-2xl text-base text-zinc-700 sm:text-lg">
                                    Create materials, discuss difficult questions, and track progress across your courses in one focused platform.
                                </p>

                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    <Button asChild className="h-11 bg-[#d6597a] px-6 text-sm font-semibold hover:bg-[#c84e6f]">
                                        <Link href={login()}>Start Learning</Link>
                                    </Button>
                                    {canRegister ? (
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="h-11 border-zinc-300 bg-white px-6 text-sm font-semibold"
                                        >
                                            <Link href={register()}>Create Free Account</Link>
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
                                        <h2 className="text-lg font-bold tracking-tight">{item.title}</h2>
                                        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.description}</p>
                                    </article>
                                );
                            })}
                        </div>
                    </section>

                    <section className="border-y border-zinc-200 bg-[#fff7f2]">
                        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-8 md:py-18">
                            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Frequently Asked Questions</h2>
                            <div className="mt-6 space-y-4">
                                {faqs.map((faq) => (
                                    <article key={faq.question} className="rounded-xl border border-zinc-200 bg-white p-5">
                                        <h3 className="text-base font-semibold">{faq.question}</h3>
                                        <p className="mt-2 text-sm text-zinc-600">{faq.answer}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}

import { Head } from '@inertiajs/react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { renderAsync } from 'docx-preview';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem } from '@/types';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type FeedPost = {
    id: number;
    title: string;
    content: string;
    image: string[] | null;
    files?: string[] | null;
    created_at: string;
    language?: {
        code: 'en' | 'zh' | 'bm' | string;
        name: string;
    } | null;
    user?: {
        name: string;
    } | null;
    likes_count?: number;
    comments_count?: number;
};

type HomePageProps = {
    posts?: FeedPost[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Home',
        href: homePage(),
    },
];

function getLanguageLabel(code?: string) {
    if (code === 'en') return 'English';
    if (code === 'zh') return '中文';
    if (code === 'bm') return 'Bahasa Malaysia';
    return code ?? 'Unknown';
}

function formatTimeAgo(dateString: string) {
    const now = new Date().getTime();
    const target = new Date(dateString).getTime();
    const diff = Math.max(0, now - target);

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < hour) return `${Math.floor(diff / minute) || 1}m`;
    if (diff < day) return `${Math.floor(diff / hour)}h`;
    return `${Math.floor(diff / day)}d`;
}

function PdfViewer({ src }: { src: string }) {
    const [numPages, setNumPages] = useState(0);
    return (
        <Document
            file={src}
            loading={<div className="p-4 text-sm text-zinc-500">Loading PDF...</div>}
            error={<div className="p-4 text-sm text-red-600">Failed to load PDF file.</div>}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
            {Array.from({ length: numPages }, (_, i) => (
                <Page
                    key={i}
                    pageNumber={i + 1}
                    width={600}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                />
            ))}
        </Document>
    );
}

function DocxViewer({ src }: { src: string }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        fetch(src).then(r => r.blob()).then(blob => renderAsync(blob, ref.current!));
    }, [src]);
    return <div ref={ref} />;
}

export default function HomePage({ posts = [] }: HomePageProps) {
    return (
        <>
            <Head title="Home" />
            <div className="bg-transparent pb-6">
                <div className="mx-auto w-full max-w-3xl space-y-4 p-4 pb-8 md:p-6 md:pb-10">
                    {posts.length === 0 ? (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
                            No posts yet. Be the first to post!
                        </div>
                    ) : (
                        posts.map((post) => (
                            <article
                                key={post.id}
                                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                            >
                                <header className="mb-3 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700">
                                            {(post.user?.name ?? 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900">
                                                {post.user?.name ?? 'Unknown User'}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <span>{formatTimeAgo(post.created_at)}</span>
                                                <span>•</span>
                                                <span className="rounded-full bg-zinc-100 px-2 py-0.5">
                                                    {getLanguageLabel(post.language?.code)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </header>

                                <h2 className="mb-2 text-base font-semibold text-zinc-900">{post.title}</h2>
                                <p className="mb-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                                    {post.content}
                                </p>

                                {post.image && post.image.length > 0 && (
                                    <>
                                        {/* 图片 */}
                                        {(() => {
                                            const images = post.image!.filter(f => !f.endsWith('.pdf') && !f.endsWith('.docx'));
                                            return images.length > 0 && (
                                                images.length === 1 ? (
                                                    <div className="mb-3 w-full flex justify-center">
                                                        <img
                                                            src={`/storage/${images[0]}`}
                                                            alt="Post image"
                                                            className="w-full max-w-md rounded-xl object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                        {images.map((src, index) => (
                                                            <img
                                                                key={`${post.id}-img-${index}`}
                                                                src={`/storage/${src}`}
                                                                alt={`Post image ${index + 1}`}
                                                                className="h-64 w-full rounded-xl object-cover"
                                                            />
                                                        ))}
                                                    </div>
                                                )
                                            );
                                        })()}

                                        {/* PDF / DOCX */}
                                        {post.image!.filter(f => f.endsWith('.pdf') || f.endsWith('.docx')).map((file, i) => (
                                            <div key={i} className="mb-3 rounded-xl border border-zinc-200 overflow-hidden">
                                                {file.endsWith('.pdf')
                                                    ? <PdfViewer src={`/storage/${file}`} />
                                                    : <DocxViewer src={`/storage/${file}`} />
                                                }
                                            </div>
                                        ))}
                                    </>
                                )}

                                <div className="border-t border-zinc-100 w-full mt-5"></div>
                                <footer className="mt-2 flex justify-between text-sm text-zinc-600 max-w-10/12 mx-auto">
                                    <button className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-100">
                                        <Heart className="h-4 w-4" />
                                        <span>{post.likes_count ?? 0}</span>
                                    </button>
                                    <button className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-100">
                                        <MessageCircle className="h-4 w-4" />
                                        <span>{post.comments_count ?? 0}</span>
                                    </button>
                                    <button className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-100">
                                        <Share2 className="h-4 w-4" />
                                        <span>Share</span>
                                    </button>
                                </footer>
                            </article>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

HomePage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
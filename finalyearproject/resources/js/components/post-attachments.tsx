import { renderAsync } from 'docx-preview';
import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PostAttachmentsProps = {
    files?: string[] | string | null;
    compact?: boolean;
};

function isAbsoluteUrl(path: string): boolean {
    return path.startsWith('http://') || path.startsWith('https://');
}

function toAssetUrl(path: string): string {
    return isAbsoluteUrl(path) ? path : `/storage/${path}`;
}

function isDocumentFile(file: string) {
    const normalizedFile = file.toLowerCase();
    return (
        normalizedFile.endsWith('.pdf') ||
        normalizedFile.endsWith('.doc') ||
        normalizedFile.endsWith('.docx') ||
        normalizedFile.endsWith('.xls') ||
        normalizedFile.endsWith('.xlsx') ||
        normalizedFile.endsWith('.ppt') ||
        normalizedFile.endsWith('.pptx')
    );
}

function getDocumentExtension(file: string): string {
    return (file.toLowerCase().split('.').pop() ?? '').toUpperCase();
}

function PdfViewer({ src }: { src: string }) {
    const [numPages, setNumPages] = useState(0);
    return (
        <Document
            file={src}
            loading={<div className="p-4 text-sm text-zinc-400">Loading PDF...</div>}
            error={<div className="p-4 text-sm text-red-400">Failed to load PDF file.</div>}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
            {Array.from({ length: numPages }, (_, index) => (
                <Page
                    key={index}
                    pageNumber={index + 1}
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
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const container = ref.current;
        if (container) container.innerHTML = '';

        const loadDocument = async () => {
            try {
                const response = await fetch(src);
                if (!response.ok) throw new Error('Failed to fetch DOCX file.');
                const blob = await response.blob();
                if (!cancelled && container) await renderAsync(blob, container);
            } catch {
                if (!cancelled) setHasError(true);
            }
        };

        setHasError(false);
        void loadDocument();
        return () => {
            cancelled = true;
            if (container) container.innerHTML = '';
        };
    }, [src]);

    if (hasError) {
        return <div className="p-4 text-sm text-red-400">Failed to load DOCX file.</div>;
    }
    return <div ref={ref} className="p-4" />;
}

function OfficeFileCard({ src, filename }: { src: string; filename: string }) {
    const extension = getDocumentExtension(filename);

    return (
        <div className="flex flex-col gap-3 p-4">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{filename}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {extension} file preview is not available. Open or download the file.
            </div>
            <div className="flex gap-2">
                <a
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                    Open
                </a>
                <a
                    href={src}
                    download
                    className="inline-flex items-center rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                    Download
                </a>
            </div>
        </div>
    );
}

// Lightbox overlay
function Lightbox({
    images,
    initialIndex,
    onClose,
}: {
    images: string[];
    initialIndex: number;
    onClose: () => void;
}) {
    const [current, setCurrent] = useState(initialIndex);
    const total = images.length;

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + total) % total);
            if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % total);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose, total]);

    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
            {/* Reddit-style blurred backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            {/* Close button */}
            <button
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                onClick={onClose}
                aria-label="Close"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Image */}
            <div className="relative z-10 flex max-h-[90vh] max-w-[90vw] items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <img
                    src={toAssetUrl(images[current])}
                    alt={`Attachment ${current + 1}`}
                    className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                />
            </div>

            {/* Prev / Next */}
            {total > 1 && (
                <>
                    <button
                        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrent((c) => (c - 1 + total) % total);
                        }}
                        aria-label="Previous"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrent((c) => (c + 1) % total);
                        }}
                        aria-label="Next"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrent(i);
                                }}
                                className={`h-1.5 rounded-full transition-all ${i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
                                aria-label={`Go to image ${i + 1}`}
                            />
                        ))}
                    </div>

                    <div className="absolute right-4 bottom-4 z-10 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">
                        {current + 1} / {total}
                    </div>
                </>
            )}
        </div>
    );
}

// 单图
function SingleImage({
    src,
    compact,
    onClick,
}: {
    src: string;
    compact: boolean;
    onClick: () => void;
}) {
    return (
        <div
            className={`relative w-full mx-auto max-w-[95%] sm:max-w-[760px] overflow-hidden bg-zinc-200 cursor-zoom-in ${
                compact ? 'max-h-[320px] rounded-xl' : 'max-h-[480px] rounded-2xl'
            } mt-4 sm:mt-6`}
            style={{ minHeight: compact ? 140 : 200 }}
            onClick={onClick}
        >
            {/* 模糊背景 */}
            <img
                src={toAssetUrl(src)}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-[1.15] object-cover opacity-50 blur-md"
            />
            <img
                src={toAssetUrl(src)}
                alt="Post attachment"
                className="relative z-10 mx-auto block h-full w-full object-contain"
                style={{ maxHeight: compact ? 320 : 480, maxWidth: '100%' }}
            />
        </div>
    );
}


function ImageCarousel({
    images,
    compact,
    onImageClick,
}: {
    images: string[];
    compact: boolean;
    onImageClick: (index: number) => void;
}) {
    const [current, setCurrent] = useState(0);
    const total = images.length;
    const displayHeight = compact ? 320 : 480;

    const prev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrent((c) => (c - 1 + total) % total);
    };
    const next = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrent((c) => (c + 1) % total);
    };

    return (
        <div
            className={`relative w-full mx-auto max-w-[95%] sm:max-w-[760px] overflow-hidden bg-zinc-200 cursor-zoom-in ${
                compact ? 'rounded-xl' : 'rounded-2xl'
            } mt-4 sm:mt-6`}
            style={{ minHeight: compact ? 140 : 200, height: displayHeight, maxHeight: displayHeight }}
            onClick={() => onImageClick(current)}
        >
            <div className="relative mx-auto h-full w-full">
                {images.map((src, index) => (
                    <img
                        key={src}
                        src={toAssetUrl(src)}
                        alt={`Post attachment ${index + 1}`}
                        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
                            index === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                        style={{ maxHeight: displayHeight, maxWidth: '100%' }}
                    />
                ))}
            </div>

            <button onClick={prev} className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white transition" aria-label="Previous image">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <button onClick={next} className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white transition" aria-label="Next image">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </button>

            <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 flex gap-1.5">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrent(index);
                        }}
                        className={`h-1.5 rounded-full transition-all ${index === current ? 'w-4 bg-zinc-700' : 'w-1.5 bg-zinc-400/70'}`}
                        aria-label={`Go to image ${index + 1}`}
                    />
                ))}
            </div>

            <div className="absolute right-3 top-2 z-20 rounded-full bg-black/30 px-2 py-0.5 text-xs text-white">
                {current + 1} / {total}
            </div>
        </div>
    );
}

export function PostAttachments({
    files = [],
    compact = false,
}: PostAttachmentsProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const attachmentFiles = Array.isArray(files)
        ? files
        : typeof files === 'string' && files.trim() !== ''
        ? [files]
        : [];

    if (attachmentFiles.length === 0) return null;

    const images = attachmentFiles.filter((file) => !isDocumentFile(file));
    const documents = attachmentFiles.filter((file) => isDocumentFile(file));

    return (
        <>
            <div className={`flex flex-col ${compact ? 'gap-3' : 'gap-4'} mt-4 sm:mt-6 mx-auto max-w-[95%]`}>
                {images.length === 1 && (
                    <SingleImage src={images[0]} compact={compact} onClick={() => setLightboxIndex(0)} />
                )}
                {images.length > 1 && (
                    <ImageCarousel images={images} compact={compact} onImageClick={setLightboxIndex} />
                )}

                {documents.map((file, index) => (
                    <div
                        key={`${file}-${index}`}
                        className={`overflow-auto border border-zinc-400 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${
                            compact ? 'max-h-[480px] rounded-xl' : 'max-h-[720px] rounded-2xl'
                        } mt-4 sm:mt-6 mx-auto max-w-[95%] sm:max-w-[760px]`}
                    >
                        {file.toLowerCase().endsWith('.pdf') ? (
                            <PdfViewer src={toAssetUrl(file)} />
                        ) : file.toLowerCase().endsWith('.docx') ? (
                            <DocxViewer src={toAssetUrl(file)} />
                        ) : (
                            <OfficeFileCard src={toAssetUrl(file)} filename={file} />
                        )}
                    </div>
                ))}
            </div>

            {lightboxIndex !== null && (
                <Lightbox images={images} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
            )}
        </>
    );
}

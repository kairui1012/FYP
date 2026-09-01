import { reactLang } from '@erag/lang-sync-inertia';
import { useEffect, useState } from 'react';
import {
    isDocumentFile,
    toAttachmentUrl as toAssetUrl,
} from '../../ts/shared/post-attachments/post-attachment-utils';
import { DocumentAttachmentPreview } from './document-attachment-preview';

type PostAttachmentViewerProps = {
    files?: string[] | string | null;
    compact?: boolean;
};

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
    const { trans } = reactLang();
    const [current, setCurrent] = useState(initialIndex);
    const total = images.length;

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft')
                setCurrent((c) => (c - 1 + total) % total);
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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Reddit-style blurred backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            {/* Close button */}
            <button
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                onClick={onClose}
                aria-label={trans('navigation.close')}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>

            {/* Image */}
            <div
                className="relative z-10 flex max-h-[90vh] max-w-[90vw] items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={toAssetUrl(images[current])}
                    alt={trans('navigation.attachment_number').replace(
                        ':number',
                        String(current + 1),
                    )}
                    className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                />
            </div>

            {/* Prev / Next */}
            {total > 1 && (
                <>
                    <button
                        className="absolute top-1/2 left-4 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrent((c) => (c - 1 + total) % total);
                        }}
                        aria-label={trans('navigation.previous')}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </button>
                    <button
                        className="absolute top-1/2 right-4 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrent((c) => (c + 1) % total);
                        }}
                        aria-label={trans('navigation.next')}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrent(i);
                                }}
                                className={`h-1.5 rounded-full transition-all ${i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
                                aria-label={trans(
                                    'navigation.go_to_image',
                                ).replace(':number', String(i + 1))}
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
    const { trans } = reactLang();
    return (
        <div
            className={`relative mx-auto w-full max-w-[95%] cursor-zoom-in overflow-hidden bg-zinc-200 sm:max-w-[760px] ${
                compact
                    ? 'max-h-[320px] rounded-xl'
                    : 'max-h-[480px] rounded-2xl'
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
                alt={trans('navigation.attachment_alt')}
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
    const { trans } = reactLang();
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
            className={`relative mx-auto w-full max-w-[95%] cursor-zoom-in overflow-hidden bg-zinc-200 sm:max-w-[760px] ${
                compact ? 'rounded-xl' : 'rounded-2xl'
            } mt-4 sm:mt-6`}
            style={{
                minHeight: compact ? 140 : 200,
                height: displayHeight,
                maxHeight: displayHeight,
            }}
            onClick={() => onImageClick(current)}
        >
            <div className="relative mx-auto h-full w-full">
                {images.map((src, index) => (
                    <img
                        key={src}
                        src={toAssetUrl(src)}
                        alt={trans('navigation.attachment_number').replace(
                            ':number',
                            String(index + 1),
                        )}
                        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
                            index === current
                                ? 'opacity-100'
                                : 'pointer-events-none opacity-0'
                        }`}
                        style={{ maxHeight: displayHeight, maxWidth: '100%' }}
                    />
                ))}
            </div>

            <button
                onClick={prev}
                className="absolute top-1/2 left-2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow transition hover:bg-white"
                aria-label={trans('navigation.previous_image')}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-zinc-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>

            <button
                onClick={next}
                className="absolute top-1/2 right-2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow transition hover:bg-white"
                aria-label={trans('navigation.next_image')}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-zinc-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </button>

            <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrent(index);
                        }}
                        className={`h-1.5 rounded-full transition-all ${index === current ? 'w-4 bg-zinc-700' : 'w-1.5 bg-zinc-400/70'}`}
                        aria-label={trans('navigation.go_to_image').replace(
                            ':number',
                            String(index + 1),
                        )}
                    />
                ))}
            </div>

            <div className="absolute top-2 right-3 z-20 rounded-full bg-black/30 px-2 py-0.5 text-xs text-white">
                {current + 1} / {total}
            </div>
        </div>
    );
}

export function PostAttachmentViewer({
    files = [],
    compact = false,
}: PostAttachmentViewerProps) {
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
            <div
                className={`flex flex-col ${compact ? 'gap-3' : 'gap-4'} mx-auto mt-4 max-w-[95%] sm:mt-6`}
            >
                {images.length === 1 && (
                    <SingleImage
                        src={images[0]}
                        compact={compact}
                        onClick={() => setLightboxIndex(0)}
                    />
                )}
                {images.length > 1 && (
                    <ImageCarousel
                        images={images}
                        compact={compact}
                        onImageClick={setLightboxIndex}
                    />
                )}

                {documents.map((file, index) => (
                    <div
                        key={`${file}-${index}`}
                        className={`overflow-auto border border-zinc-400 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${
                            compact
                                ? 'max-h-[480px] rounded-xl'
                                : 'max-h-[720px] rounded-2xl'
                        } mx-auto mt-4 max-w-[95%] sm:mt-6 sm:max-w-[760px]`}
                    >
                        <DocumentAttachmentPreview
                            src={toAssetUrl(file)}
                            filename={file}
                        />
                    </div>
                ))}
            </div>

            {lightboxIndex !== null && (
                <Lightbox
                    images={images}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </>
    );
}

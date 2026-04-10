import { renderAsync } from 'docx-preview';
import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PostAttachmentsProps = {
    files?: string[] | null;
    compact?: boolean;
};

function isDocumentFile(file: string) {
    const normalizedFile = file.toLowerCase();

    return normalizedFile.endsWith('.pdf') || normalizedFile.endsWith('.docx');
}

function PdfViewer({ src }: { src: string }) {
    const [numPages, setNumPages] = useState(0);

    return (
        <Document
            file={src}
            loading={
                <div className="p-4 text-sm text-zinc-500">Loading PDF...</div>
            }
            error={
                <div className="p-4 text-sm text-red-600">
                    Failed to load PDF file.
                </div>
            }
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

        if (ref.current) {
            ref.current.innerHTML = '';
        }

        const loadDocument = async () => {
            try {
                const response = await fetch(src);

                if (!response.ok) {
                    throw new Error('Failed to fetch DOCX file.');
                }

                const blob = await response.blob();

                if (!cancelled && ref.current) {
                    await renderAsync(blob, ref.current);
                }
            } catch {
                if (!cancelled) {
                    setHasError(true);
                }
            }
        };

        setHasError(false);
        void loadDocument();

        return () => {
            cancelled = true;

            if (ref.current) {
                ref.current.innerHTML = '';
            }
        };
    }, [src]);

    if (hasError) {
        return (
            <div className="p-4 text-sm text-red-600">
                Failed to load DOCX file.
            </div>
        );
    }

    return <div ref={ref} className="p-4" />;
}

export function PostAttachments({
    files = [],
    compact = false,
}: PostAttachmentsProps) {
    const attachmentFiles = files ?? [];

    if (attachmentFiles.length === 0) {
        return null;
    }

    const images = attachmentFiles.filter((file) => !isDocumentFile(file));
    const documents = attachmentFiles.filter((file) => isDocumentFile(file));

    return (
        <>
            {images.length === 1 && (
                <div className={compact ? 'mx-auto w-full max-w-sm' : 'w-full'}>
                    <img
                        src={`/storage/${images[0]}`}
                        alt="Post attachment"
                        className={
                            compact
                                ? 'mx-auto w-full max-w-sm rounded-xl object-cover'
                                : 'w-full rounded-2xl object-cover'
                        }
                    />
                </div>
            )}

            {images.length > 1 && (
                <div
                    className={
                        compact
                            ? 'mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2'
                            : 'mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2'
                    }
                >
                    {images.map((src, index) => (
                        <img
                            key={`${src}-${index}`}
                            src={`/storage/${src}`}
                            alt={`Post attachment ${index + 1}`}
                            className={
                                compact
                                    ? 'h-48 w-full rounded-xl object-cover'
                                    : 'h-64 w-full rounded-2xl object-cover'
                            }
                        />
                    ))}
                </div>
            )}

            {documents.map((file, index) => (
                <div
                    key={`${file}-${index}`}
                    className={
                        compact
                            ? 'mb-3 max-h-100 overflow-auto rounded-xl border border-zinc-200'
                            : 'mb-4 max-h-160 overflow-auto rounded-2xl border border-zinc-200'
                    }
                >
                    {file.toLowerCase().endsWith('.pdf') ? (
                        <PdfViewer src={`/storage/${file}`} />
                    ) : (
                        <DocxViewer src={`/storage/${file}`} />
                    )}
                </div>
            ))}
        </>
    );
}

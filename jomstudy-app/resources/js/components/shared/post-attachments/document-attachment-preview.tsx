import { reactLang } from '@erag/lang-sync-inertia';
import { renderAsync } from 'docx-preview';
import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function DocumentAttachmentPreview({
    src,
    filename,
}: {
    src: string;
    filename: string;
}) {
    const { trans } = reactLang();

    if (filename.toLowerCase().endsWith('.pdf')) {
        return <PdfPreview src={src} />;
    }

    if (filename.toLowerCase().endsWith('.docx')) {
        return <DocxPreview src={src} />;
    }

    const extension = (
        filename.toLowerCase().split('.').pop() ?? ''
    ).toUpperCase();

    return (
        <div className="flex flex-col gap-3 p-4">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {filename}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {trans('errors.file_preview_unavailable').replace(
                    ':extension',
                    extension,
                )}
            </div>
            <div className="flex gap-2">
                <a
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                    {trans('navigation.open')}
                </a>
                <a
                    href={src}
                    download
                    className="inline-flex items-center rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                    {trans('navigation.download')}
                </a>
            </div>
        </div>
    );
}

function PdfPreview({ src }: { src: string }) {
    const { trans } = reactLang();
    const [numPages, setNumPages] = useState(0);

    return (
        <Document
            file={src}
            loading={
                <div className="p-4 text-sm text-zinc-400">
                    {trans('navigation.loading')}
                </div>
            }
            error={
                <div className="p-4 text-sm text-red-400">
                    {trans('errors.pdf_load_failed')}
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

function DocxPreview({ src }: { src: string }) {
    const { trans } = reactLang();
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

    return hasError ? (
        <div className="p-4 text-sm text-red-400">
            {trans('errors.docx_load_failed')}
        </div>
    ) : (
        <div ref={ref} className="p-4" />
    );
}

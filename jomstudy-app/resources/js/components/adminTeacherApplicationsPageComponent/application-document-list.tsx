import { reactLang } from '@erag/lang-sync-inertia';
import { Eye, FileText } from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type VerificationDocument = {
    id: number;
    original_name: string;
    download_url: string;
};

type PreviewDocument = {
    url: string;
    name: string;
};

type ApplicationDocumentListProps = {
    documents: VerificationDocument[];
    legacyUrl: string | null;
    legacyName: string | null;
    viewLabel: string;
};

function getDocumentType(name: string): 'pdf' | 'image' | 'other' {
    const extension = name.split('.').pop()?.toLowerCase() ?? '';

    if (extension === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png'].includes(extension)) return 'image';

    return 'other';
}

function DocumentPreviewDialog({
    document,
    onClose,
}: {
    document: PreviewDocument | null;
    onClose: () => void;
}) {
    const { trans } = reactLang();
    const type = document ? getDocumentType(document.name) : null;

    return (
        <Dialog
            open={document !== null}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="flex h-[92vh] w-[92vw] max-w-6xl flex-col gap-0 p-0">
                <DialogHeader className="shrink-0 border-b px-5 py-3">
                    <DialogTitle className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {document?.name}
                    </DialogTitle>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-auto">
                    {type === 'pdf' && document ? (
                        <iframe
                            src={document.url}
                            className="h-full w-full border-0"
                            title={document.name}
                        />
                    ) : null}
                    {type === 'image' && document ? (
                        <div className="flex h-full items-center justify-center p-4">
                            <img
                                src={document.url}
                                alt={document.name}
                                className="max-h-full max-w-full rounded object-contain"
                            />
                        </div>
                    ) : null}
                    {type === 'other' && document ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                            <FileText className="h-10 w-10" />
                            <p className="text-sm">
                                {trans('errors.file_type_preview_unavailable')}
                            </p>
                            <a
                                href={document.url}
                                download={document.name}
                                className="text-sm font-medium text-[#e36a8b] hover:underline"
                            >
                                {trans('navigation.download')}
                            </a>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function ApplicationDocumentList({
    documents,
    legacyUrl,
    legacyName,
    viewLabel,
}: ApplicationDocumentListProps) {
    const [previewDocument, setPreviewDocument] =
        useState<PreviewDocument | null>(null);
    const legacyDocument = legacyUrl
        ? { url: legacyUrl, name: legacyName ?? viewLabel }
        : null;

    if (documents.length === 0 && !legacyDocument) {
        return <span className="text-sm text-muted-foreground">—</span>;
    }

    return (
        <>
            <div className="flex flex-col gap-1.5">
                {documents.length > 0
                    ? documents.map((document) => (
                          <button
                              key={document.id}
                              type="button"
                              onClick={() =>
                                  setPreviewDocument({
                                      url: document.download_url,
                                      name: document.original_name,
                                  })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#f090aa]/40 bg-[#fff5f8] px-3 py-1.5 text-sm font-medium text-[#e36a8b] transition-colors hover:bg-[#ffe8f0]"
                          >
                              <Eye className="h-3.5 w-3.5 shrink-0" />
                              <span className="max-w-45 truncate">
                                  {document.original_name}
                              </span>
                          </button>
                      ))
                    : legacyDocument && (
                          <button
                              type="button"
                              onClick={() => setPreviewDocument(legacyDocument)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#f090aa]/40 bg-[#fff5f8] px-3 py-1.5 text-sm font-medium text-[#e36a8b] transition-colors hover:bg-[#ffe8f0]"
                          >
                              <Eye className="h-3.5 w-3.5 shrink-0" />
                              <span className="max-w-45 truncate">
                                  {legacyDocument.name}
                              </span>
                          </button>
                      )}
            </div>
            <DocumentPreviewDialog
                document={previewDocument}
                onClose={() => setPreviewDocument(null)}
            />
        </>
    );
}

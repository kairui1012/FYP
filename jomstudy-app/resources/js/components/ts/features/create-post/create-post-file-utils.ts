import type { LocalAttachment } from './create-post-config';

const DOCUMENT_EXTENSIONS = new Set([
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
]);
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

function getExtension(file: File) {
    return file.name.toLowerCase().split('.').pop() ?? '';
}

export function isSupportedDocument(file: File) {
    return DOCUMENT_EXTENSIONS.has(getExtension(file));
}

export function isSupportedImage(file: File) {
    return IMAGE_EXTENSIONS.has(getExtension(file));
}

export function getAttachmentKind(file: File): LocalAttachment['type'] {
    return isSupportedImage(file) ? 'image' : 'document';
}

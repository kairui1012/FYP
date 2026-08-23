export function isDocumentFile(file: string) {
    const normalizedFile = file.toLowerCase();

    return ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].some(
        (extension) => normalizedFile.endsWith(extension),
    );
}

export function toAttachmentUrl(path: string): string {
    return path.startsWith('http://') || path.startsWith('https://')
        ? path
        : `/storage/${path}`;
}

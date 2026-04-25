/**
 * Converts a public video page URL into a safe embed URL.
 * Returns null if the URL is not a recognised embeddable source.
 *
 * Supported:
 *   YouTube  – watch?v=, youtu.be/, shorts/, embed/
 *   Vimeo    – vimeo.com/<id>
 */
export function getEmbedUrl(url: string): string | null {
    if (!url) return null;

    const trimmed = url.trim();

    // YouTube
    const ytMatch = trimmed.match(
        /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    if (ytMatch?.[1]) {
        return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch?.[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
}

/** True when the URL looks like a video link we can embed. */
export function isEmbeddableVideo(url: string): boolean {
    return getEmbedUrl(url) !== null;
}

import { Video, X } from 'lucide-react';
import { getEmbedUrl } from '@/lib/video-utils';

type VideoLinkSectionProps = {
    videoUrl: string;
    onChangeVideoUrl: (url: string) => void;
    pillIconButton: string;
};

export function VideoLinkSection({
    videoUrl,
    onChangeVideoUrl,
    pillIconButton,
}: VideoLinkSectionProps) {
    const embedUrl = videoUrl.trim() ? getEmbedUrl(videoUrl.trim()) : null;
    const hasInput = videoUrl.trim().length > 0;
    const isInvalid = hasInput && embedUrl === null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700">
                    Video Link
                    <span className="ml-1.5 text-xs font-normal text-zinc-400">
                        (optional)
                    </span>
                </label>
                {hasInput && (
                    <button
                        type="button"
                        onClick={() => onChangeVideoUrl('')}
                        className={pillIconButton}
                        aria-label="Clear video URL"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* URL input — same bg/padding/radius as the title field */}
            <div
                className={`flex items-center gap-3 rounded-xl px-5 py-3.5 transition ${
                    isInvalid
                        ? 'bg-rose-50 ring-1 ring-rose-300'
                        : 'bg-zinc-100 focus-within:bg-zinc-200/80'
                }`}
            >
                <Video className="h-4 w-4 shrink-0 text-zinc-500" />
                <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => onChangeVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or Vimeo link"
                    className="min-w-0 flex-1 bg-transparent text-base text-zinc-800 outline-none placeholder:text-zinc-500"
                />
            </div>

            {/* Hint when empty */}
            {!hasInput && (
                <p className="text-xs text-zinc-500">
                    Paste a YouTube or Vimeo URL. No file upload needed — video plays inline in the post.
                </p>
            )}

            {/* Error when URL is unrecognised */}
            {isInvalid && (
                <p className="text-xs text-rose-600">
                    Unsupported URL. Paste a YouTube (youtube.com or youtu.be) or Vimeo link.
                </p>
            )}

            {/* Live preview once a valid embed URL is resolved */}
            {embedUrl && (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-black aspect-video">
                    <iframe
                        src={embedUrl}
                        title="Video preview"
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            )}
        </div>
    );
}

import { getEmbedUrl } from '@/lib/video-utils';

type PostVideoEmbedProps = {
    videoUrl?: string | null;
};

export function PostVideoEmbed({ videoUrl }: PostVideoEmbedProps) {
    const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;

    if (!embedUrl) {
        return null;
    }

    return (
        <div className="mx-4 mb-7 aspect-video overflow-hidden rounded-xl border border-zinc-200 bg-black">
            <iframe
                src={embedUrl}
                title="Video"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
}

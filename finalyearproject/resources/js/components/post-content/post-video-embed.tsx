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
        <div className="mx-0 mb-5 aspect-video overflow-hidden border border-zinc-200 bg-black sm:mx-4 sm:mb-7 sm:rounded-xl">
            <iframe
                src={embedUrl}
                title="Video"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
        </div>
    );
}

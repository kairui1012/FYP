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
        <div className="w-full max-w-[95%] sm:max-w-[760px] mx-auto mt-4 mb-5 sm:mt-6 sm:mb-7 aspect-video overflow-hidden border border-zinc-200 bg-black sm:rounded-xl">
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

type CreatePostHeaderSectionProps = {
    heading: string;
    subtitle: string;
};

export function CreatePostHeaderSection({
    heading,
    subtitle,
}: CreatePostHeaderSectionProps) {
    return (
        <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                {heading}
            </h1>
            <p className="text-base text-zinc-600">{subtitle}</p>
        </div>
    );
}

import { reactLang } from '@erag/lang-sync-inertia';
import { FileText } from 'lucide-react';
import type { MaterialContentBlock } from '@/types';

type StudyMaterialBlocksProps = {
    blocks?: MaterialContentBlock[] | null;
    fallbackContent: string;
};

function assetUrl(path: string) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    return `/storage/${path}`;
}

export function StudyMaterialBlocks({
    blocks,
    fallbackContent,
}: StudyMaterialBlocksProps) {
    const { trans } = reactLang();

    if (!blocks || blocks.length === 0) {
        return (
            <div className="text-base leading-8 whitespace-pre-wrap text-zinc-800">
                {fallbackContent}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {blocks.map((block, index) => {
                if (block.type === 'text') {
                    return (
                        <section key={index} className="bg-white">
                            <p className="text-base leading-8 whitespace-pre-wrap text-zinc-800">
                                {block.text}
                            </p>
                        </section>
                    );
                }

                if (block.type === 'image') {
                    return (
                        <figure
                            key={index}
                            className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
                        >
                            <img
                                src={assetUrl(block.path)}
                                alt={block.name ?? ''}
                                className="w-full object-contain"
                            />
                            {block.name ? (
                                <figcaption className="border-t border-zinc-100 px-4 py-2 text-sm text-zinc-500">
                                    {block.name}
                                </figcaption>
                            ) : null}
                        </figure>
                    );
                }

                if (block.type === 'document') {
                    return (
                        <a
                            key={index}
                            href={assetUrl(block.path)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-zinc-800 transition hover:border-violet-300 hover:bg-violet-50"
                        >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                                <FileText className="h-5 w-5" />
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate font-semibold">
                                    {block.name ??
                                        trans(
                                            'createPost.material_document_fallback',
                                        )}
                                </span>
                                <span className="text-sm text-zinc-500">
                                    {block.mime ??
                                        trans(
                                            'createPost.material_download_resource',
                                        )}
                                </span>
                            </span>
                        </a>
                    );
                }

                return null;
            })}
        </div>
    );
}

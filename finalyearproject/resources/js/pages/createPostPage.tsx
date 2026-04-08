import { Head } from '@inertiajs/react';
import { ImagePlus, Send, Trash2 } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { homePage } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Create Post',
        href: homePage(),
    },
];

const MAX_CONTENT_LENGTH = 2000;

type LocalImage = {
    file: File;
    preview: string;
};

export default function CreatePostPage() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const imagesRef = useRef<LocalImage[]>([]);
    const [content, setContent] = useState('');
    const [images, setImages] = useState<LocalImage[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        imagesRef.current = images;
    }, [images]);

    useEffect(() => {
        return () => {
            imagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
        };
    }, []);

    const remainingCharacters = useMemo(() => {
        return MAX_CONTENT_LENGTH - content.length;
    }, [content.length]);

    const canSubmit = content.trim().length > 0 && !isSubmitting;

    const onSelectImages = (event: ChangeEvent<HTMLInputElement>) => {
        const pickedFiles = event.target.files;

        if (!pickedFiles || pickedFiles.length === 0) {
            return;
        }

        const nextImages = Array.from(pickedFiles).map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setImages((prev) => [...prev, ...nextImages]);
        event.target.value = '';
    };

    const removeImage = (indexToRemove: number) => {
        setImages((prev) => {
            const target = prev[indexToRemove];
            if (target) {
                URL.revokeObjectURL(target.preview);
            }

            return prev.filter((_, index) => index !== indexToRemove);
        });
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit) {
            return;
        }

        setIsSubmitting(true);
        try {
            // TODO: Connect this to backend post-store route.
            await new Promise((resolve) => setTimeout(resolve, 700));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Head title="Create Post" />

            <div className="min-h-full  bg-rose-50">
                <div className=" mx-auto flex min-h-full w-full max-w-5xl items-start justify-center p-4 md:items-center md:p-8">
                    <form
                        onSubmit={onSubmit}
                        className="relative flex w-full flex-col gap-6 p-2 text-[clamp(0.92rem,0.22vw+0.86rem,1.05rem)] md:p-4"
                    >
                    <div className="space-y-1">
                        <h1 className="text-[clamp(1.4rem,1vw+1.1rem,2rem)] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Create New Post
                        </h1>
                        <p className="text-[clamp(0.9rem,0.25vw+0.82rem,1rem)] text-zinc-600 dark:text-zinc-400">
                            Share your thought, add photos, then publish when ready.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="content"
                            className="text-[clamp(0.9rem,0.2vw+0.84rem,1rem)] font-medium text-zinc-700 dark:text-zinc-300"
                        >
                            Caption
                        </label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            maxLength={MAX_CONTENT_LENGTH}
                            placeholder="What do you want to share today?"
                            className="min-h-45 w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-[clamp(0.92rem,0.2vw+0.85rem,1rem)] leading-6 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-rose-500 dark:focus:ring-rose-800/50"
                        />
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500 dark:text-zinc-400">
                                Keep it clear and friendly.
                            </span>
                            <span
                                className={remainingCharacters < 80 ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-zinc-500 dark:text-zinc-400'}
                            >
                                {remainingCharacters} chars left
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Photos
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImagePlus className="mr-2 h-4 w-4" />
                                Add images
                            </Button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={onSelectImages}
                        />

                        {images.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                                No images selected yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                {images.map((image, index) => (
                                    <div
                                        key={`${image.file.name}-${index}`}
                                        className="group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
                                    >
                                        <img
                                            src={image.preview}
                                            alt={image.file.name}
                                            className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute right-2 top-2 rounded-full bg-black/65 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                                            aria-label={`Remove ${image.file.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Tip: You can choose multiple photos in one upload.
                        </p>

                        <Button
                            type="submit"
                            disabled={!canSubmit}
                            className="rounded-full bg-rose-600 px-6 text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                        >
                            <Send className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Publishing...' : 'Publish Post'}
                        </Button>
                    </div>
                    </form>
                </div>
            </div>
        </>
    );
}

CreatePostPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
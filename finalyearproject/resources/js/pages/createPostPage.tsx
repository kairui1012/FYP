import { Head, router } from '@inertiajs/react';
import { FileText, ImagePlus, Send, Trash2, UploadCloud } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { reactLang } from '@erag/lang-sync-inertia';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { homePage } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const MAX_TITLE_LENGTH = 150;
const MAX_CONTENT_LENGTH = 2000;
const ACCEPTED_FILE_TYPES = 'image/*,.pdf,application/pdf';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total upload
type LocalAttachment = {
    file: File;
    preview: string | null;
    type: 'image' | 'pdf';
};

const LANGUAGE_OPTIONS = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'bm', label: 'Bahasa Malaysia' },
] as const;

const POST_TYPE_OPTIONS = [
    { value: 'material', labelKey: 'shareMaterial' },
    { value: 'question', labelKey: 'askQuestion' },
] as const;

export default function CreatePostPage() {
    const { trans } = reactLang();
    const t = {
        pageTitle: trans('createPost.page_title'),
        heading: trans('createPost.heading'),
        subtitle: trans('createPost.subtitle'),
        titleLabel: trans('createPost.title_label'),
        titlePlaceholder: trans('createPost.title_placeholder'),
        contentLabel: trans('createPost.content_label'),
        contentPlaceholder: trans('createPost.content_placeholder'),
        helperText: trans('createPost.helper_text'),
        postTypeLabel: trans('createPost.post_type_label'),
        postTypeRequired: trans('createPost.post_type_required'),
        shareMaterial: trans('createPost.share_material'),
        askQuestion: trans('createPost.ask_question'),
        languageLabel: trans('createPost.language_label'),
        languageRequired: trans('createPost.language_required'),
        charsLeft: trans('createPost.chars_left'),
        mediaLabel: trans('createPost.media_label'),
        addFiles: trans('createPost.add_files'),
        dragDropTitle: trans('createPost.drag_drop_title'),
        dragDropSubtitle: trans('createPost.drag_drop_subtitle'),
        pdfLabel: trans('createPost.pdf_label'),
        supportedFormat: trans('createPost.supported_format'),
        publishing: trans('createPost.publishing'),
        publishPost: trans('createPost.publish_post'),
    };
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const attachmentsRef = useRef<LocalAttachment[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedPostType, setSelectedPostType] = useState<string>('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);

    useEffect(() => {
        attachmentsRef.current = attachments;
    }, [attachments]);

    useEffect(() => {
        return () => {
            attachmentsRef.current.forEach((attachment) => {
                if (attachment.preview) {
                    URL.revokeObjectURL(attachment.preview);
                }
            });
        };
    }, []);

    const remainingTitleChars = useMemo(() => {
        return MAX_TITLE_LENGTH - title.length;
    }, [title.length]);

    const remainingContentChars = useMemo(() => {
        return MAX_CONTENT_LENGTH - content.length;
    }, [content.length]);

    const canSubmit =
        title.trim().length > 0 &&
        content.trim().length > 0 &&
        selectedPostType.trim().length > 0 &&
        selectedLanguage.trim().length > 0 &&
        !isSubmitting;

    const appendFiles = (incomingFiles: FileList | File[]) => {
        setFileError(null);
        
        const validFiles = Array.from(incomingFiles).filter((file) => {
            if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) {
                return false;
            }
            if (file.size > MAX_FILE_SIZE) {
                setFileError(`File "${file.name}" exceeds 20MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) {
            if (!fileError) {
                setFileError('No valid files selected. Please select images or PDFs under 20MB.');
            }
            return;
        }

        setAttachments((prev) => {
            const existingKeys = new Set(
                prev.map((item) => `${item.file.name}-${item.file.size}-${item.file.lastModified}`)
            );
            const nextAttachments: LocalAttachment[] = [];
            let totalSize = prev.reduce((sum, item) => sum + item.file.size, 0);

            validFiles.forEach((file) => {
                if (totalSize + file.size > MAX_TOTAL_SIZE) {
                    setFileError(`Total upload size would exceed 50MB limit`);
                    return;
                }
                
                const key = `${file.name}-${file.size}-${file.lastModified}`;
                if (existingKeys.has(key)) {
                    return;
                }

                const isImage = file.type.startsWith('image/');
                nextAttachments.push({
                    file,
                    preview: isImage ? URL.createObjectURL(file) : null,
                    type: isImage ? 'image' : 'pdf',
                });
                totalSize += file.size;
            });

            return [...prev, ...nextAttachments];
        });
    };

    const onSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            appendFiles(event.target.files);
        }
        event.target.value = '';
    };

    const onDropFiles = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (event.dataTransfer.files.length > 0) {
            appendFiles(event.dataTransfer.files);
        }
    };

    const removeAttachment = (indexToRemove: number) => {
        setAttachments((prev) => {
            const target = prev[indexToRemove];
            if (target?.preview) {
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

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('content', content.trim());
        formData.append('post_type', selectedPostType);
        formData.append('language_code', selectedLanguage);

        attachments.forEach((attachment) => {
            formData.append('attachments[]', attachment.file);
        });

        router.post('/posts', formData, {
            forceFormData: true,
            onSuccess: () => {
                attachmentsRef.current.forEach((attachment) => {
                    if (attachment.preview) {
                        URL.revokeObjectURL(attachment.preview);
                    }
                });
                setTitle('');
                setContent('');
                setSelectedPostType('');
                setSelectedLanguage('');
                setAttachments([]);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <>
            <Head title={t.pageTitle} />

            <div className="min-h-[calc(100dvh-4rem)] bg-transparent pb-6">
                <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-4xl items-start justify-center p-4 pb-8 md:p-8 md:pb-10">
                    <form
                        onSubmit={onSubmit}
                        className="flex w-full flex-col gap-7 p-2 pb-6 md:gap-8 md:p-4 md:pb-8"
                    >
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{t.heading}</h1>
                            <p className="text-base text-zinc-600">
                                {t.subtitle}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="title" className="text-base font-medium text-zinc-700">
                                {t.titleLabel}
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                maxLength={MAX_TITLE_LENGTH}
                                placeholder={t.titlePlaceholder}
                                className="w-full rounded-xl border-0 bg-zinc-100 px-5 py-3.5 text-base text-zinc-800 outline-none transition placeholder:text-zinc-500 focus:bg-zinc-200/80 focus:ring-0"
                            />
                            <div className="text-right text-sm text-zinc-500">
                                {remainingTitleChars} {t.charsLeft}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="content" className="text-base font-medium text-zinc-700">
                                {t.contentLabel}
                            </label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={(event) => setContent(event.target.value)}
                                maxLength={MAX_CONTENT_LENGTH}
                                placeholder={t.contentPlaceholder}
                                className="min-h-44 w-full resize-y rounded-xl border-0 bg-zinc-100 px-5 py-4 text-base leading-7 text-zinc-800 outline-none transition placeholder:text-zinc-500 focus:bg-zinc-200/80 focus:ring-0"
                            />
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">{t.helperText}</span>
                                <span className={remainingContentChars < 80 ? 'font-medium text-rose-600' : 'text-zinc-500'}>
                                    {remainingContentChars} {t.charsLeft}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-base font-medium text-zinc-700">{t.postTypeLabel}</p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {POST_TYPE_OPTIONS.map((postType) => {
                                    const isSelected = selectedPostType === postType.value;

                                    return (
                                        <button
                                            key={postType.value}
                                            type="button"
                                            onClick={() => setSelectedPostType(postType.value)}
                                            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                                                isSelected
                                                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                                                    : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400'
                                            }`}
                                            aria-pressed={isSelected}
                                        >
                                            {t[postType.labelKey]}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-sm text-zinc-500">{t.postTypeRequired}</p>
                            <input type="hidden" name="post_type" value={selectedPostType} required />
                        </div>

                        <div className="space-y-3">
                            <p className="text-base font-medium text-zinc-700">{t.languageLabel}</p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {LANGUAGE_OPTIONS.map((language) => {
                                    const isSelected = selectedLanguage === language.code;

                                    return (
                                        <button
                                            key={language.code}
                                            type="button"
                                            onClick={() => setSelectedLanguage(language.code)}
                                            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                                                isSelected
                                                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                                                    : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400'
                                            }`}
                                            aria-pressed={isSelected}
                                        >
                                            {language.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-sm text-zinc-500">{t.languageRequired}</p>
                            <input type="hidden" name="language_code" value={selectedLanguage} required />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-zinc-700">{t.mediaLabel}</p>
                                <Button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="rounded-full bg-linear-to-r from-[#ef99b0] to-pink-500 px-4 text-white shadow-sm transition hover:from-rose-600 hover:to-pink-600"
                                >
                                    <ImagePlus className="mr-2 h-4 w-4" />
                                    {t.addFiles}
                                </Button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ACCEPTED_FILE_TYPES}
                                multiple
                                className="hidden"
                                onChange={onSelectFiles}
                            />

                            {fileError && (
                                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                                    {fileError}
                                </div>
                            )}

                            <div
                                onDrop={onDropFiles}
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                className={`rounded-2xl p-7 text-center transition ${
                                    isDragging
                                        ? 'bg-linear-to-b from-[#fff6fa] to-[#ffeef5] shadow-[inset_0_0_0_1px_rgba(239,153,176,0.35),0_10px_28px_-18px_rgba(239,153,176,0.85)]'
                                        : 'bg-linear-to-b from-zinc-50 to-zinc-100/80 shadow-[inset_0_0_0_1px_rgba(228,228,231,0.85)] hover:from-zinc-100 hover:to-zinc-100'
                                }`}
                            >
                                <div
                                    className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full transition ${
                                        isDragging
                                            ? 'bg-[#ef99b0]/20 text-[#d85f87]'
                                            : 'bg-white text-zinc-500 shadow-sm'
                                    }`}
                                >
                                    <UploadCloud className="h-5 w-5" />
                                </div>
                                <p className="text-base font-semibold text-zinc-800">{t.dragDropTitle}</p>
                                <p className="mt-1 text-sm text-zinc-500">
                                    {t.dragDropSubtitle}
                                </p>
                            </div>

                            {attachments.length > 0 && (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                                    {attachments.map((attachment, index) => (
                                        <div
                                            key={`${attachment.file.name}-${index}`}
                                            className="group relative overflow-hidden border border-zinc-200 bg-transparent"
                                        >
                                            {attachment.type === 'image' && attachment.preview ? (
                                                <img
                                                    src={attachment.preview}
                                                    alt={attachment.file.name}
                                                    className="h-36 w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-28 flex-col items-center justify-center bg-zinc-100/70 text-zinc-600">
                                                    <FileText className="h-8 w-8" />
                                                    <span className="mt-2 px-2 text-center text-xs font-medium">
                                                        {t.pdfLabel}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="p-2">
                                                <p className="truncate text-xs text-zinc-600">
                                                    {attachment.file.name}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="absolute right-2 top-2 rounded-full bg-black/65 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                                                aria-label={`Remove ${attachment.file.name}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-zinc-500">
                                {t.supportedFormat}
                            </p>
                            <Button
                                type="submit"
                                disabled={!canSubmit}
                                className="rounded-full bg-rose-600 px-6 text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                            >
                                <Send className="mr-2 h-4 w-4" />
                                {isSubmitting ? t.publishing : t.publishPost}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

function CreatePostLayout({ children }: { children: ReactNode }) {
    const { trans } = reactLang();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: trans('createPost.page_title'),
            href: homePage(),
        },
    ];
    return <AppLayout breadcrumbs={breadcrumbs}>{children}</AppLayout>;
}

CreatePostPage.layout = (page: ReactNode) => <CreatePostLayout>{page}</CreatePostLayout>;

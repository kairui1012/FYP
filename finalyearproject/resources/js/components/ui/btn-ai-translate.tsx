// BtnAiTranslate.tsx
import { useState } from 'react';
import { reactLang } from '@erag/lang-sync-inertia';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
    title: string;
    content: string;
    texts?: string[];
    className?: string;
    onTranslate?: (result: { title: string; content: string }) => void;
    onTranslateTexts?: (translations: Record<string, string>) => void;
};
const MAX_TEXTS_PER_REQUEST = 180;

function getCurrentLocale(): 'en' | 'zh' | 'my' {
    const htmlLang = document.documentElement.lang.toLowerCase();

    if (htmlLang.startsWith('zh')) return 'zh';
    if (htmlLang.startsWith('my') || htmlLang.startsWith('ms')) return 'my';
    return 'en';
}

function chunkArray<T>(items: T[], size: number): T[][] {
    if (size <= 0) return [items];
    const chunks: T[][] = [];

    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }

    return chunks;
}

function uniqueNonEmptyTexts(texts: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    texts.forEach((text) => {
        const normalized = text.trim();
        if (normalized === '' || seen.has(normalized)) {
            return;
        }
        seen.add(normalized);
        result.push(normalized);
    });

    return result;
}

function collectTextNodes(root: HTMLElement): Text[] {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript', 'textarea'].includes(tag))
                return NodeFilter.FILTER_REJECT;
            if ((node.textContent ?? '').trim() === '') return NodeFilter.FILTER_SKIP;
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    const nodes: Text[] = [];
    let current: Node | null;
    while ((current = walker.nextNode())) nodes.push(current as Text);
    return nodes;
}

async function translateWithProvider(
    texts: string[],
    provider: 'deepseek' | 'gemini',
): Promise<Record<string, string>> {
    const res = await fetch('/translate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        },
        body: JSON.stringify({ texts, provider }),
    });
    if (!res.ok) {
        let errorMessage = `${provider} failed: ${res.status}`;

        try {
            const errorData = await res.json();
            if (typeof errorData?.error === 'string' && errorData.error.trim() !== '') {
                errorMessage = `${provider} failed: ${errorData.error}`;
            }
        } catch {
            // Keep the default status-based message when response is not JSON.
        }

        throw new Error(errorMessage);
    }

    const { translations } = await res.json();

    if (!translations || typeof translations !== 'object') {
        throw new Error(`${provider} failed: invalid translation payload`);
    }

    return translations;
}

async function translateInBatches(
    texts: string[],
    provider: 'deepseek' | 'gemini',
): Promise<Record<string, string>> {
    const chunks = chunkArray(texts, MAX_TEXTS_PER_REQUEST);
    const mergedTranslations: Record<string, string> = {};

    for (const chunk of chunks) {
        const chunkTranslations = await translateWithProvider(chunk, provider);
        Object.assign(mergedTranslations, chunkTranslations);
    }

    return mergedTranslations;
}

export function BtnAiTranslate({
    title,
    content,
    texts,
    className,
    onTranslate,
    onTranslateTexts,
}: Props) {
    const { trans } = reactLang();
    const [loading, setLoading] = useState(false);
    const [translated, setTranslated] = useState(false);
    const [usedProvider, setUsedProvider] = useState<'deepseek' | 'gemini' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const locale = getCurrentLocale();
    const localeBadge = trans(`aiTranslate.badge_${locale}`);
    const ariaLabel = trans(`aiTranslate.aria_${locale}`);

    const handleTranslate = async () => {
        if (loading || translated) return;
        setError(null);
        setLoading(true);
        try {
            const textsToTranslate = uniqueNonEmptyTexts([
                title,
                content,
                ...(Array.isArray(texts) ? texts : []),
            ]);
            let translations: Record<string, string>;
            let provider: 'deepseek' | 'gemini';
            try {
                translations = await translateInBatches(
                    textsToTranslate,
                    'deepseek',
                );
                provider = 'deepseek';
            } catch (deepseekErr) {
                console.warn('[BtnAiTranslate] DeepSeek failed, falling back to Gemini:', deepseekErr);
                translations = await translateInBatches(
                    textsToTranslate,
                    'gemini',
                );
                provider = 'gemini';
            }
            setUsedProvider(provider);
            setTranslated(true);
            onTranslateTexts?.(translations);
            if (onTranslate) {
                onTranslate({
                    title: translations[title] ?? title,
                    content: translations[content] ?? content,
                });
            }
        } catch (err) {
            console.error('[BtnAiTranslate] Both providers failed:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : trans('aiTranslate.failed_generic'),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            disabled={loading || translated}
            onClick={handleTranslate}
            className={cn(
                'hidden h-9 cursor-pointer items-center gap-2 rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] text-white transition-all duration-200',
                'hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'md:inline-flex',
                className,
            )}
            aria-label={ariaLabel}
        >
            {loading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
                <Sparkles className="h-4.5 w-4.5" />
            )}
            <span className="text-sm font-medium">
                {loading ? trans('aiTranslate.loading')
                : translated ? `${localeBadge} · ${usedProvider === 'gemini' ? 'Gemini' : 'DeepSeek'}`
                : error ? trans('aiTranslate.retry')
                : trans('aiTranslate.button')}
            </span>
        </Button>
    );
}

export interface BestAnswerExplanation {
    explanation: string;
    key_points: string[];
    summary: string;
    provider: 'deepseek' | 'gemini';
}

export interface BestAnswerExplainParams {
    postTitle: string;
    postContent?: string;
    answerContent: string;
}

async function explainWithProvider(
    params: BestAnswerExplainParams,
    provider: 'deepseek' | 'gemini',
): Promise<BestAnswerExplanation> {
    const res = await fetch('/ai-best-answer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN':
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        },
        body: JSON.stringify({
            post_title: params.postTitle,
            post_content: params.postContent ?? '',
            answer_content: params.answerContent,
            provider,
        }),
    });

    if (!res.ok) {
        let errorMessage = `${provider} failed: ${res.status}`;
        try {
            const errorData = await res.json();
            if (typeof errorData?.error === 'string' && errorData.error.trim() !== '') {
                errorMessage = errorData.error;
            }
        } catch {
            // keep status-based message
        }
        throw new Error(errorMessage);
    }

    const payload = await res.json();

    if (!payload || typeof payload !== 'object' || !('result' in payload)) {
        throw new Error(`${provider} failed: invalid response`);
    }

    const result = (payload as { result: unknown }).result;
    if (!result || typeof result !== 'object') {
        throw new Error(`${provider} failed: invalid result`);
    }

    const data = result as Record<string, unknown>;
    const explanation = typeof data.explanation === 'string' ? data.explanation.trim() : '';
    if (explanation === '') {
        throw new Error(`${provider} failed: empty explanation`);
    }

    const key_points = Array.isArray(data.key_points)
        ? (data.key_points as unknown[]).filter((v): v is string => typeof v === 'string' && v.trim() !== '')
        : [];

    const summary = typeof data.summary === 'string' ? data.summary.trim() : '';

    return { explanation, key_points, summary, provider };
}

export async function explainBestAnswer(params: BestAnswerExplainParams): Promise<BestAnswerExplanation> {
    try {
        return await explainWithProvider(params, 'deepseek');
    } catch (err) {
        console.warn('[aiBestAnswer] DeepSeek failed, falling back to Gemini:', err);
        return await explainWithProvider(params, 'gemini');
    }
}

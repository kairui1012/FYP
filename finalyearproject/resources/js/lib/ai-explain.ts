export interface ExplainParams {
    question: string;
    userAnswer: string;
    correctAnswer: string;
}

async function explainWithProvider(
    params: ExplainParams,
    provider: 'deepseek' | 'gemini',
): Promise<string> {
    const res = await fetch('/ai-explain', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN':
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        },
        body: JSON.stringify({
            question: params.question,
            user_answer: params.userAnswer,
            correct_answer: params.correctAnswer,
            provider,
        }),
    });

    if (!res.ok) {
        let errorMessage = `${provider} failed: ${res.status}`;
        try {
            const errorData = await res.json();
            if (typeof errorData?.error === 'string' && errorData.error.trim() !== '') {
                errorMessage = `${provider} failed: ${errorData.error}`;
            }
        } catch {
            // Keep the status-based message when response is not JSON.
        }
        throw new Error(errorMessage);
    }

    const { explanation } = await res.json();

    if (typeof explanation !== 'string' || explanation.trim() === '') {
        throw new Error(`${provider} failed: invalid explanation payload`);
    }

    return explanation;
}

export async function explainAnswer(params: ExplainParams): Promise<string> {
    try {
        return await explainWithProvider(params, 'deepseek');
    } catch (deepseekErr) {
        console.warn('[aiExplain] DeepSeek failed, falling back to Gemini:', deepseekErr);
        return await explainWithProvider(params, 'gemini');
    }
}

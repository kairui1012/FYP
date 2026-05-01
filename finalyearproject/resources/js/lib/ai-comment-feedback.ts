export interface DoubtClarification {
    explanation: string;
    guidance: string;
    provider: 'deepseek' | 'gemini';
}

export interface WrongValidationResult {
    is_valid: boolean;
    feedback: string;
    provider: 'deepseek' | 'gemini';
}

async function callWithProvider<T>(
    endpoint: string,
    body: Record<string, unknown>,
    provider: 'deepseek' | 'gemini',
): Promise<T & { provider: 'deepseek' | 'gemini' }> {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN':
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        },
        body: JSON.stringify({ ...body, provider }),
    });

    if (!res.ok) {
        let message = `Request failed: ${res.status}`;
        try {
            const err = (await res.json()) as { error?: string };
            if (typeof err?.error === 'string' && err.error.trim() !== '') {
                message = err.error;
            }
        } catch {
            // keep status-based message
        }
        throw new Error(message);
    }

    const payload = (await res.json()) as { result?: T };
    const result = payload.result;
    if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from AI');
    }

    return { ...(result as T), provider };
}

export async function clarifyDoubt(params: {
    postTitle: string;
    postContent?: string;
    answerContent: string;
}): Promise<DoubtClarification> {
    const body = {
        post_title: params.postTitle,
        post_content: params.postContent ?? '',
        answer_content: params.answerContent,
    };

    try {
        return await callWithProvider<DoubtClarification>('/ai-doubt-clarify', body, 'deepseek');
    } catch (err) {
        console.warn('[aiCommentFeedback] DeepSeek failed, falling back to Gemini:', err);
        return await callWithProvider<DoubtClarification>('/ai-doubt-clarify', body, 'gemini');
    }
}

export async function validateWrongAnswer(params: {
    postTitle: string;
    postContent?: string;
    answerContent: string;
    userReasoning: string;
}): Promise<WrongValidationResult> {
    const body = {
        post_title: params.postTitle,
        post_content: params.postContent ?? '',
        answer_content: params.answerContent,
        user_reasoning: params.userReasoning,
    };

    try {
        return await callWithProvider<WrongValidationResult>('/ai-validate-wrong', body, 'deepseek');
    } catch (err) {
        console.warn('[aiCommentFeedback] DeepSeek failed, falling back to Gemini:', err);
        return await callWithProvider<WrongValidationResult>('/ai-validate-wrong', body, 'gemini');
    }
}

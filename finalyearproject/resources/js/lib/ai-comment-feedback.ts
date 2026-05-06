export interface DoubtClarification {
    explanation: string;
    guidance: string;
}

export interface WrongValidationResult {
    is_valid: boolean;
    feedback: string;
}

async function callWithProvider<T>(
    endpoint: string,
    body: Record<string, unknown>,
): Promise<T> {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN':
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        },
        body: JSON.stringify(body),
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

    return result as T;
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

    return await callWithProvider<DoubtClarification>('/ai-doubt-clarify', body);
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

    return await callWithProvider<WrongValidationResult>('/ai-validate-wrong', body);
}

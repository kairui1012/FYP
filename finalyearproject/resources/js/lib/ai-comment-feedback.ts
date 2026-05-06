export interface DoubtClarification {
    explanation: string;
    guidance: string;
}

export interface WrongValidationResult {
    is_wrong: boolean;
    category:
        | 'nonsense'
        | 'irrelevant'
        | 'factual_error'
        | 'logical_error'
        | 'misleading'
        | 'insufficient_answer'
        | 'not_wrong';
    message: string;
    is_valid?: boolean;
    feedback?: string;
}

async function callWithProvider<T>(
    endpoint: string,
    body: Record<string, unknown>,
): Promise<T> {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN':
                document.querySelector<HTMLMetaElement>(
                    'meta[name="csrf-token"]',
                )?.content ?? '',
        },
        body: JSON.stringify(body),
    });

    const contentType = res.headers.get('content-type') ?? '';
    const responseText = await res.text();
    const parseJson = () => {
        if (!contentType.includes('application/json')) {
            return null;
        }

        try {
            return JSON.parse(responseText) as {
                result?: T;
                error?: string;
                message?: string;
            };
        } catch {
            return null;
        }
    };

    const payload = parseJson();

    if (!res.ok) {
        let message = `Request failed: ${res.status}`;
        if (
            typeof payload?.message === 'string' &&
            payload.message.trim() !== ''
        ) {
            message = payload.message;
        } else if (
            typeof payload?.error === 'string' &&
            payload.error.trim() !== ''
        ) {
            message = payload.error;
        } else if (contentType.includes('text/html')) {
            message =
                'The AI validation service returned an unexpected response. Please try again.';
        }

        throw new Error(message);
    }

    const result = payload?.result;
    if (!result || typeof result !== 'object') {
        throw new Error(
            'The AI validation service returned an unexpected response. Please try again.',
        );
    }

    return result as T;
}

export async function clarifyDoubt(params: {
    postTitle: string;
    postContent?: string;
    answerContent: string;
    userConfusion: string;
}): Promise<DoubtClarification> {
    const body = {
        post_title: params.postTitle,
        post_content: params.postContent ?? '',
        answer_content: params.answerContent,
        user_confusion: params.userConfusion,
    };

    return await callWithProvider<DoubtClarification>(
        '/ai-doubt-clarify',
        body,
    );
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

    return await callWithProvider<WrongValidationResult>(
        '/ai-validate-wrong',
        body,
    );
}

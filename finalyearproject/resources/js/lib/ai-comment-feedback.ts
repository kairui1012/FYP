import { postAiJson } from '@/lib/ai-http';

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
    const payload = await postAiJson(
        endpoint,
        body,
        'The AI validation service returned an unexpected response. Please try again.',
    );

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

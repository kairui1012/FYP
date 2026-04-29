export type AnswerFeedbackStatus = 'good' | 'incomplete' | 'wrong';

export interface AnswerFeedback {
    status: AnswerFeedbackStatus;
    feedback: string;
    strengths: string[];
    improvements: string[];
    next_step: string;
    confidence: 'high' | 'medium' | 'low';
    provider: 'deepseek' | 'gemini';
}

export interface AnswerFeedbackParams {
    postTitle: string;
    postContent?: string;
    answerContent: string;
}

function parseFeedbackPayload(payload: unknown): Omit<AnswerFeedback, 'provider'> {
    if (!payload || typeof payload !== 'object') {
        throw new Error('invalid feedback payload');
    }

    const data = payload as Record<string, unknown>;
    const status = data.status;
    const feedback = data.feedback;
    const nextStep = data.next_step;
    const confidence = data.confidence;

    if (status !== 'good' && status !== 'incomplete' && status !== 'wrong') {
        throw new Error('invalid feedback status');
    }

    if (typeof feedback !== 'string' || feedback.trim() === '') {
        throw new Error('invalid feedback content');
    }

    const stringList = (value: unknown) =>
        Array.isArray(value)
            ? value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
            : [];

    return {
        status,
        feedback: feedback.trim(),
        strengths: stringList(data.strengths),
        improvements: stringList(data.improvements),
        next_step: typeof nextStep === 'string' ? nextStep.trim() : '',
        confidence:
            confidence === 'high' || confidence === 'medium' || confidence === 'low'
                ? confidence
                : 'medium',
    };
}

async function requestFeedbackWithProvider(
    params: AnswerFeedbackParams,
    provider: 'deepseek' | 'gemini',
): Promise<AnswerFeedback> {
    const res = await fetch('/ai-answer-feedback', {
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
            // Keep the status-based message.
        }
        throw new Error(errorMessage);
    }

    const payload = await res.json();

    if (!payload || typeof payload !== 'object' || !('feedback' in payload)) {
        throw new Error(`${provider} failed: invalid feedback response`);
    }

    return {
        ...parseFeedbackPayload((payload as { feedback?: unknown }).feedback),
        provider,
    };
}

export async function requestAnswerFeedback(params: AnswerFeedbackParams): Promise<AnswerFeedback> {
    try {
        return await requestFeedbackWithProvider(params, 'deepseek');
    } catch (err) {
        console.warn('[aiAnswerFeedback] DeepSeek failed, falling back to Gemini:', err);
        return await requestFeedbackWithProvider(params, 'gemini');
    }
}

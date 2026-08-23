import { postAiJson } from '@/lib/ai-http';

export interface BestAnswerExplanation {
    explanation: string;
    key_points: string[];
    summary: string;
}

export interface BestAnswerExplainParams {
    postTitle: string;
    postContent?: string;
    answerContent: string;
}

async function explainWithProvider(
    params: BestAnswerExplainParams,
): Promise<BestAnswerExplanation> {
    const payload = await postAiJson(
        '/ai-best-answer',
        {
            post_title: params.postTitle,
            post_content: params.postContent ?? '',
            answer_content: params.answerContent,
            provider: 'deepseek',
        },
        'The AI explanation service returned an unexpected response. Please try again.',
    );

    if (!payload || typeof payload !== 'object' || !('result' in payload)) {
        throw new Error(`Failed: invalid response`);
    }

    const result = (payload as { result: unknown }).result;
    if (!result || typeof result !== 'object') {
        throw new Error(`Failed: invalid result`);
    }

    const data = result as Record<string, unknown>;
    const explanation =
        typeof data.explanation === 'string' ? data.explanation.trim() : '';
    if (explanation === '') {
        throw new Error(`Failed: empty explanation`);
    }

    const key_points = Array.isArray(data.key_points)
        ? (data.key_points as unknown[]).filter(
              (v): v is string => typeof v === 'string' && v.trim() !== '',
          )
        : [];

    const summary = typeof data.summary === 'string' ? data.summary.trim() : '';

    return { explanation, key_points, summary };
}

export async function explainBestAnswer(
    params: BestAnswerExplainParams,
): Promise<BestAnswerExplanation> {
    return await explainWithProvider(params);
}

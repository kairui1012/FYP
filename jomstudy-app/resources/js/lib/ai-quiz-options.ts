import type { QuizAiAnswerPlacement } from '@/component-new/config/create-post-config';
import { postAiJson } from '@/lib/ai-http';

export interface QuizOptionsResult {
    options: string[];
    answerIndex: number;
    explanation: string;
}

export interface QuizOptionsParams {
    question: string;
    subject?: string;
    languageCode?: string;
    existingOptions?: string[];
    answerPlacementPreference?: QuizAiAnswerPlacement;
}

function parseQuizOptionsPayload(
    payload: unknown,
): Omit<QuizOptionsResult, 'provider'> {
    if (!payload || typeof payload !== 'object') {
        throw new Error('invalid quiz options payload');
    }

    const data = payload as Record<string, unknown>;
    const options = Array.isArray(data.options)
        ? data.options.filter(
              (option): option is string =>
                  typeof option === 'string' && option.trim() !== '',
          )
        : [];
    const answerIndex = data.answerIndex ?? data.answer_index;
    const explanation = data.explanation;

    if (options.length !== 4) {
        throw new Error('invalid quiz options count');
    }

    if (
        typeof answerIndex !== 'number' ||
        answerIndex < 0 ||
        answerIndex >= options.length
    ) {
        throw new Error('invalid quiz answer index');
    }

    return {
        options: options.map((option) => option.trim()),
        answerIndex,
        explanation: typeof explanation === 'string' ? explanation.trim() : '',
    };
}

async function requestQuizOptionsWithProvider(
    params: QuizOptionsParams,
): Promise<QuizOptionsResult> {
    const normalizedLanguageCode =
        typeof params.languageCode === 'string' &&
        params.languageCode.trim() !== ''
            ? params.languageCode.trim()
            : null;
    const normalizedSubject =
        typeof params.subject === 'string' && params.subject.trim() !== ''
            ? params.subject.trim()
            : null;

    const payload = await postAiJson(
        '/ai-quiz-options',
        {
            question: params.question,
            subject: normalizedSubject,
            language_code: normalizedLanguageCode,
            existing_options: params.existingOptions ?? [],
            answer_placement: params.answerPlacementPreference ?? 'random',
        },
        'The AI quiz options service returned an unexpected response. Please try again.',
    );

    if (
        !payload ||
        typeof payload !== 'object' ||
        !('quiz_options' in payload)
    ) {
        throw new Error(`Failed: invalid quiz options response`);
    }

    return parseQuizOptionsPayload(
        (payload as { quiz_options?: unknown }).quiz_options,
    );
}

export async function requestQuizOptions(
    params: QuizOptionsParams,
): Promise<QuizOptionsResult> {
    return await requestQuizOptionsWithProvider(params);
}

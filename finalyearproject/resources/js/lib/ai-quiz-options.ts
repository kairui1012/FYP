import type { QuizAiAnswerPlacement } from '@/components/create-post/create-post-config';

export interface QuizOptionsResult {
    options: string[];
    answerIndex: number;
    explanation: string;
    provider: 'deepseek' | 'gemini';
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
    provider: 'deepseek' | 'gemini',
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

    const res = await fetch('/ai-quiz-options', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN':
                document.querySelector<HTMLMetaElement>(
                    'meta[name="csrf-token"]',
                )?.content ?? '',
        },
        body: JSON.stringify({
            question: params.question,
            subject: normalizedSubject,
            language_code: normalizedLanguageCode,
            existing_options: params.existingOptions ?? [],
            answer_placement: params.answerPlacementPreference ?? 'random',
            provider,
        }),
    });

    if (!res.ok) {
        let errorMessage = `${provider} failed: ${res.status}`;
        try {
            const errorData = await res.json();
            if (
                typeof errorData?.error === 'string' &&
                errorData.error.trim() !== ''
            ) {
                errorMessage = `${provider} failed: ${errorData.error}`;
            } else if (
                errorData?.errors &&
                typeof errorData.errors === 'object'
            ) {
                const firstError = Object.values(
                    errorData.errors as Record<string, unknown>,
                )
                    .flatMap((value) =>
                        Array.isArray(value)
                            ? value.filter(
                                  (item): item is string =>
                                      typeof item === 'string' &&
                                      item.trim() !== '',
                              )
                            : [],
                    )
                    .at(0);

                if (firstError) {
                    errorMessage = `${provider} failed: ${firstError}`;
                }
            }
        } catch {
            // Keep the status-based message.
        }
        throw new Error(errorMessage);
    }

    const payload = await res.json();

    if (
        !payload ||
        typeof payload !== 'object' ||
        !('quiz_options' in payload)
    ) {
        throw new Error(`${provider} failed: invalid quiz options response`);
    }

    return {
        ...parseQuizOptionsPayload(
            (payload as { quiz_options?: unknown }).quiz_options,
        ),
        provider,
    };
}

const formatQuizOptionsError = (error: unknown): Error => {
    const rawMessage =
        error instanceof Error && error.message.trim() !== ''
            ? error.message
            : 'AI options generation failed.';

    if (
        rawMessage.includes('Gemini error: 403') ||
        rawMessage.includes('DeepSeek error: 403')
    ) {
        return new Error(
            'AI provider authorization failed (403). Please fill options manually for now.',
        );
    }

    if (rawMessage.includes('failed: 502')) {
        return new Error(
            'AI options service is temporarily unavailable. Please try again later.',
        );
    }

    return new Error(rawMessage);
};

export async function requestQuizOptions(
    params: QuizOptionsParams,
): Promise<QuizOptionsResult> {
    try {
        return await requestQuizOptionsWithProvider(params, 'deepseek');
    } catch (deepseekErr) {
        console.warn(
            '[aiQuizOptions] DeepSeek failed, falling back to Gemini:',
            deepseekErr,
        );
        try {
            return await requestQuizOptionsWithProvider(params, 'gemini');
        } catch (geminiErr) {
            const formattedGeminiError = formatQuizOptionsError(geminiErr);
            const deepseekMessage =
                deepseekErr instanceof Error && deepseekErr.message.trim() !== ''
                    ? deepseekErr.message
                    : 'deepseek failed';

            throw new Error(
                `${formattedGeminiError.message} (DeepSeek: ${deepseekMessage})`,
            );
        }
    }
}

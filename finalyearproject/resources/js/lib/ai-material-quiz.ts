export type MaterialQuizQuestion = {
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
};

export type MaterialQuizResult = {
    questions: MaterialQuizQuestion[];
    provider: 'deepseek' | 'gemini';
};

export type MaterialQuizParams = {
    materialTitle: string;
    materialContent: string;
    subject?: string;
    languageCode?: string;
    questionCount?: number;
};

function parseMaterialQuizPayload(
    payload: unknown,
): Omit<MaterialQuizResult, 'provider'> {
    if (!payload || typeof payload !== 'object') {
        throw new Error('invalid material quiz payload');
    }

    const data = payload as Record<string, unknown>;
    const rawQuestions = Array.isArray(data.questions) ? data.questions : [];
    const questions = rawQuestions
        .map((item) => {
            if (!item || typeof item !== 'object') {
                return null;
            }

            const question = item as Record<string, unknown>;
            const options = Array.isArray(question.options)
                ? question.options.filter(
                      (option): option is string =>
                          typeof option === 'string' && option.trim() !== '',
                  )
                : [];
            const answerIndex = question.answerIndex ?? question.answer_index;

            if (
                typeof question.question !== 'string' ||
                options.length !== 4 ||
                typeof answerIndex !== 'number' ||
                answerIndex < 0 ||
                answerIndex >= options.length
            ) {
                return null;
            }

            return {
                question: question.question.trim(),
                options: options.map((option) => option.trim()),
                answerIndex,
                explanation:
                    typeof question.explanation === 'string'
                        ? question.explanation.trim()
                        : '',
            };
        })
        .filter((question): question is MaterialQuizQuestion =>
            Boolean(question),
        );

    if (questions.length < 1) {
        throw new Error('invalid material quiz questions');
    }

    return { questions };
}

async function requestMaterialQuizWithProvider(
    params: MaterialQuizParams,
    provider: 'deepseek' | 'gemini',
): Promise<MaterialQuizResult> {
    const res = await fetch('/ai-material-quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN':
                document.querySelector<HTMLMetaElement>(
                    'meta[name="csrf-token"]',
                )?.content ?? '',
        },
        body: JSON.stringify({
            material_title: params.materialTitle,
            material_content: params.materialContent,
            subject: params.subject ?? null,
            language_code: params.languageCode ?? null,
            question_count: params.questionCount ?? 1,
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
            }
        } catch {
            // Keep the status-based message.
        }
        throw new Error(errorMessage);
    }

    const payload = await res.json();

    if (!payload || typeof payload !== 'object' || !('quiz' in payload)) {
        throw new Error(`${provider} failed: invalid material quiz response`);
    }

    return {
        ...parseMaterialQuizPayload((payload as { quiz?: unknown }).quiz),
        provider,
    };
}

const formatMaterialQuizError = (error: unknown): Error => {
    const rawMessage =
        error instanceof Error && error.message.trim() !== ''
            ? error.message
            : 'AI quiz generation failed.';

    if (
        rawMessage.includes('Gemini error: 403') ||
        rawMessage.includes('DeepSeek error: 403')
    ) {
        return new Error(
            'AI provider authorization failed (403). You can still create or attach the quiz manually in Create Post.',
        );
    }

    if (rawMessage.includes('failed: 502')) {
        return new Error(
            'AI quiz service is temporarily unavailable. Please try again later or attach a quiz manually.',
        );
    }

    return new Error(rawMessage);
};

export async function requestMaterialQuiz(
    params: MaterialQuizParams,
): Promise<MaterialQuizResult> {
    try {
        return await requestMaterialQuizWithProvider(params, 'deepseek');
    } catch (deepseekErr) {
        console.warn(
            '[aiMaterialQuiz] DeepSeek failed, falling back to Gemini:',
            deepseekErr,
        );
        try {
            return await requestMaterialQuizWithProvider(params, 'gemini');
        } catch (geminiErr) {
            const formattedGeminiError = formatMaterialQuizError(geminiErr);
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

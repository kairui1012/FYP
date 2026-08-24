import type {
    QuizData,
    QuizQuestion,
} from '@/components/ts/features/post-content/post-content-types';

export function buildQuizData(
    raw: Record<string, unknown> | null | undefined,
): QuizData | null {
    if (!raw) {
        return null;
    }

    if (Array.isArray(raw.questions) && raw.questions.length > 0) {
        const questions: QuizQuestion[] = [];

        for (const question of raw.questions as Record<string, unknown>[]) {
            const options = Array.isArray(question.options)
                ? (question.options as unknown[]).filter(
                      (value): value is string => typeof value === 'string',
                  )
                : [];
            const answerIndex = Number(question.answer_index);

            if (
                options.length < 2 ||
                Number.isNaN(answerIndex) ||
                answerIndex < 0 ||
                answerIndex >= options.length
            ) {
                continue;
            }

            questions.push({
                question:
                    typeof question.question === 'string'
                        ? question.question
                        : null,
                options,
                answerIndex,
                creatorAnswer: options[answerIndex] ?? '',
                explanation:
                    typeof question.explanation === 'string'
                        ? question.explanation
                        : null,
            });
        }

        return questions.length > 0 ? { questions } : null;
    }

    const options = Array.isArray(raw.options)
        ? (raw.options as unknown[]).filter(
              (value): value is string => typeof value === 'string',
          )
        : [];
    const answerIndex = Number(raw.answer_index);

    if (
        options.length < 2 ||
        Number.isNaN(answerIndex) ||
        answerIndex < 0 ||
        answerIndex >= options.length
    ) {
        return null;
    }

    return {
        questions: [
            {
                question: null,
                options,
                answerIndex,
                creatorAnswer: options[answerIndex] ?? '',
                explanation:
                    typeof raw.explanation === 'string'
                        ? raw.explanation
                        : null,
            },
        ],
    };
}

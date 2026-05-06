export interface QuizAiAnalysis {
    aiAnswer: string;
    isUserCorrect: boolean;
    matchesCreator: boolean;
    explanation: string;
    discrepancyAnalysis: string;
    confidence: 'high' | 'medium' | 'low';
    userAnswer: string;
    creatorAnswer: string;
    aiReasoning?: string;
    creatorReasoning?: string;
    ambiguityNote?: string;
}

export interface ExplainParams {
    question: string;
    options: string[];
    userAnswer: string;
    creatorAnswer: string;
}

function parseAnalysisPayload(payload: unknown): Omit<QuizAiAnalysis, 'provider'> {
    if (!payload || typeof payload !== 'object') {
        throw new Error('invalid analysis payload');
    }

    const data = payload as Record<string, unknown>;
    const aiAnswer = data.aiAnswer ?? data.ai_answer;
    const isUserCorrect = data.isUserCorrect ?? data.is_user_correct;
    const matchesCreator = data.matchesCreator ?? data.matches_creator;
    const explanation = data.explanation;
    const discrepancyAnalysis = data.discrepancyAnalysis ?? data.discrepancy_analysis;
    const confidence = data.confidence;
    const userAnswer = data.userAnswer ?? data.user_answer;
    const creatorAnswer = data.creatorAnswer ?? data.creator_answer;
    const aiReasoning = data.aiReasoning ?? data.ai_reasoning;
    const creatorReasoning = data.creatorReasoning ?? data.creator_reasoning;
    const ambiguityNote = data.ambiguityNote ?? data.ambiguity_note;

    if (typeof aiAnswer !== 'string' || aiAnswer.trim() === '') {
        throw new Error('invalid ai answer payload');
    }

    if (typeof isUserCorrect !== 'boolean') {
        throw new Error('invalid user correctness payload');
    }

    if (typeof matchesCreator !== 'boolean') {
        throw new Error('invalid creator match payload');
    }

    if (typeof explanation !== 'string' || explanation.trim() === '') {
        throw new Error('invalid explanation payload');
    }

    if (typeof userAnswer !== 'string' || userAnswer.trim() === '') {
        throw new Error('invalid user answer payload');
    }

    if (typeof creatorAnswer !== 'string' || creatorAnswer.trim() === '') {
        throw new Error('invalid creator answer payload');
    }

    return {
        aiAnswer: aiAnswer.trim(),
        isUserCorrect,
        matchesCreator,
        explanation: explanation.trim(),
        discrepancyAnalysis: typeof discrepancyAnalysis === 'string' ? discrepancyAnalysis.trim() : '',
        confidence:
            confidence === 'high' || confidence === 'medium' || confidence === 'low'
                ? confidence
                : 'medium',
        userAnswer: userAnswer.trim(),
        creatorAnswer: creatorAnswer.trim(),
        aiReasoning: typeof aiReasoning === 'string' && aiReasoning.trim() !== '' ? aiReasoning.trim() : undefined,
        creatorReasoning: typeof creatorReasoning === 'string' && creatorReasoning.trim() !== '' ? creatorReasoning.trim() : undefined,
        ambiguityNote: typeof ambiguityNote === 'string' && ambiguityNote.trim() !== '' ? ambiguityNote.trim() : undefined,
    };
}

async function explainWithProvider(
    params: ExplainParams,
): Promise<QuizAiAnalysis> {
    const res = await fetch('/ai-explain', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN':
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        },
        body: JSON.stringify({
            question: params.question,
            options: params.options,
            user_answer: params.userAnswer,
            creator_answer: params.creatorAnswer,
        }),
    });

    if (!res.ok) {
        let errorMessage = `Failed: ${res.status}`;
        try {
            const errorData = await res.json();
            if (typeof errorData?.error === 'string' && errorData.error.trim() !== '') {
                errorMessage = `Failed: ${errorData.error}`;
            }
        } catch {
            // Keep the status-based message when response is not JSON.
        }
        throw new Error(errorMessage);
    }

    const payload = await res.json();

    if (!payload || typeof payload !== 'object' || !('analysis' in payload)) {
        throw new Error(`Failed: invalid analysis payload`);
    }

    return {
        ...parseAnalysisPayload((payload as { analysis?: unknown }).analysis),
    };
}

export async function explainAnswer(params: ExplainParams): Promise<QuizAiAnalysis> {
    return await explainWithProvider(params);
}

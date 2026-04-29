export type LearningObjectivesDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LearningObjectives {
    objectives: string[];
    difficulty: LearningObjectivesDifficulty;
    estimated_time: string;
    provider: 'deepseek' | 'gemini';
}

export interface LearningObjectivesParams {
    postTitle: string;
    postContent?: string;
    postType?: string;
}

function parsePayload(payload: unknown): Omit<LearningObjectives, 'provider'> {
    if (!payload || typeof payload !== 'object') {
        throw new Error('invalid objectives payload');
    }

    const data = payload as Record<string, unknown>;
    const objectives = Array.isArray(data.objectives)
        ? (data.objectives as unknown[]).filter(
              (v): v is string => typeof v === 'string' && v.trim() !== '',
          )
        : [];

    if (objectives.length === 0) {
        throw new Error('no objectives returned');
    }

    const difficulty =
        data.difficulty === 'beginner' ||
        data.difficulty === 'intermediate' ||
        data.difficulty === 'advanced'
            ? data.difficulty
            : 'intermediate';

    const estimated_time =
        typeof data.estimated_time === 'string' ? data.estimated_time.trim() : '';

    return { objectives, difficulty, estimated_time };
}

async function requestWithProvider(
    params: LearningObjectivesParams,
    provider: 'deepseek' | 'gemini',
): Promise<LearningObjectives> {
    const res = await fetch('/ai-learning-objectives', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN':
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                    ?.content ?? '',
        },
        body: JSON.stringify({
            post_title: params.postTitle,
            post_content: params.postContent ?? '',
            post_type: params.postType ?? 'sharing',
            provider,
        }),
    });

    if (!res.ok) {
        let msg = `${provider} failed: ${res.status}`;
        try {
            const err = await res.json();
            if (typeof err?.error === 'string' && err.error.trim() !== '') {
                msg = err.error;
            }
        } catch {
            // keep status message
        }
        throw new Error(msg);
    }

    const payload = await res.json();
    return {
        ...parsePayload((payload as { result?: unknown }).result),
        provider,
    };
}

export async function requestLearningObjectives(
    params: LearningObjectivesParams,
): Promise<LearningObjectives> {
    try {
        return await requestWithProvider(params, 'deepseek');
    } catch (err) {
        console.warn('[aiLearningObjectives] DeepSeek failed, falling back to Gemini:', err);
        return await requestWithProvider(params, 'gemini');
    }
}

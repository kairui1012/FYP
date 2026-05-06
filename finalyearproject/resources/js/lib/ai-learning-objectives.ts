export type LearningObjectivesDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LearningObjectives {
    objectives: string[];
    difficulty: LearningObjectivesDifficulty;
    estimated_time: string;
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

    if (objectives.length < 3 || objectives.length > 5) {
        throw new Error('AI must return 3 to 5 learning objectives');
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
        }),
    });

    if (!res.ok) {
        let msg = `Failed: ${res.status}`;
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
    return parsePayload((payload as { result?: unknown }).result);
}

export async function requestLearningObjectives(
    params: LearningObjectivesParams,
): Promise<LearningObjectives> {
    return await requestWithProvider(params);
}

type JsonObject = Record<string, unknown>;

type JsonErrorPayload = {
    error?: string;
    message?: string;
    errors?: Record<string, unknown>;
};

function getCookieValue(name: string): string {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(
        new RegExp(`(?:^|; )${escapedName}=([^;]*)`),
    );

    return match ? decodeURIComponent(match[1]) : '';
}

function getMetaCsrfToken(): string {
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? ''
    );
}

function firstValidationError(errors: Record<string, unknown>): string | null {
    for (const value of Object.values(errors)) {
        if (Array.isArray(value)) {
            const message = value.find(
                (item): item is string =>
                    typeof item === 'string' && item.trim() !== '',
            );

            if (message) {
                return message;
            }
        }
    }

    return null;
}

function getErrorMessage(
    payload: JsonErrorPayload | null,
    contentType: string,
    fallback: string,
): string {
    if (typeof payload?.message === 'string' && payload.message.trim() !== '') {
        return payload.message;
    }

    if (typeof payload?.error === 'string' && payload.error.trim() !== '') {
        return payload.error;
    }

    if (payload?.errors && typeof payload.errors === 'object') {
        return firstValidationError(payload.errors) ?? fallback;
    }

    if (contentType.includes('text/html')) {
        return fallback;
    }

    return fallback;
}

export async function postAiJson(
    endpoint: string,
    body: JsonObject,
    fallbackMessage = 'The AI service returned an unexpected response. Please try again.',
): Promise<JsonObject> {
    const csrfToken = getMetaCsrfToken();
    const xsrfToken = getCookieValue('XSRF-TOKEN');

    const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(xsrfToken
                ? { 'X-XSRF-TOKEN': xsrfToken }
                : { 'X-CSRF-TOKEN': csrfToken }),
        },
        body: JSON.stringify({
            ...(!xsrfToken && csrfToken ? { _token: csrfToken } : {}),
            ...body,
        }),
    });

    const contentType = response.headers.get('content-type') ?? '';
    const responseText = await response.text();
    const payload = contentType.includes('application/json')
        ? (() => {
              try {
                  return JSON.parse(responseText) as JsonObject;
              } catch {
                  return null;
              }
          })()
        : null;

    if (!response.ok) {
        throw new Error(
            getErrorMessage(
                payload as JsonErrorPayload | null,
                contentType,
                fallbackMessage,
            ),
        );
    }

    if (!payload || typeof payload !== 'object') {
        throw new Error(fallbackMessage);
    }

    return payload;
}

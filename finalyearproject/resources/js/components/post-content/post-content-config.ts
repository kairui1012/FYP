export function getLangBadgeProps(code: string) {
    if (code === 'en') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (code === 'zh') return { bg: 'bg-red-100', text: 'text-red-700' };
    if (code === 'bm' || code === 'my') {
        return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    }
    return { bg: 'bg-gray-200', text: 'text-gray-700' };
}

export function getPostTypeBadgeProps(type: string) {
    if (type === 'quiz') return { bg: 'bg-amber-100', text: 'text-amber-700' };
    if (type === 'discussion') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (type === 'question') {
        return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    }
    return { bg: 'bg-violet-100', text: 'text-violet-700' };
}

export function getSubjectBadgeProps() {
    return { bg: 'bg-slate-100', text: 'text-slate-700' };
}

export function trans(key: string, page: unknown) {
    const parts = key.split('.');
    let obj = (page as { props?: { lang?: unknown } }).props?.lang;

    for (const part of parts) {
        if (obj && typeof obj === 'object' && part in obj) {
            obj = (obj as Record<string, unknown>)[part];
        } else {
            return key;
        }
    }

    return typeof obj === 'string' ? obj : key;
}

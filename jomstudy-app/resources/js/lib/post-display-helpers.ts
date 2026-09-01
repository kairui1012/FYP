export function getLanguageLabel(code?: string) {
    if (code === 'en') return 'English';
    if (code === 'zh') return '中文';
    if (code === 'bm') return 'Bahasa Malaysia';
    return code ?? '';
}

export function getSubjectLabel(
    subjectName: string | null | undefined,
    trans: (key: string) => string,
) {
    if (!subjectName) return '';

    const key = `subjects.${subjectName}`;
    const translated = trans(key);

    return translated === key ? subjectName : translated;
}

export function getSubjectLabelFromPage<PageContext>(
    subjectName: string | null | undefined,
    trans: (key: string, page: PageContext) => string,
    page: PageContext,
) {
    if (!subjectName) return '';

    const key = `subjects.${subjectName}`;
    const translated = trans(key, page);

    return translated === key ? subjectName : translated;
}

export function formatTimeAgo(dateString: string) {
    const now = new Date().getTime();
    const target = new Date(dateString).getTime();
    const diff = Math.max(0, now - target);

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < hour) return `${Math.floor(diff / minute) || 1}m`;
    if (diff < day) return `${Math.floor(diff / hour)}h`;
    return `${Math.floor(diff / day)}d`;
}

export function formatFullDate(dateString: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(dateString));
}

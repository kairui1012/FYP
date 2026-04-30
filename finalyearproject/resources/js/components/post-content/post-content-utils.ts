export function csrfHeaders(contentType?: 'json') {
    const csrfToken =
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? '';

    return {
        Accept: 'application/json',
        ...(contentType === 'json'
            ? { 'Content-Type': 'application/json' }
            : {}),
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
    };
}

export function scrollCommentsInAppContent(commentsSection: HTMLElement | null) {
    if (!commentsSection) {
        return;
    }

    let container: HTMLElement | null = commentsSection.parentElement;
    while (container) {
        const { overflowY } = window.getComputedStyle(container);
        const isScrollable =
            (overflowY === 'auto' || overflowY === 'scroll') &&
            container.scrollHeight > container.clientHeight;

        if (isScrollable) {
            break;
        }

        container = container.parentElement;
    }

    const headerOffset = 96;

    if (!container) {
        const top =
            commentsSection.getBoundingClientRect().top +
            window.scrollY -
            headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
        return;
    }

    const top =
        commentsSection.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        headerOffset;

    container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

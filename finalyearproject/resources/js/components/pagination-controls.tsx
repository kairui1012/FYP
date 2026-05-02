import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@/types';

type PaginationControlsProps = {
    pagination?: PaginationMeta | null;
    only?: string[];
};

export function PaginationControls({
    pagination,
    only,
}: PaginationControlsProps) {
    if (!pagination || pagination.last_page <= 1) {
        return null;
    }

    const rangeLabel =
        pagination.from !== null && pagination.to !== null
            ? `${pagination.from}-${pagination.to}`
            : '0';

    const linkClass =
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e27193]/35';
    const enabledClass =
        'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:text-[#e27193]';
    const disabledClass = 'cursor-not-allowed bg-zinc-100 text-zinc-400';

    const renderLink = (
        href: string | null,
        label: string,
        direction: 'previous' | 'next',
    ) => {
        const icon =
            direction === 'previous' ? (
                <ChevronLeft className="h-4 w-4" />
            ) : (
                <ChevronRight className="h-4 w-4" />
            );

        if (!href) {
            return (
                <span className={`${linkClass} ${disabledClass}`}>
                    {direction === 'previous' ? icon : null}
                    {label}
                    {direction === 'next' ? icon : null}
                </span>
            );
        }

        return (
            <Link
                href={href}
                only={only}
                preserveScroll
                preserveState
                className={`${linkClass} ${enabledClass}`}
            >
                {direction === 'previous' ? icon : null}
                {label}
                {direction === 'next' ? icon : null}
            </Link>
        );
    };

    return (
        <nav className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500">
                Showing {rangeLabel} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
                {renderLink(pagination.prev_page_url, 'Previous', 'previous')}
                <span className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-600">
                    Page {pagination.current_page} of {pagination.last_page}
                </span>
                {renderLink(pagination.next_page_url, 'Next', 'next')}
            </div>
        </nav>
    );
}

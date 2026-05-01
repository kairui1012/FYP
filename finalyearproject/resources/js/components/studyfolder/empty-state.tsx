import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
    icon: ReactNode;
    title: string;
    subtitle?: string;
    compact?: boolean;
    action?: ReactNode;
};

export function EmptyState({ icon, title, subtitle, compact = false, action }: EmptyStateProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl border border-dashed border-rose-200 bg-linear-to-br from-rose-50 via-white to-sky-50 px-5 text-center',
                compact ? 'py-8' : 'py-12 md:px-8 md:py-14',
            )}
        >
            <div className="mx-auto flex max-w-lg flex-col items-center">
                <div className={cn('relative mb-5', compact ? 'h-16 w-24' : 'h-20 w-28')}>
                    <div
                        className={cn(
                            'absolute top-0 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-rose-100',
                            compact ? 'h-12 w-12' : 'h-16 w-16',
                        )}
                    >
                        <span className={cn('text-[#e27193]', compact ? '[&>svg]:h-5 [&>svg]:w-5' : '[&>svg]:h-7 [&>svg]:w-7')}>
                            {icon}
                        </span>
                    </div>
                    <div
                        className={cn(
                            'absolute bottom-0 left-2 rounded-full bg-sky-100 ring-4 ring-white',
                            compact ? 'h-7 w-7' : 'h-10 w-10',
                        )}
                    />
                    <div
                        className={cn(
                            'absolute right-2 bottom-0 rounded-full bg-amber-100 ring-4 ring-white',
                            compact ? 'h-7 w-7' : 'h-10 w-10',
                        )}
                    />
                </div>
                <h2 className={cn('font-bold text-zinc-900', compact ? 'text-base' : 'text-lg')}>
                    {title}
                </h2>
                {subtitle && (
                    <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">{subtitle}</p>
                )}
                {action && (
                    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
}

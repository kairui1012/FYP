import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
    message: string;
    compact?: boolean;
};

export function EmptyState({ message, compact = false }: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-md border-2 border-dashed border-zinc-300 bg-transparent px-6 text-center',
                compact ? 'py-6' : 'py-10',
            )}
        >
            <Bookmark className="mb-2 h-7 w-7 text-zinc-400" />
            <p className="max-w-sm text-sm leading-5 text-zinc-500">
                {message}
            </p>
        </div>
    );
}

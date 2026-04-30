import { BookOpen, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type ManualGuideProps = {
    title: string;
    summary: string;
    items: string[];
};

export function ManualGuide({ title, summary, items }: ManualGuideProps) {
    const [open, setOpen] = useState(false);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="rounded-lg border border-zinc-200 bg-white shadow-xs"
        >
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-zinc-50"
                >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                        <BookOpen className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-lg font-semibold text-zinc-950">
                            {title}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-zinc-600">
                            {summary}
                        </span>
                    </span>
                    <ChevronDown
                        className={cn(
                            'h-5 w-5 shrink-0 text-zinc-500 transition-transform',
                            open && 'rotate-180',
                        )}
                    />
                </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="border-t border-zinc-200 px-5 py-5">
                    <ol className="grid gap-3 md:grid-cols-2">
                        {items.map((item, index) => (
                            <li
                                key={item}
                                className="flex gap-3 rounded-md bg-zinc-50 px-3 py-3 text-sm leading-6 text-zinc-700"
                            >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#de6b89] ring-1 ring-zinc-200">
                                    {index + 1}
                                </span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

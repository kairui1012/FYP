import { router, usePage } from '@inertiajs/react';
import { reactLang } from '@erag/lang-sync-inertia';
import { Check, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { switchMethod as changeLocale } from '@/routes/language';
import { cn } from '@/lib/utils';

const localeLabels: Record<string, string> = {
    en: 'EN',
    zh: '中文',
    my: 'BM',
};

const localeOptions = ['en', 'zh', 'my'] as const;

type Props = {
    className?: string;
};

export function BtnChangeLang({ className }: Props) {
    const page = usePage();
    const { trans } = reactLang();
    const locale = (page.props as typeof page.props & { locale?: string }).locale ?? 'en';
    const currentLocaleLabel = localeLabels[locale] ?? locale;

    const handleLocaleChange = (nextLocale: (typeof localeOptions)[number]) => {
        if (nextLocale === locale) {
            return;
        }

        router.post(
            changeLocale().url,
            { locale: nextLocale },
            {
                preserveScroll: true,
                preserveState: false,
            },
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        'hidden h-9 items-center gap-2 rounded-full border-2 border-[#ef99b0] bg-white px-3 text-black shadow-none transition-colors duration-200 hover:border-[#de6b89] hover:bg-neutral-100 hover:text-black focus-visible:border-[#de6b89] focus-visible:ring-[#de6b89]/25 md:inline-flex dark:border-[#eea3b7] dark:bg-white dark:text-black dark:hover:border-[#de6b89] dark:hover:bg-neutral-100 dark:focus-visible:border-[#de6b89] dark:focus-visible:ring-[#de6b89]/25',
                        className,
                    )}
                    aria-label={trans('navigation.change_language')}
                >
                    <Languages className="h-4.5 w-4.5" />
                    <span className="text-sm font-medium">{currentLocaleLabel}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-44 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm"
            >
                {localeOptions.map((option) => (
                    <DropdownMenuItem
                        asChild
                        key={option}
                        className={cn(
                            'my-0.5 rounded-xl px-3 py-2.5 outline-none transition-colors focus:bg-neutral-100 focus:text-neutral-900 data-[state=open]:bg-neutral-100',
                            option === locale && 'bg-neutral-100 text-neutral-900',
                        )}
                    >
                        <button
                            type="button"
                            className="flex w-full cursor-pointer items-center justify-between gap-3"
                            onClick={() => handleLocaleChange(option)}
                        >
                            <span className="text-sm font-medium text-neutral-900">
                                {localeLabels[option]}
                            </span>
                            {option === locale ? (
                                <span className="flex size-5 items-center justify-center rounded-full bg-[#de6b89]/12 text-[#de6b89]">
                                    <Check className="size-3.5" />
                                </span>
                            ) : (
                                <span className="size-5 rounded-full border border-transparent" />
                            )}
                        </button>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
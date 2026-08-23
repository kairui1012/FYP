import { reactLang } from '@erag/lang-sync-inertia';
import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/component-new/header/header-for-setting';
import { Button } from '@/component-new/button/button';
import { Separator } from '@/component-new/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit } from '@/routes/profile';
import { edit as editPassword } from '@/routes/user-password';
import type { NavItem } from '@/types';

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { trans } = reactLang();
    const { isCurrentOrParentUrl } = useCurrentUrl();

    const sidebarNavItems: NavItem[] = [
        {
            title: trans('settings.sidebar_profile'),
            href: edit(),
            icon: null,
        },
        {
            title: trans('settings.sidebar_password'),
            href: editPassword(),
            icon: null,
        },
    ];

    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="px-4 py-6 lg:pl-8">
            <Heading
                title={trans('settings.page_title')}
                description={trans('settings.page_description')}
            />

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-44 lg:border-r lg:border-zinc-200 lg:pr-60">
                    <nav
                        className="flex flex-col items-start space-x-0 space-y-1"
                        aria-label={trans('settings.page_title')}
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn(
                                    'my-0.5 w-fit rounded-xl px-3 py-2.5 outline-none transition-colors focus:bg-neutral-100 focus:text-neutral-900 data-[state=open]:bg-neutral-100',
                                    isCurrentOrParentUrl(item.href) && 'bg-neutral-100 text-neutral-900',
                                )}
                            >
                                <Link
                                    href={item.href}
                                    className="flex cursor-pointer items-center justify-start gap-2 text-sm font-medium text-neutral-900"
                                >
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1 md:max-w-2xl lg:pl-6">
                    <section className="max-w-xl space-y-12">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}

import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="w-full space-y-2 text-left">
                            <h1 className="text-3xl font-medium font-sans tracking-normal">{title}</h1>
                            <h1 className="text-xl font-light font-sans tracking-normal">{description}</h1>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/shared/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-2.5 bg-muted p-3 pt-4 sm:p-4 sm:pt-6 md:p-5">
            <div className="flex w-full max-w-[clamp(17rem,82vw,23rem)] flex-col gap-2.5">
                <div className="flex flex-col gap-3">
                    <Card className="w-full overflow-hidden rounded-3xl border-0 p-0 shadow-2xl lg:rounded-4xl">
                        <CardHeader className="px-3.5 pt-3.5 pb-0 text-center sm:px-4 md:px-4.5">
                            <CardTitle className="flex items-center justify-center gap-2 text-sm sm:text-base">
                                <AppLogoIcon className="size-7 fill-current text-black dark:text-white" />
                                <h1 className="text-sm font-semibold tracking-tight sm:text-base">
                                    {title}
                                </h1>
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                {description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-3.5 pt-2 pb-4 sm:px-4 md:px-4.5">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

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
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                

                <div className="flex flex-col gap-6">
                    <Card className="w-full max-w-4xl overflow-hidden border-0 p-0 shadow-2xl rounded-4xl">
                        
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="flex items-center justify-center gap-3 text-xl">
                                <AppLogoIcon className="size-9 fill-current text-black dark:text-white" />
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    {title}
                                </h1>
                            </CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8 pt-3">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

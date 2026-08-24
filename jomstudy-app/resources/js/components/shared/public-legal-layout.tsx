import type { ReactNode } from 'react';
import { AppHeaderForUnlogin } from './guest-header';

type PublicLegalLayoutProps = {
    children: ReactNode;
};

export function PublicLegalLayout({ children }: PublicLegalLayoutProps) {
    return (
        <>
            <AppHeaderForUnlogin />
            {children}
        </>
    );
}

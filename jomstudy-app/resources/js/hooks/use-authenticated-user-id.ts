import { usePage } from '@inertiajs/react';

type AuthPageProps = {
    auth?: {
        user?: {
            id?: number;
        };
    };
};

export function useAuthenticatedUserId() {
    const { props } = usePage();

    return (props as AuthPageProps).auth?.user?.id;
}

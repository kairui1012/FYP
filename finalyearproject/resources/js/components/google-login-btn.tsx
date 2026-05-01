import { reactLang } from '@erag/lang-sync-inertia';
import { Button } from '@/components/ui/button';

export default function GoogleLoginBtn() {
    const { trans } = reactLang();

    return (
        <div>
            <Button
                type="button"
                className="mt-1 h-11 w-full"
                onClick={() => (window.location.href = '/login/google')}
            >
                <h1 className="font-bold">{trans('auth.continue_with_google')}</h1>
                <svg
                    aria-hidden="true"
                    className="ml-2 size-5 shrink-0"
                    viewBox="0 0 48 48"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.247 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.06 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.277 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-0.138-2.65-0.389-3.917z"
                        fill="#FFC107"
                    />
                    <path
                        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.06 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.277 4 24 4c-7.682 0-14.417 4.337-17.694 10.691z"
                        fill="#FF3D00"
                    />
                    <path
                        d="M24 44c5.177 0 9.867-1.977 13.417-5.193l-6.19-5.238C29.152 35.168 26.676 36 24 36c-5.226 0-9.619-3.316-11.283-7.946l-6.522 5.025C9.437 39.556 16.644 44 24 44z"
                        fill="#4CAF50"
                    />
                    <path
                        d="M43.611 20.083H42V20H24v8h11.303a12.083 12.083 0 0 1-4.076 5.569l.001-.001l6.19 5.238C37.006 39.18 44 34 44 24c0-1.341-0.138-2.65-0.389-3.917z"
                        fill="#1976D2"
                    />
                </svg>
            </Button>
        </div>
    );
}

import { BadgeCheck } from 'lucide-react';

type Props = {
    className?: string;
};

export function VerifiedTeacherBadge({ className = '' }: Props) {
    return (
        <BadgeCheck
            className={`inline-block h-4 w-4 shrink-0 text-blue-500 ${className}`}
            aria-label="Verified Teacher"
        />
    );
}

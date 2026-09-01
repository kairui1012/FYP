import { reactLang } from '@erag/lang-sync-inertia';
import { BadgeCheck } from 'lucide-react';

type Props = {
    className?: string;
};

export function VerifiedTeacherBadge({ className = '' }: Props) {
    const { trans } = reactLang();

    return (
        <BadgeCheck
            className={`inline-block h-4 w-4 shrink-0 text-blue-500 ${className}`}
            aria-label={trans('navigation.verified_teacher')}
        />
    );
}

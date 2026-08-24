import { Award, Crown, Sparkles, Star, Trophy } from 'lucide-react';

const badgeIconMap = { Sparkles, Star, Trophy, Crown, Award } as const;

export function BadgeIcon({
    iconKey,
    className,
}: {
    iconKey?: string | null;
    className?: string;
}) {
    const Icon =
        iconKey && iconKey in badgeIconMap
            ? badgeIconMap[iconKey as keyof typeof badgeIconMap]
            : Trophy;
    return <Icon className={className} />;
}

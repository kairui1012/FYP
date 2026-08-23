type BadgeLike = {
    key: string;
    name: string;
    description: string;
};

type TransFn = (key: string) => string;

export function getTranslatedBadgeName(
    trans: TransFn,
    badge: BadgeLike,
): string {
    const translated = trans(`achievement.badge_${badge.key}_name`);

    return translated === `achievement.badge_${badge.key}_name`
        ? badge.name
        : translated;
}

export function getTranslatedBadgeDescription(
    trans: TransFn,
    badge: BadgeLike,
): string {
    const translated = trans(`achievement.badge_${badge.key}_desc`);

    return translated === `achievement.badge_${badge.key}_desc`
        ? badge.description
        : translated;
}

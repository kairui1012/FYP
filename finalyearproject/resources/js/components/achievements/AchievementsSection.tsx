import { AchievementCard } from './AchievementCard';
import { CategoryHeader } from './CategoryHeader';
import type { AchievementItem } from './types';

type Props = {
    displayCategories: string[];
    grouped: Record<string, AchievementItem[]>;
};

export function AchievementsSection({ displayCategories, grouped }: Props) {
    return (
        <section className="space-y-8">
            {displayCategories.map((cat) => {
                const items = grouped[cat] ?? [];
                if (items.length === 0) return null;
                const earnedInCat = items.filter((i) => i.achieved).length;

                return (
                    <div key={cat} className="space-y-3">
                        <CategoryHeader cat={cat} items={items} earnedInCat={earnedInCat} />
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {items.map((item) => (
                                <AchievementCard key={item.key} item={item} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </section>
    );
}

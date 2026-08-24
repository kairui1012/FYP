import { BookOpenCheck, ClipboardList, HelpCircle } from 'lucide-react';

type PostTypeButtonOption = {
    value: string;
    label: string;
    description: string;
    activeClass: string;
    idleClass: string;
};

type PostTypeSectionProps = {
    postTypeLabel: string;
    postTypeRequired: string;
    selectedPostType: string;
    onSelectPostType: (value: string) => void;
    options: PostTypeButtonOption[];
    pillChoiceBase: string;
};

export function PostTypeSection({
    postTypeLabel,
    postTypeRequired,
    selectedPostType,
    onSelectPostType,
    options,
    pillChoiceBase,
}: PostTypeSectionProps) {
    const icons = {
        question: HelpCircle,
        quiz: ClipboardList,
        material: BookOpenCheck,
    } as const;

    const gridColsClass = options.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';

    return (
        <div className="space-y-3">
            <p className="text-base font-medium text-zinc-700">
                {postTypeLabel}
            </p>
            <div className={`grid grid-cols-1 gap-3 ${gridColsClass}`}>
                {options.map((postType) => {
                    const isSelected = selectedPostType === postType.value;
                    const Icon =
                        icons[postType.value as keyof typeof icons] ??
                        HelpCircle;

                    return (
                        <button
                            key={postType.value}
                            type="button"
                            onClick={() => onSelectPostType(postType.value)}
                            className={`${pillChoiceBase} min-h-30 flex-col items-start justify-start rounded-lg px-4 py-4 text-left ${isSelected ? postType.activeClass : postType.idleClass}`}
                            aria-pressed={isSelected}
                        >
                            <span className="flex items-center gap-2 text-base">
                                <Icon className="h-5 w-5" />
                                {postType.label}
                            </span>
                            <span className="text-xs leading-5 opacity-80">
                                {postType.description}
                            </span>
                        </button>
                    );
                })}
            </div>
            <p className="text-sm text-zinc-500">{postTypeRequired}</p>
            <input
                type="hidden"
                name="post_type"
                value={selectedPostType}
                required
            />
        </div>
    );
}

type PostTypeButtonOption = {
    value: string;
    label: string;
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
    return (
        <div className="space-y-3">
            <p className="text-base font-medium text-zinc-700">{postTypeLabel}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {options.map((postType) => {
                    const isSelected = selectedPostType === postType.value;

                    return (
                        <button
                            key={postType.value}
                            type="button"
                            onClick={() => onSelectPostType(postType.value)}
                            className={`${pillChoiceBase} ${isSelected ? postType.activeClass : postType.idleClass}`}
                            aria-pressed={isSelected}
                        >
                            {postType.label}
                        </button>
                    );
                })}
            </div>
            <p className="text-sm text-zinc-500">{postTypeRequired}</p>
            <input type="hidden" name="post_type" value={selectedPostType} required />
        </div>
    );
}

type AnonymousToggleSectionProps = {
    isAnonymous: boolean;
    onToggle: () => void;
    label: string;
    hint: string;
};

export function AnonymousToggleSection({
    isAnonymous,
    onToggle,
    label,
    hint,
}: AnonymousToggleSectionProps) {
    return (
        <div className="flex items-start gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4">
            <button
                type="button"
                role="switch"
                aria-checked={isAnonymous}
                onClick={onToggle}
                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:outline-none ${
                    isAnonymous ? 'bg-emerald-700' : 'bg-zinc-300'
                }`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                        isAnonymous ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
            <div className="min-w-0 flex-1">
                <p className="text-base font-medium text-zinc-800">{label}</p>
                <p className="mt-0.5 text-sm text-zinc-600">{hint}</p>
            </div>
        </div>
    );
}

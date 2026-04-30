type TitleInputSectionProps = {
    value: string;
    onChange: (value: string) => void;
    maxLength: number;
    label: string;
    placeholder: string;
    remainingChars: number;
    charsLeftText: string;
};

export function TitleInputSection({
    value,
    onChange,
    maxLength,
    label,
    placeholder,
    remainingChars,
    charsLeftText,
}: TitleInputSectionProps) {
    return (
        <div className="space-y-3">
            <label htmlFor="title" className="text-base font-medium text-zinc-700">
                {label}
            </label>
            <input
                id="title"
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                maxLength={maxLength}
                placeholder={placeholder}
                className="w-full rounded-xl border-0 bg-zinc-100 px-5 py-3.5 text-base text-zinc-800 transition outline-none placeholder:text-zinc-500 focus:bg-zinc-200/80 focus:ring-0"
            />
            <div className="text-right text-sm text-zinc-500">
                {remainingChars} {charsLeftText}
            </div>
        </div>
    );
}

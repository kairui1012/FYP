type LanguageOption = {
    code: string;
    label: string;
    activeClass: string;
    idleClass: string;
};

type LanguageSectionProps = {
    languageLabel: string;
    languageRequired: string;
    selectedLanguage: string;
    onSelectLanguage: (value: string) => void;
    options: LanguageOption[];
    pillChoiceBase: string;
};

export function LanguageSection({
    languageLabel,
    languageRequired,
    selectedLanguage,
    onSelectLanguage,
    options,
    pillChoiceBase,
}: LanguageSectionProps) {
    return (
        <div className="space-y-3">
            <p className="text-base font-medium text-zinc-700">{languageLabel}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {options.map((language) => {
                    const isSelected = selectedLanguage === language.code;

                    return (
                        <button
                            key={language.code}
                            type="button"
                            onClick={() => onSelectLanguage(language.code)}
                            className={`${pillChoiceBase} ${isSelected ? language.activeClass : language.idleClass}`}
                            aria-pressed={isSelected}
                        >
                            {language.label}
                        </button>
                    );
                })}
            </div>
            <p className="text-sm text-zinc-500">{languageRequired}</p>
            <input type="hidden" name="language_code" value={selectedLanguage} required />
        </div>
    );
}

import type { LucideIcon } from 'lucide-react';

type SubjectOption = {
    id: string;
    displayName: string;
    Icon: LucideIcon;
};

type SubjectSectionProps = {
    subjectLabel: string;
    subjectHint: string;
    subjectRequired: string;
    selectedLabel: string;
    tapToChooseLabel: string;
    selectedSubject: string;
    onSelectSubject: (value: string) => void;
    subjects: SubjectOption[];
    pillChoiceBase: string;
    pillChoiceActive: string;
    pillChoiceIdle: string;
};

export function SubjectSection({
    subjectLabel,
    subjectHint,
    subjectRequired,
    selectedLabel,
    tapToChooseLabel,
    selectedSubject,
    onSelectSubject,
    subjects,
    pillChoiceBase,
    pillChoiceActive,
    pillChoiceIdle,
}: SubjectSectionProps) {
    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <p className="text-base font-medium text-zinc-700">{subjectLabel}</p>
                <p className="text-sm text-zinc-500">{subjectHint}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {subjects.map((subject) => {
                    const isSelected = selectedSubject === subject.id;
                    const Icon = subject.Icon;

                    return (
                        <button
                            key={subject.id}
                            type="button"
                            onClick={() => onSelectSubject(subject.id)}
                            className={`${pillChoiceBase} justify-start text-left ${isSelected ? pillChoiceActive : pillChoiceIdle}`}
                            aria-pressed={isSelected}
                        >
                            <Icon className="h-5 w-5 mr-2 text-rose-500" />
                            <div className="flex-1 min-w-0">
                                <span className="block text-sm font-medium truncate">{subject.displayName}</span>
                                <span className="mt-1 block text-xs text-zinc-500">
                                    {isSelected ? selectedLabel : tapToChooseLabel}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
            <p className="text-sm text-zinc-500">{subjectRequired}</p>
            <input type="hidden" name="subject_id" value={selectedSubject} required />
        </div>
    );
}

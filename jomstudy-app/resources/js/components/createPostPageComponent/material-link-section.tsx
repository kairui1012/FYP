import { reactLang } from '@erag/lang-sync-inertia';
import { BookOpenCheck, Lock, Sparkles } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { LearningMaterialOption } from '../ts/features/create-post/create-post-config';

type MaterialLinkSectionProps = {
    materials: LearningMaterialOption[];
    selectedMaterialId: string;
    selectedPostType: string;
    canUseAiQuizTools: boolean;
    onSelectMaterial: (value: string) => void;
    onGenerateMaterialQuiz: () => void;
    generatingMaterialQuiz: boolean;
    materialQuizError: string | null;
};

export function MaterialLinkSection({
    materials,
    selectedMaterialId,
    selectedPostType,
    canUseAiQuizTools,
    onSelectMaterial,
    onGenerateMaterialQuiz,
    generatingMaterialQuiz,
    materialQuizError,
}: MaterialLinkSectionProps) {
    const { trans } = reactLang();
    const emptyValue = '__none__';

    if (selectedPostType !== 'quiz') {
        return null;
    }

    const selectedMaterial = materials.find(
        (material) => String(material.id) === selectedMaterialId,
    );
    const canGenerateQuiz =
        selectedPostType === 'quiz' && Boolean(selectedMaterialId);

    return (
        <section className="space-y-3 rounded-lg border-2 border-zinc-200 bg-white p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <BookOpenCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-zinc-800">
                        {trans('createPost.material_link_title')}
                    </p>
                    <p className="text-sm text-zinc-500">
                        {trans('createPost.material_link_hint')}
                    </p>
                </div>
            </div>

            <Select
                value={selectedMaterialId || emptyValue}
                onValueChange={(value) =>
                    onSelectMaterial(value === emptyValue ? '' : value)
                }
            >
                <SelectTrigger className="h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-800 focus-visible:border-emerald-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-100 [&>[data-slot=select-value]]:line-clamp-none [&>[data-slot=select-value]]:break-words [&>[data-slot=select-value]]:whitespace-normal">
                    <SelectValue
                        placeholder={trans('createPost.material_link_none')}
                    />
                </SelectTrigger>
                <SelectContent
                    className="z-50 max-w-[min(92vw,42rem)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1.5 text-popover-foreground shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                    align="start"
                >
                    <SelectItem value={emptyValue}>
                        {trans('createPost.material_link_none')}
                    </SelectItem>
                    {materials.map((material) => (
                        <SelectItem
                            key={material.id}
                            value={String(material.id)}
                        >
                            {material.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {selectedMaterial ? (
                <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
                    <span className="font-semibold text-zinc-800">
                        {selectedMaterial.publisher.name}
                    </span>{' '}
                    <span className="capitalize">
                        (
                        {trans(
                            `createPost.role_${selectedMaterial.publisher.role ?? 'teacher'}`,
                        )}
                        )
                    </span>
                    {selectedMaterial.subject?.name ? (
                        <span> - {selectedMaterial.subject.name}</span>
                    ) : null}
                </div>
            ) : null}

            {selectedPostType === 'quiz' ? (
                <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-semibold text-amber-800">
                        {trans('createPost.material_attach_quiz_title')}
                    </p>
                    <button
                        type="button"
                        onClick={onGenerateMaterialQuiz}
                        disabled={
                            !canUseAiQuizTools ||
                            !canGenerateQuiz ||
                            generatingMaterialQuiz
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-500 hover:bg-amber-100 disabled:pointer-events-none disabled:opacity-50"
                    >
                        {!canUseAiQuizTools ? (
                            <Lock className="h-4 w-4" />
                        ) : (
                            <Sparkles
                                className={`h-4 w-4 ${generatingMaterialQuiz ? 'animate-spin' : ''}`}
                            />
                        )}
                        {!canUseAiQuizTools
                            ? trans('createPost.material_quiz_ai_locked')
                            : generatingMaterialQuiz
                              ? trans('createPost.material_quiz_generating')
                              : trans('createPost.material_quiz_generate_ai')}
                    </button>
                    {!canUseAiQuizTools ? (
                        <p className="text-xs font-medium text-amber-700">
                            {trans('createPost.material_quiz_ai_locked_hint')}
                        </p>
                    ) : null}
                    {canUseAiQuizTools && !canGenerateQuiz ? (
                        <p className="text-xs font-medium text-amber-700">
                            {trans(
                                'createPost.material_quiz_select_material_hint',
                            )}
                        </p>
                    ) : null}
                    {materialQuizError ? (
                        <p className="text-xs font-medium text-red-600">
                            {materialQuizError}
                        </p>
                    ) : null}
                </div>
            ) : null}
        </section>
    );
}

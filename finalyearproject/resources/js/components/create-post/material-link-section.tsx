import { BookOpenCheck, Sparkles } from 'lucide-react';
import { reactLang } from '@erag/lang-sync-inertia';
import type { LearningMaterialOption } from './create-post-config';

type MaterialLinkSectionProps = {
    materials: LearningMaterialOption[];
    selectedMaterialId: string;
    selectedPostType: string;
    onSelectMaterial: (value: string) => void;
    onGenerateMaterialQuiz: () => void;
    generatingMaterialQuiz: boolean;
    materialQuizError: string | null;
};

export function MaterialLinkSection({
    materials,
    selectedMaterialId,
    selectedPostType,
    onSelectMaterial,
    onGenerateMaterialQuiz,
    generatingMaterialQuiz,
    materialQuizError,
}: MaterialLinkSectionProps) {
    const { trans } = reactLang();

    if (selectedPostType === 'material') {
        return null;
    }

    const selectedMaterial = materials.find(
        (material) => String(material.id) === selectedMaterialId,
    );
    const canGenerateQuiz =
        selectedPostType === 'quiz' && Boolean(selectedMaterialId);

    return (
        <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
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

            <select
                value={selectedMaterialId}
                onChange={(event) => onSelectMaterial(event.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
                <option value="">
                    {trans('createPost.material_link_none')}
                </option>
                {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                        {material.title}
                    </option>
                ))}
            </select>

            {selectedMaterial ? (
                <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
                    <span className="font-semibold text-zinc-800">
                        {selectedMaterial.publisher.name}
                    </span>{' '}
                    <span className="capitalize">
                        ({selectedMaterial.publisher.role ?? 'teacher'})
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
                        disabled={!canGenerateQuiz || generatingMaterialQuiz}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-500 hover:bg-amber-100 disabled:pointer-events-none disabled:opacity-50"
                    >
                        <Sparkles
                            className={`h-4 w-4 ${generatingMaterialQuiz ? 'animate-spin' : ''}`}
                        />
                        {generatingMaterialQuiz
                            ? trans('createPost.material_quiz_generating')
                            : trans('createPost.material_quiz_generate_ai')}
                    </button>
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

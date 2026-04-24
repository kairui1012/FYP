type SubjectExperience = {
    subject_id: number | null;
    subject_name: string | null;
    total_xp: number;
    level: number;
    xp_in_level: number;
    xp_per_level: number;
    progress_percent: number;
    completed_materials: number;
    questions_posted: number;
    quizzes_completed: number;
    quizzes_created: number;
};

type SubjectExperiencePanelProps = {
    experiences: SubjectExperience[];
    labels: {
        currentSubjectExperience: string;
        xp: string;
        level: string;
        materialsCompleted: string;
        questionsPosted: string;
        quizzesCompleted: string;
        quizzesCreated: string;
    };
    autoRotate?: boolean;
    rotateIntervalMs?: number;
};

const emptySubjectExperience: SubjectExperience = {
    subject_id: null,
    subject_name: null,
    total_xp: 0,
    level: 1,
    xp_in_level: 0,
    xp_per_level: 100,
    progress_percent: 0,
    completed_materials: 0,
    questions_posted: 0,
    quizzes_completed: 0,
    quizzes_created: 0,
};

export function SubjectExperiencePanel({
    experiences,
    labels,
    autoRotate = true,
    rotateIntervalMs = 30000,
}: SubjectExperiencePanelProps) {
    void autoRotate;
    void rotateIntervalMs;
    const items = experiences.length > 0 ? experiences : [emptySubjectExperience];
    const active = items[0] ?? emptySubjectExperience;

    return (
        <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-linear-to-br from-[#f4f8ff] via-white to-[#f5f3ff] p-6 shadow-[0_24px_70px_-32px_rgba(59,130,246,0.3)] ring-1 ring-[#dbe5fb] lg:col-span-2">
            <div className="pointer-events-none absolute left-0 top-0 h-28 w-28 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="relative">
                <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 shadow-sm backdrop-blur">
                        {labels.currentSubjectExperience}
                    </div>
                    <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                        {labels.level} {active.level}
                    </div>
                </div>
                <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                            {active.total_xp} {labels.xp}
                        </h2>
                        <p className="mt-2 text-sm text-zinc-600">
                            {active.subject_name ?? labels.currentSubjectExperience}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-zinc-600 shadow-sm ring-1 ring-sky-100">
                        <p className="font-semibold text-zinc-900">
                            {active.xp_in_level}/{active.xp_per_level} XP
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            {active.progress_percent}% progress
                        </p>
                    </div>
                </div>
                <div className="mt-5 h-3 rounded-full bg-white/80 ring-1 ring-sky-100">
                    <div
                        className="h-3 rounded-full bg-linear-to-r from-sky-400 via-blue-500 to-violet-500 transition-all"
                        style={{ width: `${active.progress_percent}%` }}
                    />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/75 px-4 py-3 ring-1 ring-sky-100/80">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{labels.materialsCompleted}</p>
                        <p className="mt-2 text-xl font-bold text-zinc-900">{active.completed_materials}</p>
                    </div>
                    <div className="rounded-2xl bg-white/75 px-4 py-3 ring-1 ring-sky-100/80">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{labels.questionsPosted}</p>
                        <p className="mt-2 text-xl font-bold text-zinc-900">{active.questions_posted}</p>
                    </div>
                    <div className="rounded-2xl bg-white/75 px-4 py-3 ring-1 ring-sky-100/80">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{labels.quizzesCompleted}</p>
                        <p className="mt-2 text-xl font-bold text-zinc-900">{active.quizzes_completed}</p>
                    </div>
                    <div className="rounded-2xl bg-white/75 px-4 py-3 ring-1 ring-sky-100/80">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{labels.quizzesCreated}</p>
                        <p className="mt-2 text-xl font-bold text-zinc-900">{active.quizzes_created}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

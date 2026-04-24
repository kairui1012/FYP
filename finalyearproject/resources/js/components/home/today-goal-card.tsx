type TodayGoal = {
    target_points: number;
    earned_points: number;
    completed_lessons: number;
    progress_percent: number;
};

type TodayGoalCardProps = {
    todayGoal: TodayGoal;
    text: {
        todayGoal: string;
        achievementPoints: string;
        achievementGoal: string;
        lessonsCompleted: string;
    };
};

export function TodayGoalCard({ todayGoal, text }: TodayGoalCardProps) {
    return (
        <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-linear-to-br from-[#effbf6] via-white to-[#eef8ff] p-6 shadow-[0_24px_70px_-32px_rgba(16,185,129,0.35)] ring-1 ring-[#d6efe4]">
            <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-[#7fe3bf]/30 blur-3xl" />
            <div className="relative">
                <div className="inline-flex items-center rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700 shadow-sm backdrop-blur">
                    {text.todayGoal}
                </div>
                <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                            {todayGoal.earned_points}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-500">
                            / {todayGoal.target_points} {text.achievementPoints}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-3 py-2 text-right shadow-sm ring-1 ring-emerald-100">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            {text.achievementGoal}
                        </p>
                        <p className="text-lg font-bold text-zinc-900">
                            {todayGoal.progress_percent}%
                        </p>
                    </div>
                </div>
                <div className="mt-5 h-3 rounded-full bg-white/80 ring-1 ring-emerald-100">
                    <div
                        className="h-3 rounded-full bg-linear-to-r from-emerald-400 via-emerald-500 to-sky-500 transition-all"
                        style={{ width: `${todayGoal.progress_percent}%` }}
                    />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/75 px-4 py-3 text-sm text-zinc-600 ring-1 ring-emerald-100/80">
                    <span>{text.lessonsCompleted}</span>
                    <span className="font-semibold text-zinc-900">
                        {todayGoal.completed_lessons}
                    </span>
                </div>
            </div>
        </section>
    );
}

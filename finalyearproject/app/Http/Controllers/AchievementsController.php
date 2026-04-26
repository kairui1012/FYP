<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Models\Comment;
use App\Models\PostSave;
use App\Models\QuizMistake;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\UserProgress;
use App\Services\AchievementService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AchievementsController extends Controller
{
    public function __construct(private readonly AchievementService $achievementService)
    {
    }

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('socialAccounts:id,user_id,avatar');

        $result = $this->achievementService->syncUser($user);

        $progress = UserProgress::query()->where('user_id', $user->id)->first();

        // Live metrics computed from DB
        $liveMetrics = [
            'comments_count'   => Comment::where('user_id', $user->id)->count(),
            'saved_posts_count' => PostSave::where('user_id', $user->id)->count(),
            'mistakes_reviewed' => QuizMistake::where('user_id', $user->id)->count(),
        ];

        // Evaluate new achievements now that we have live metrics in context
        $this->achievementService->evaluateAchievements($user);

        $achievements = $this->buildAchievementsData($user, $progress, $liveMetrics);

        // Build all badges list (earned + locked) for the full badge view
        $allBadges = \App\Models\Badge::query()->orderBy('points_required')->get();
        $currentPoints = $result['points'];

        return Inertia::render('AchievementsPage', [
            // ── Legacy badge props (kept for backward compat) ─────────────
            'summary' => [
                'points'               => $currentPoints,
                'posts_count'          => $result['posts_count'],
                'likes_received_count' => $result['likes_received_count'],
                'comments_count'       => $liveMetrics['comments_count'],
                'saved_posts_count'    => $liveMetrics['saved_posts_count'],
                'mistakes_reviewed'    => $liveMetrics['mistakes_reviewed'],
            ],
            'badges' => $allBadges->map(fn ($badge) => [
                'id'              => $badge->id,
                'key'             => $badge->key,
                'name'            => $badge->name,
                'description'     => $badge->description,
                'icon'            => $badge->icon,
                'points_required' => $badge->points_required,
                'awarded_at'      => $badge->pivot?->awarded_at
                    ? (string) $badge->pivot->awarded_at
                    : null,
                'earned'          => $currentPoints >= $badge->points_required,
            ])->values(),
            'next_badge' => $result['next_badge'] ? [
                'id'              => $result['next_badge']->id,
                'key'             => $result['next_badge']->key,
                'name'            => $result['next_badge']->name,
                'description'     => $result['next_badge']->description,
                'icon'            => $result['next_badge']->icon,
                'points_required' => $result['next_badge']->points_required,
            ] : null,
            // ── Progress-based achievement props ──────────────────────────
            'achievements' => $achievements,
            'user_progress' => $progress ? [
                'total_questions_answered' => $progress->total_questions_answered,
                'total_questions_posted'   => $progress->total_questions_posted,
                'quizzes_completed'        => $progress->quizzes_completed,
                'correct_answers_count'    => $progress->correct_answers_count,
                'total_likes_received'     => $progress->total_likes_received,
                'improvement_score'        => $progress->improvement_score,
                'accuracy_pct'             => $progress->total_questions_answered > 0
                    ? (int) round(($progress->correct_answers_count / $progress->total_questions_answered) * 100)
                    : 0,
            ] : null,
        ]);
    }

    private function buildAchievementsData(User $user, ?UserProgress $progress, array $liveMetrics): array
    {
        $earned = UserAchievement::query()
            ->where('user_id', $user->id)
            ->get(['achievement_key', 'achieved_at'])
            ->keyBy('achievement_key');

        $accuracyPct = ($progress && $progress->total_questions_answered > 0)
            ? (int) round(($progress->correct_answers_count / $progress->total_questions_answered) * 100)
            : 0;

        return Achievement::query()
            ->orderBy('category')
            ->orderBy('threshold')
            ->get()
            ->map(function (Achievement $achievement) use ($progress, $earned, $accuracyPct, $liveMetrics) {
                $current    = $this->resolveMetricValue($achievement->metric, $progress, $accuracyPct, $liveMetrics);
                $userAch    = $earned->get($achievement->key);
                $progressPct = $achievement->threshold > 0
                    ? min(100, (int) round(($current / $achievement->threshold) * 100))
                    : 0;

                return [
                    'key'          => $achievement->key,
                    'category'     => $achievement->category,
                    'icon'         => $achievement->icon,
                    'threshold'    => $achievement->threshold,
                    'current'      => $current,
                    'progress_pct' => $progressPct,
                    'achieved'     => $userAch !== null,
                    'achieved_at'  => $userAch ? (string) $userAch->achieved_at : null,
                ];
            })
            ->values()
            ->all();
    }

    private function resolveMetricValue(
        string $metric,
        ?UserProgress $progress,
        int $accuracyPct,
        array $liveMetrics = []
    ): int {
        // Live metrics (computed fresh each page load)
        if (isset($liveMetrics[$metric])) {
            return (int) $liveMetrics[$metric];
        }

        if (! $progress) {
            return 0;
        }

        return match ($metric) {
            'total_questions_answered' => $progress->total_questions_answered,
            'total_questions_posted'   => $progress->total_questions_posted,
            'correct_answers_count'    => $progress->correct_answers_count,
            'quizzes_completed'        => $progress->quizzes_completed,
            'accuracy_pct'             => $accuracyPct,
            'improvement_score'        => max(0, $progress->improvement_score),
            'total_likes_received'     => $progress->total_likes_received,
            default                    => 0,
        };
    }
}

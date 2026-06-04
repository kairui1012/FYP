<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Models\Comment;
use App\Models\BookmarkItem;
use App\Models\QuizAttempt;
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

    /**
     * Display the user's achievements and badges page.
     * Syncs achievement state with DB, computes live metrics, and renders paginated view.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('socialAccounts:id,user_id,avatar');

        // Sync achievement state (points, category counts) for the current user
        $result = $this->achievementService->syncUser($user);

        // Load aggregated progress metrics (lifetime stats like Q&A count, quiz completions)
        $progress = UserProgress::query()->where('user_id', $user->id)->first();

        // Compute fresh metrics from DB (these change on every action; not cached in UserProgress)
        $liveMetrics = [
            'comments_count'   => Comment::where('user_id', $user->id)->count(),
            'saved_posts_count' => BookmarkItem::where('user_id', $user->id)->count(),
            'mistakes_reviewed' => QuizAttempt::where('user_id', $user->id)->count(),
        ];

        // Evaluate and save newly earned achievements now that live metrics are available
        $this->achievementService->evaluateAchievements($user);

        // Build full achievement list with progress/status for each
        $achievements = $this->buildAchievementsData($user, $progress, $liveMetrics);

        // Load all badges (earned and locked), sorted by point threshold
        $allBadges = \App\Models\Badge::query()->orderBy('points_required')->get();
        $currentPoints = $result['points'];

        return Inertia::render('AchievementsPage', [
            // Legacy badge system: points and counts (kept for backward compatibility)
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
            // New achievement system: category-based progress tracking
            'achievements' => $achievements,
            'user_progress' => $progress ? [
                'total_questions_answered' => $progress->total_questions_answered,
                'total_questions_posted'   => $progress->total_questions_posted,
                'total_post_posted'        => $progress->total_post_posted,
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

    /**
     * Build achievement list with current progress and earned status for each.
     * Returns all achievements ordered by category and threshold, with computed progress %.
     *
     * @param User $user
     * @param UserProgress|null $progress
     * @param array $liveMetrics Comments, bookmarks, and quiz attempts counts
     * @return array List of achievements with progress and earned status
     */
    private function buildAchievementsData(User $user, ?UserProgress $progress, array $liveMetrics): array
    {
        // Load user's earned achievements indexed by key for fast lookup
        $earned = UserAchievement::query()
            ->where('user_id', $user->id)
            ->get(['achievement_key', 'achieved_at'])
            ->keyBy('achievement_key');

        // Pre-compute accuracy % for all achievements (avoids recalc in the map)
        $accuracyPct = ($progress && $progress->total_questions_answered > 0)
            ? (int) round(($progress->correct_answers_count / $progress->total_questions_answered) * 100)
            : 0;

        return Achievement::query()
            ->orderBy('category')
            ->orderBy('threshold')
            ->get()
            ->map(function (Achievement $achievement) use ($progress, $earned, $accuracyPct, $liveMetrics) {
                // Get current metric value (live or from progress table)
                $current    = $this->resolveMetricValue($achievement->metric, $progress, $accuracyPct, $liveMetrics);
                // Check if user has already earned this achievement
                $userAch    = $earned->get($achievement->key);
                // Calculate progress towards this achievement (capped at 100%)
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

    /**
     * Resolve the current value of a metric for achievement progress calculation.
     * Priority: live metrics (freshly computed) > UserProgress table > default 0.
     *
     * @param string $metric Metric key (e.g. 'comments_count', 'accuracy_pct')
     * @param UserProgress|null $progress User's lifetime stats record
     * @param int $accuracyPct Pre-computed accuracy percentage
     * @param array $liveMetrics Live-computed metrics (comments, bookmarks, quiz attempts)
     * @return int Current metric value for the user
     */
    private function resolveMetricValue(
        string $metric,
        ?UserProgress $progress,
        int $accuracyPct,
        array $liveMetrics = []
    ): int {
        // Check live metrics first (these refresh on every page load, not cached)
        if (isset($liveMetrics[$metric])) {
            return (int) $liveMetrics[$metric];
        }

        // Fall back to UserProgress table if available
        if (! $progress) {
            return 0;
        }

        // Map metric key to UserProgress field
        return match ($metric) {
            'total_questions_answered' => $progress->total_questions_answered,
            'total_questions_posted'   => $progress->total_questions_posted,
            'total_post_posted'        => $progress->total_post_posted,
            'correct_answers_count'    => $progress->correct_answers_count,
            'quizzes_completed'        => $progress->quizzes_completed,
            'accuracy_pct'             => $accuracyPct,
            'improvement_score'        => max(0, $progress->improvement_score),
            'total_likes_received'     => $progress->total_likes_received,
            default                    => 0,
        };
    }
}

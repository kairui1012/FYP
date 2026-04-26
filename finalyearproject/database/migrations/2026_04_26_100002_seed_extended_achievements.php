<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $existing = DB::table('achievements')->pluck('key')->all();

        $newAchievements = [
            // ── Posting (new category) ───────────────────────────────────────
            [
                'key'        => 'first_post',
                'category'   => 'posting',
                'icon'       => 'PenLine',
                'metric'     => 'total_questions_posted',
                'threshold'  => 1,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'key'        => 'active_author',
                'category'   => 'posting',
                'icon'       => 'FileText',
                'metric'     => 'total_questions_posted',
                'threshold'  => 20,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'key'        => 'prolific_poster',
                'category'   => 'posting',
                'icon'       => 'Library',
                'metric'     => 'total_questions_posted',
                'threshold'  => 50,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // ── Commenting (new category) ────────────────────────────────────
            [
                'key'        => 'first_comment',
                'category'   => 'commenting',
                'icon'       => 'MessageCircle',
                'metric'     => 'comments_count',
                'threshold'  => 1,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'key'        => 'discussion_starter',
                'category'   => 'commenting',
                'icon'       => 'MessageSquare',
                'metric'     => 'comments_count',
                'threshold'  => 10,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'key'        => 'community_voice',
                'category'   => 'commenting',
                'icon'       => 'MessagesSquare',
                'metric'     => 'comments_count',
                'threshold'  => 50,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // ── Saving (new category) ────────────────────────────────────────
            [
                'key'        => 'collector',
                'category'   => 'saving',
                'icon'       => 'Bookmark',
                'metric'     => 'saved_posts_count',
                'threshold'  => 5,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'key'        => 'bookworm',
                'category'   => 'saving',
                'icon'       => 'BookMarked',
                'metric'     => 'saved_posts_count',
                'threshold'  => 20,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // ── Mistakes (new category) ──────────────────────────────────────
            [
                'key'        => 'mistake_hunter',
                'category'   => 'mistakes',
                'icon'       => 'Search',
                'metric'     => 'mistakes_reviewed',
                'threshold'  => 5,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'key'        => 'deep_learner',
                'category'   => 'mistakes',
                'icon'       => 'Brain',
                'metric'     => 'mistakes_reviewed',
                'threshold'  => 25,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // ── Extended Question ────────────────────────────────────────────
            [
                'key'        => 'quiz_veteran',
                'category'   => 'question',
                'icon'       => 'Zap',
                'metric'     => 'total_questions_answered',
                'threshold'  => 50,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'key'        => 'quiz_legend',
                'category'   => 'question',
                'icon'       => 'Flame',
                'metric'     => 'total_questions_answered',
                'threshold'  => 100,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // ── Extended Performance ─────────────────────────────────────────
            [
                'key'        => 'perfect_scorer',
                'category'   => 'performance',
                'icon'       => 'Star',
                'metric'     => 'accuracy_pct',
                'threshold'  => 90,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'key'        => 'quiz_completionist',
                'category'   => 'performance',
                'icon'       => 'CheckCircle2',
                'metric'     => 'quizzes_completed',
                'threshold'  => 10,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // ── Extended Community ───────────────────────────────────────────
            [
                'key'        => 'community_star',
                'category'   => 'community',
                'icon'       => 'Heart',
                'metric'     => 'total_likes_received',
                'threshold'  => 200,
                'created_at' => now(), 'updated_at' => now(),
            ],
        ];

        foreach ($newAchievements as $achievement) {
            if (! in_array($achievement['key'], $existing, true)) {
                DB::table('achievements')->insert($achievement);
            }
        }
    }

    public function down(): void
    {
        $keys = [
            'first_post', 'active_author', 'prolific_poster',
            'first_comment', 'discussion_starter', 'community_voice',
            'collector', 'bookworm',
            'mistake_hunter', 'deep_learner',
            'quiz_veteran', 'quiz_legend',
            'perfect_scorer', 'quiz_completionist',
            'community_star',
        ];

        DB::table('achievements')->whereIn('key', $keys)->delete();
    }
};

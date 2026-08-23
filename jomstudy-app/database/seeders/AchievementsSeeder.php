<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AchievementsSeeder extends Seeder
{
    public function run(): void
    {
        $achievements = [
            // ── Question-based ───────────────────────────────────────────────
            [
                'key'       => 'active_learner',
                'category'  => 'question',
                'icon'      => 'BookOpen',
                'metric'    => 'total_questions_answered',
                'threshold' => 10,
            ],
            [
                'key'       => 'curious_mind',
                'category'  => 'question',
                'icon'      => 'HelpCircle',
                'metric'    => 'total_questions_posted',
                'threshold' => 5,
            ],
            [
                'key'       => 'quiz_veteran',
                'category'  => 'question',
                'icon'      => 'Zap',
                'metric'    => 'total_questions_answered',
                'threshold' => 50,
            ],
            [
                'key'       => 'quiz_legend',
                'category'  => 'question',
                'icon'      => 'Flame',
                'metric'    => 'total_questions_answered',
                'threshold' => 100,
            ],
            // ── Performance ──────────────────────────────────────────────────
            [
                'key'       => 'quiz_master',
                'category'  => 'performance',
                'icon'      => 'GraduationCap',
                'metric'    => 'correct_answers_count',
                'threshold' => 20,
            ],
            [
                'key'       => 'high_accuracy',
                'category'  => 'performance',
                'icon'      => 'Target',
                'metric'    => 'accuracy_pct',
                'threshold' => 80,
            ],
            [
                'key'       => 'perfect_scorer',
                'category'  => 'performance',
                'icon'      => 'Star',
                'metric'    => 'accuracy_pct',
                'threshold' => 90,
            ],
            // ── Community ────────────────────────────────────────────────────
            [
                'key'       => 'helpful_contributor',
                'category'  => 'community',
                'icon'      => 'ThumbsUp',
                'metric'    => 'total_likes_received',
                'threshold' => 10,
            ],
            [
                'key'       => 'top_contributor',
                'category'  => 'community',
                'icon'      => 'Award',
                'metric'    => 'total_likes_received',
                'threshold' => 50,
            ],
            [
                'key'       => 'community_star',
                'category'  => 'community',
                'icon'      => 'Heart',
                'metric'    => 'total_likes_received',
                'threshold' => 200,
            ],
            // ── Posting ──────────────────────────────────────────────────────
            [
                'key'       => 'first_post',
                'category'  => 'posting',
                'icon'      => 'PenLine',
                'metric'    => 'total_post_posted',
                'threshold' => 1,
            ],
            [
                'key'       => 'active_author',
                'category'  => 'posting',
                'icon'      => 'FileText',
                'metric'    => 'total_post_posted',
                'threshold' => 20,
            ],
            [
                'key'       => 'prolific_poster',
                'category'  => 'posting',
                'icon'      => 'Library',
                'metric'    => 'total_post_posted',
                'threshold' => 50,
            ],
            // ── Commenting ───────────────────────────────────────────────────
            [
                'key'       => 'first_comment',
                'category'  => 'commenting',
                'icon'      => 'MessageCircle',
                'metric'    => 'comments_count',
                'threshold' => 1,
            ],
            [
                'key'       => 'discussion_starter',
                'category'  => 'commenting',
                'icon'      => 'MessageSquare',
                'metric'    => 'comments_count',
                'threshold' => 10,
            ],
            [
                'key'       => 'community_voice',
                'category'  => 'commenting',
                'icon'      => 'MessagesSquare',
                'metric'    => 'comments_count',
                'threshold' => 50,
            ],
            // ── Saving ───────────────────────────────────────────────────────
            [
                'key'       => 'collector',
                'category'  => 'saving',
                'icon'      => 'Bookmark',
                'metric'    => 'saved_posts_count',
                'threshold' => 5,
            ],
            [
                'key'       => 'bookworm',
                'category'  => 'saving',
                'icon'      => 'BookMarked',
                'metric'    => 'saved_posts_count',
                'threshold' => 20,
            ],
            // ── Mistakes ─────────────────────────────────────────────────────
            [
                'key'       => 'mistake_hunter',
                'category'  => 'mistakes',
                'icon'      => 'Search',
                'metric'    => 'mistakes_reviewed',
                'threshold' => 5,
            ],
            [
                'key'       => 'deep_learner',
                'category'  => 'mistakes',
                'icon'      => 'Brain',
                'metric'    => 'mistakes_reviewed',
                'threshold' => 25,
            ],
        ];

        foreach ($achievements as $achievement) {
            DB::table('achievements')->updateOrInsert(
                ['key' => $achievement['key']],
                array_merge($achievement, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]),
            );
        }
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('category'); // question | performance | improvement | community
            $table->string('icon');     // Lucide icon name used on the frontend
            // The user_progress column (or derived metric) that drives the progress bar
            $table->string('metric');
            $table->unsignedInteger('threshold');
            $table->timestamps();
        });

        DB::table('achievements')->insert([
            // ── Question-based ───────────────────────────────────────────────
            [
                'key'       => 'active_learner',
                'category'  => 'question',
                'icon'      => 'BookOpen',
                'metric'    => 'total_questions_answered',
                'threshold' => 10,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'key'       => 'curious_mind',
                'category'  => 'question',
                'icon'      => 'HelpCircle',
                'metric'    => 'total_questions_posted',
                'threshold' => 5,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // ── Performance ──────────────────────────────────────────────────
            [
                'key'       => 'quiz_master',
                'category'  => 'performance',
                'icon'      => 'GraduationCap',
                'metric'    => 'correct_answers_count',
                'threshold' => 20,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'key'       => 'high_accuracy',
                'category'  => 'performance',
                'icon'      => 'Target',
                // accuracy_pct is calculated from correct_answers_count / total_questions_answered
                'metric'    => 'accuracy_pct',
                'threshold' => 80,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // ── Improvement ──────────────────────────────────────────────────
            [
                'key'       => 'fast_improver',
                'category'  => 'improvement',
                'icon'      => 'TrendingUp',
                'metric'    => 'improvement_score',
                'threshold' => 20,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'key'       => 'consistent_growth',
                'category'  => 'improvement',
                'icon'      => 'BarChart2',
                'metric'    => 'improvement_score',
                'threshold' => 10,
                'created_at' => now(), 'updated_at' => now(),
            ],
            // ── Community ────────────────────────────────────────────────────
            [
                'key'       => 'helpful_contributor',
                'category'  => 'community',
                'icon'      => 'ThumbsUp',
                'metric'    => 'total_likes_received',
                'threshold' => 10,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'key'       => 'top_contributor',
                'category'  => 'community',
                'icon'      => 'Award',
                'metric'    => 'total_likes_received',
                'threshold' => 50,
                'created_at' => now(), 'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('achievements');
    }
};

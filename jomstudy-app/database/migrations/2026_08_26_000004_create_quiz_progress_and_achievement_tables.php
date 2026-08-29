<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_completions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('post_id');
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'post_id']);
            $table->index(['user_id', 'subject_id']);
            $table->index('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('post_id')->references('id')->on('posts')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->nullOnDelete();
        });

        Schema::create('quiz_mistakes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('post_id');
            $table->unsignedInteger('question_index')->default(0);
            $table->unsignedInteger('selected_answer_index');
            $table->boolean('is_correct')->default(false);
            $table->timestamp('attempted_at');
            $table->timestamps();

            $table->unique(['user_id', 'post_id', 'question_index']);
            $table->index(['user_id', 'attempted_at']);
            $table->index(['user_id', 'is_correct', 'attempted_at']);
            $table->index('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('post_id')->references('id')->on('posts')->cascadeOnDelete();
        });

        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->string('description');
            $table->string('icon')->nullable();
            $table->unsignedInteger('points_required');
            $table->timestamps();
        });

        Schema::create('badge_user', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('badge_id');
            $table->timestamp('awarded_at');
            $table->timestamps();

            $table->unique(['user_id', 'badge_id']);
            $table->index('badge_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('badge_id')->references('id')->on('badges')->cascadeOnDelete();
        });

        Schema::create('user_featured_badges', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('badge_id');
            $table->timestamps();

            $table->unique(['user_id', 'badge_id']);
            $table->index('badge_id');
            $table->index('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('badge_id')->references('id')->on('badges')->cascadeOnDelete();
        });

        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('category');
            $table->string('icon');
            $table->string('metric');
            $table->unsignedInteger('threshold');
            $table->timestamps();
        });

        Schema::create('user_achievements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('achievement_key');
            $table->timestamp('achieved_at');
            $table->timestamps();

            $table->unique(['user_id', 'achievement_key']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('user_progress', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->unsignedInteger('total_questions_answered')->default(0);
            $table->unsignedInteger('total_questions_posted')->default(0);
            $table->unsignedInteger('quizzes_completed')->default(0);
            $table->unsignedInteger('correct_answers_count')->default(0);
            $table->unsignedInteger('total_likes_received')->default(0);
            $table->json('quiz_scores')->nullable();
            $table->integer('improvement_score')->default(0);
            $table->unsignedInteger('total_post_posted')->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('points_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->integer('points');
            $table->string('action');
            $table->string('source_type');
            $table->unsignedBigInteger('source_id');
            $table->timestamps();

            $table->index(['source_type', 'source_id']);
            $table->index(['user_id', 'created_at']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('points_transactions');
        Schema::dropIfExists('user_progress');
        Schema::dropIfExists('user_achievements');
        Schema::dropIfExists('achievements');
        Schema::dropIfExists('user_featured_badges');
        Schema::dropIfExists('badge_user');
        Schema::dropIfExists('badges');
        Schema::dropIfExists('quiz_mistakes');
        Schema::dropIfExists('quiz_completions');
    }
};

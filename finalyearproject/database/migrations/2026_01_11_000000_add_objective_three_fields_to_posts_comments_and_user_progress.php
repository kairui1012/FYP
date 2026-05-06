<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add objective 3 learning support fields
        Schema::table('posts', function (Blueprint $table) {
            $table->boolean('is_discussion')->default(false)->after('post_type');
            $table->string('difficulty_level')->nullable()->after('is_discussion'); // easy, medium, hard
            $table->json('learning_objectives')->nullable()->after('difficulty_level');
        });

        // Add objective 3 fields to comments for Q&A support
        Schema::table('comments', function (Blueprint $table) {
            $table->boolean('is_answer')->default(false)->after('content');
            $table->boolean('is_accepted')->default(false)->after('is_answer');
        });

        // Add objective 3 fields to user_progress for learning tracking
        Schema::table('user_progress', function (Blueprint $table) {
            $table->integer('discussion_posts_created')->default(0)->after('total_post_posted');
            $table->integer('questions_answered')->default(0)->after('discussion_posts_created');
            $table->integer('accepted_answers_count')->default(0)->after('questions_answered');
        });
    }

    public function down(): void
    {
        Schema::table('user_progress', function (Blueprint $table) {
            $table->dropColumn(['discussion_posts_created', 'questions_answered', 'accepted_answers_count']);
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn(['is_answer', 'is_accepted']);
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['is_discussion', 'difficulty_level', 'learning_objectives']);
        });
    }
};

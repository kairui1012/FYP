<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add objective 3 learning support fields
        if (Schema::hasTable('posts')) {
            Schema::table('posts', function (Blueprint $table) {
                if (! Schema::hasColumn('posts', 'is_discussion')) {
                    $table->boolean('is_discussion')->default(false)->after('post_type');
                }
                if (! Schema::hasColumn('posts', 'difficulty_level')) {
                    $table->string('difficulty_level')->nullable()->after('is_discussion'); // easy, medium, hard
                }
                if (! Schema::hasColumn('posts', 'learning_objectives')) {
                    $table->json('learning_objectives')->nullable()->after('difficulty_level');
                }
            });
        }

        // Add objective 3 fields to comments for Q&A support
        if (Schema::hasTable('comments')) {
            Schema::table('comments', function (Blueprint $table) {
                if (! Schema::hasColumn('comments', 'is_answer')) {
                    $table->boolean('is_answer')->default(false)->after('content');
                }
                if (! Schema::hasColumn('comments', 'is_accepted')) {
                    $table->boolean('is_accepted')->default(false)->after('is_answer');
                }
            });
        }

        // Add objective 3 fields to user_progress for learning tracking
        if (Schema::hasTable('user_progress')) {
            Schema::table('user_progress', function (Blueprint $table) {
                if (! Schema::hasColumn('user_progress', 'discussion_posts_created')) {
                    $table->integer('discussion_posts_created')->default(0)->after('total_post_posted');
                }
                if (! Schema::hasColumn('user_progress', 'questions_answered')) {
                    $table->integer('questions_answered')->default(0)->after('discussion_posts_created');
                }
                if (! Schema::hasColumn('user_progress', 'accepted_answers_count')) {
                    $table->integer('accepted_answers_count')->default(0)->after('questions_answered');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('user_progress')) {
            Schema::table('user_progress', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('user_progress', 'discussion_posts_created')) $columns[] = 'discussion_posts_created';
                if (Schema::hasColumn('user_progress', 'questions_answered')) $columns[] = 'questions_answered';
                if (Schema::hasColumn('user_progress', 'accepted_answers_count')) $columns[] = 'accepted_answers_count';
                if (! empty($columns)) $table->dropColumn($columns);
            });
        }

        if (Schema::hasTable('comments')) {
            Schema::table('comments', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('comments', 'is_answer')) $columns[] = 'is_answer';
                if (Schema::hasColumn('comments', 'is_accepted')) $columns[] = 'is_accepted';
                if (! empty($columns)) $table->dropColumn($columns);
            });
        }

        if (Schema::hasTable('posts')) {
            Schema::table('posts', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('posts', 'is_discussion')) $columns[] = 'is_discussion';
                if (Schema::hasColumn('posts', 'difficulty_level')) $columns[] = 'difficulty_level';
                if (Schema::hasColumn('posts', 'learning_objectives')) $columns[] = 'learning_objectives';
                if (! empty($columns)) $table->dropColumn($columns);
            });
        }
    }
};

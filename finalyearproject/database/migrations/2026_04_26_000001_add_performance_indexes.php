<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->addIndex('posts', 'post_type', 'posts_post_type_index');
        $this->addIndex('posts', 'subject_id', 'posts_subject_id_index');
        $this->addIndex('posts', ['language_id', 'post_type'], 'posts_language_post_type_index');
        $this->addIndex('posts', 'created_at', 'posts_created_at_index');

        $this->addIndex('comments', 'post_id', 'comments_post_id_index');
        $this->addIndex('comments', 'parent_id', 'comments_parent_id_index');
        $this->addIndex('comments', ['post_id', 'created_at'], 'comments_post_created_index');

        $this->addIndex('comment_likes', 'comment_id', 'comment_likes_comment_id_index');
        $this->addIndex('comment_likes', 'user_id', 'comment_likes_user_id_index');
        $this->addIndex('comment_likes', ['user_id', 'comment_id'], 'comment_likes_user_comment_unique', unique: true);

        $this->addIndex('likes', 'post_id', 'likes_post_id_index');
        $this->addIndex('likes', 'user_id', 'likes_user_id_index');
        $this->addIndex('likes', ['user_id', 'post_id'], 'likes_user_post_unique', unique: true);

        $this->addIndex('bookmark_items', 'user_id', 'bookmark_items_user_id_index');
        $this->addIndex('bookmark_items', 'post_id', 'bookmark_items_post_id_index');

        $this->addIndex('quiz_completions', 'user_id', 'quiz_completions_user_id_index');
        $this->addIndex('quiz_completions', 'post_id', 'quiz_completions_post_id_index');
        $this->addIndex('quiz_completions', 'subject_id', 'quiz_completions_subject_id_index');

        $this->addIndex('quiz_mistakes', 'user_id', 'quiz_mistakes_user_id_index');
        $this->addIndex('quiz_mistakes', 'post_id', 'quiz_mistakes_post_id_index');

        $this->addIndex('follows', 'follower_id', 'follows_follower_id_index');
        $this->addIndex('follows', 'following_id', 'follows_following_id_index');
        $this->addIndex('follows', ['follower_id', 'following_id'], 'follows_follower_following_unique', unique: true);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropIndex('posts', 'posts_post_type_index');
        $this->dropIndex('posts', 'posts_subject_id_index');
        $this->dropIndex('posts', 'posts_language_post_type_index');
        $this->dropIndex('posts', 'posts_created_at_index');

        $this->dropIndex('comments', 'comments_post_id_index');
        $this->dropIndex('comments', 'comments_parent_id_index');
        $this->dropIndex('comments', 'comments_post_created_index');

        $this->dropIndex('comment_likes', 'comment_likes_comment_id_index');
        $this->dropIndex('comment_likes', 'comment_likes_user_id_index');
        $this->dropIndex('comment_likes', 'comment_likes_user_comment_unique', unique: true);

        $this->dropIndex('likes', 'likes_post_id_index');
        $this->dropIndex('likes', 'likes_user_id_index');
        $this->dropIndex('likes', 'likes_user_post_unique', unique: true);

        $this->dropIndex('bookmark_items', 'bookmark_items_user_id_index');
        $this->dropIndex('bookmark_items', 'bookmark_items_post_id_index');

        $this->dropIndex('quiz_completions', 'quiz_completions_user_id_index');
        $this->dropIndex('quiz_completions', 'quiz_completions_post_id_index');
        $this->dropIndex('quiz_completions', 'quiz_completions_subject_id_index');

        $this->dropIndex('quiz_mistakes', 'quiz_mistakes_user_id_index');
        $this->dropIndex('quiz_mistakes', 'quiz_mistakes_post_id_index');

        $this->dropIndex('follows', 'follows_follower_id_index');
        $this->dropIndex('follows', 'follows_following_id_index');
        $this->dropIndex('follows', 'follows_follower_following_unique', unique: true);
    }

    private function addIndex(string $tableName, string|array $columns, string $indexName, bool $unique = false): void
    {
        if (
            ! Schema::hasTable($tableName)
            || Schema::hasIndex($tableName, $indexName, $unique ? 'unique' : null)
            || Schema::hasIndex($tableName, (array) $columns, $unique ? 'unique' : null)
        ) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($columns, $indexName, $unique) {
            $unique
                ? $table->unique($columns, $indexName)
                : $table->index($columns, $indexName);
        });
    }

    private function dropIndex(string $tableName, string $indexName, bool $unique = false): void
    {
        if (! Schema::hasTable($tableName) || ! Schema::hasIndex($tableName, $indexName, $unique ? 'unique' : null)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($indexName, $unique) {
            $unique
                ? $table->dropUnique($indexName)
                : $table->dropIndex($indexName);
        });
    }
};

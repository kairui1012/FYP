<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('comments')) {
            Schema::create('comments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('post_id');
                $table->unsignedBigInteger('parent_id')->nullable();
                $table->text('content');
                $table->json('attachments')->nullable();
                $table->json('mentions')->nullable();
                $table->boolean('is_answer')->default(false);
                $table->boolean('is_accepted')->default(false);
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                $table->foreign('post_id')->references('id')->on('posts')->cascadeOnDelete();
                $table->foreign('parent_id')->references('id')->on('comments')->cascadeOnDelete();

                $table->index('user_id');
                $table->index('post_id');
                $table->index('parent_id');
                $table->index(['post_id', 'created_at']);
            });
        } else {
            Schema::table('comments', function (Blueprint $table) {
                if (! Schema::hasColumn('comments', 'parent_id')) {
                    $table->unsignedBigInteger('parent_id')->nullable()->after('post_id');
                }
                if (! Schema::hasColumn('comments', 'attachments')) {
                    $table->json('attachments')->nullable()->after('content');
                }
                if (! Schema::hasColumn('comments', 'mentions')) {
                    $table->json('mentions')->nullable()->after('attachments');
                }
                if (! Schema::hasColumn('comments', 'is_answer')) {
                    $table->boolean('is_answer')->default(false)->after('content');
                }
                if (! Schema::hasColumn('comments', 'is_accepted')) {
                    $table->boolean('is_accepted')->default(false)->after('is_answer');
                }
            });
        }

        if (! Schema::hasTable('comment_likes')) {
            Schema::create('comment_likes', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('comment_id');
                $table->smallInteger('vote')->default(1);
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                $table->foreign('comment_id')->references('id')->on('comments')->cascadeOnDelete();

                $table->unique(['user_id', 'comment_id']);
                $table->index(['comment_id', 'vote']);
            });
        } else {
            Schema::table('comment_likes', function (Blueprint $table) {
                if (! Schema::hasColumn('comment_likes', 'vote')) {
                    $table->smallInteger('vote')->default(1)->after('comment_id');
                }
            });
        }

        if (! Schema::hasTable('comment_reports')) {
            Schema::create('comment_reports', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('comment_id');
                $table->string('reason', 255)->nullable();
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                $table->foreign('comment_id')->references('id')->on('comments')->cascadeOnDelete();

                $table->unique(['user_id', 'comment_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('comment_reports');
        Schema::dropIfExists('comment_likes');
        Schema::dropIfExists('comments');
    }
};


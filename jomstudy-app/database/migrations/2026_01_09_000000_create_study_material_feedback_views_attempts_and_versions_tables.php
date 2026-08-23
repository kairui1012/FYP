<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create study_material_feedback table
        Schema::create('study_material_feedback', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('post_id');
            $table->tinyInteger('vote')->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'post_id']);
            $table->index(['post_id', 'rating']);
            $table->index(['post_id', 'vote']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('post_id')->references('id')->on('posts')->cascadeOnDelete();
        });

        // Create study_material_views table
        Schema::create('study_material_views', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('post_id');
            $table->integer('view_count')->default(1);
            $table->timestamp('last_viewed_at');
            $table->timestamps();

            $table->unique(['user_id', 'post_id']);
            $table->index(['post_id', 'view_count']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('post_id')->references('id')->on('posts')->cascadeOnDelete();
        });

        // Create material_quiz_attempts table
        Schema::create('material_quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('post_id');
            $table->unsignedBigInteger('material_id')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->unsignedInteger('total_questions')->default(1);
            $table->json('answers')->nullable();
            $table->integer('time_taken')->nullable();
            $table->boolean('passed')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'material_id']);
            $table->index(['material_id', 'created_at']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('post_id')->references('id')->on('posts')->cascadeOnDelete();
            $table->foreign('material_id')->references('id')->on('posts')->cascadeOnDelete();
        });

        // Create study_material_versions table
        Schema::create('study_material_versions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('post_id');
            $table->unsignedBigInteger('user_id');
            $table->string('title');
            $table->text('content');
            $table->json('content_blocks')->nullable();
            $table->integer('version_number');
            $table->text('change_summary')->nullable();
            $table->timestamps();

            $table->index(['post_id', 'version_number']);
            $table->foreign('post_id')->references('id')->on('posts')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('study_material_versions');
        Schema::dropIfExists('material_quiz_attempts');
        Schema::dropIfExists('study_material_views');
        Schema::dropIfExists('study_material_feedback');
    }
};

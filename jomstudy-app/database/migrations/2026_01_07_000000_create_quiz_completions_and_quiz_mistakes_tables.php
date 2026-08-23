<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create quiz_completions table
        Schema::create('quiz_completions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('post_id');
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'post_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('post_id')->references('id')->on('posts')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->nullOnDelete();
            $table->index(['user_id', 'subject_id']);
            $table->index('user_id');
        });

        // Create quiz_mistakes table
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
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('post_id')->references('id')->on('posts')->cascadeOnDelete();
            $table->index(['user_id', 'attempted_at']);
            $table->index(['user_id', 'is_correct', 'attempted_at']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_mistakes');
        Schema::dropIfExists('quiz_completions');
    }
};

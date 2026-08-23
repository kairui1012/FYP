<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create posts table
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->boolean('is_anonymous')->default(false);
            $table->string('title');
            $table->text('content');
            $table->string('post_type', 20)->default('material');
            $table->json('quiz_data')->nullable();
            $table->unsignedBigInteger('subject_id')->default(1);
            $table->unsignedBigInteger('lesson_id')->nullable();
            $table->unsignedBigInteger('language_id');
            $table->json('image')->nullable();
            $table->json('content_blocks')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->foreign('language_id')->references('id')->on('languages')->cascadeOnDelete();

            $table->index('user_id');
            $table->index('post_type');
            $table->index(['language_id', 'post_type']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};

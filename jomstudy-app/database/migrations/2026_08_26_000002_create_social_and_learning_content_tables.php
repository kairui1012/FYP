<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->string('avatar')->nullable();
            $table->text('about')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('social_accounts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('provider');
            $table->string('provider_id');
            $table->string('avatar')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'provider_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('follows', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('follower_id');
            $table->unsignedBigInteger('following_id');
            $table->timestamps();

            $table->unique(['follower_id', 'following_id']);
            $table->index('follower_id');
            $table->foreign('follower_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('following_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('title');
            $table->unsignedInteger('sequence')->default(1);
            $table->timestamps();

            $table->index(['subject_id', 'sequence']);
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
        });

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
            $table->unsignedBigInteger('parent_material_id')->nullable();
            $table->json('image')->nullable();
            $table->json('content_blocks')->nullable();
            $table->boolean('material_improved_from_feedback')->default(false);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->foreign('language_id')->references('id')->on('languages')->cascadeOnDelete();
            $table->foreign('parent_material_id')->references('id')->on('posts')->cascadeOnDelete();

            $table->index('user_id');
            $table->index('post_type');
            $table->index(['language_id', 'post_type']);
            $table->index('parent_material_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('languages');
        Schema::dropIfExists('follows');
        Schema::dropIfExists('social_accounts');
        Schema::dropIfExists('profiles');
    }
};

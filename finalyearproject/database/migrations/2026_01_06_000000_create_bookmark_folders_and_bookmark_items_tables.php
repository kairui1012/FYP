<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create bookmark_folders table
        Schema::create('bookmark_folders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('name');
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'name']);
            $table->index(['user_id', 'is_default']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // Create bookmark_items table
        Schema::create('bookmark_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('bookmark_folder_id');
            $table->unsignedBigInteger('post_id');
            $table->timestamps();

            $table->unique(['user_id', 'post_id']);
            $table->index('post_id');
            $table->index(['bookmark_folder_id', 'created_at']);
            $table->index('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('bookmark_folder_id')->references('id')->on('bookmark_folders')->cascadeOnDelete();
            $table->foreign('post_id')->references('id')->on('posts')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookmark_items');
        Schema::dropIfExists('bookmark_folders');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('likes')) {
            Schema::create('likes', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('post_id');
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                $table->foreign('post_id')->references('id')->on('posts')->cascadeOnDelete();

                $table->unique(['user_id', 'post_id']);
                $table->index('post_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('likes');
    }
};


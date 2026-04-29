<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('posts')->cascadeOnDelete();
            $table->unsignedSmallInteger('score')->default(0);
            $table->unsignedSmallInteger('total_questions')->default(1);
            $table->timestamps();

            $table->index(['material_id', 'created_at']);
            $table->index(['user_id', 'material_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_quiz_attempts');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('total_questions_answered')->default(0);
            $table->unsignedInteger('total_questions_posted')->default(0);
            $table->unsignedInteger('quizzes_completed')->default(0);
            $table->unsignedInteger('correct_answers_count')->default(0);
            $table->unsignedInteger('total_likes_received')->default(0);
            // Ordered array of 0/1 for the last 20 quiz attempts — used for trend analysis
            $table->json('quiz_scores')->nullable();
            // Pre-calculated: (recent accuracy − past accuracy) × 100, can be negative
            $table->integer('improvement_score')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_progress');
    }
};

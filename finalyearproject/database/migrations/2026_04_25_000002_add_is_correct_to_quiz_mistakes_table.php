<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_mistakes', function (Blueprint $table) {
            $table->boolean('is_correct')->default(false)->after('selected_answer_index');
            $table->index(['user_id', 'is_correct', 'attempted_at']);
        });
    }

    public function down(): void
    {
        Schema::table('quiz_mistakes', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_correct', 'attempted_at']);
            $table->dropColumn('is_correct');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('material_quiz_attempts')) {
            return;
        }

        Schema::table('material_quiz_attempts', function (Blueprint $table) {
            if (! Schema::hasColumn('material_quiz_attempts', 'total_questions')) {
                $table->unsignedInteger('total_questions')
                    ->default(1)
                    ->after('score');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('material_quiz_attempts')) {
            return;
        }

        Schema::table('material_quiz_attempts', function (Blueprint $table) {
            if (Schema::hasColumn('material_quiz_attempts', 'total_questions')) {
                $table->dropColumn('total_questions');
            }
        });
    }
};

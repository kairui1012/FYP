<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('lesson_progress')) {
            return;
        }

        if (! Schema::hasColumn('lesson_progress', 'last_viewed_at')) {
            Schema::table('lesson_progress', function (Blueprint $table) {
                $table->timestamp('last_viewed_at')->nullable()->after('completed_at');
            });
        }

        DB::statement('UPDATE lesson_progress SET last_viewed_at = COALESCE(last_viewed_at, completed_at, updated_at, created_at)');
    }

    public function down(): void
    {
        if (! Schema::hasTable('lesson_progress')) {
            return;
        }

        if (Schema::hasColumn('lesson_progress', 'last_viewed_at')) {
            Schema::table('lesson_progress', function (Blueprint $table) {
                $table->dropColumn('last_viewed_at');
            });
        }
    }
};

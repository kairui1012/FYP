<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('teacher_applications')) {
            return;
        }

        Schema::table('teacher_applications', function (Blueprint $table) {
            if (! Schema::hasColumn('teacher_applications', 'qualification')) {
                $table->string('qualification')->nullable()->after('user_id');
            }

            if (! Schema::hasColumn('teacher_applications', 'bio')) {
                $table->text('bio')->nullable()->after('qualification');
            }

            if (! Schema::hasColumn('teacher_applications', 'admin_note')) {
                $table->text('admin_note')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('teacher_applications')) {
            return;
        }

        Schema::table('teacher_applications', function (Blueprint $table) {
            if (Schema::hasColumn('teacher_applications', 'admin_note')) {
                $table->dropColumn('admin_note');
            }

            if (Schema::hasColumn('teacher_applications', 'bio')) {
                $table->dropColumn('bio');
            }

            if (Schema::hasColumn('teacher_applications', 'qualification')) {
                $table->dropColumn('qualification');
            }
        });
    }
};


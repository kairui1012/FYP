<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('comment_reports')) {
            return;
        }

        Schema::table('comment_reports', function (Blueprint $table) {
            if (! Schema::hasColumn('comment_reports', 'status')) {
                $table->string('status', 32)->default('pending')->after('reason');
                $table->index(['status', 'created_at']);
            }

            if (! Schema::hasColumn('comment_reports', 'moderation_queued_at')) {
                $table->timestamp('moderation_queued_at')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('comment_reports')) {
            return;
        }

        Schema::table('comment_reports', function (Blueprint $table) {
            if (Schema::hasColumn('comment_reports', 'moderation_queued_at')) {
                $table->dropColumn('moderation_queued_at');
            }

            if (Schema::hasColumn('comment_reports', 'status')) {
                $table->dropIndex('comment_reports_status_created_at_index');
                $table->dropColumn('status');
            }
        });
    }
};


<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('teacher_verification_documents')) {
            return;
        }

        Schema::table('teacher_verification_documents', function (Blueprint $table) {
            if (! Schema::hasColumn('teacher_verification_documents', 'teacher_application_id')) {
                $table->unsignedBigInteger('teacher_application_id')->nullable()->after('id');
            }

            if (! Schema::hasColumn('teacher_verification_documents', 'path')) {
                $table->string('path')->nullable()->after('teacher_application_id');
            }

            if (! Schema::hasColumn('teacher_verification_documents', 'original_name')) {
                $table->string('original_name')->nullable()->after('path');
            }
        });

        // Backfill new columns from legacy schema where possible.
        if (Schema::hasColumn('teacher_verification_documents', 'path')
            && Schema::hasColumn('teacher_verification_documents', 'file_path')) {
            DB::table('teacher_verification_documents')
                ->whereNull('path')
                ->whereNotNull('file_path')
                ->update(['path' => DB::raw('file_path')]);
        }

        if (Schema::hasColumn('teacher_verification_documents', 'original_name')
            && Schema::hasColumn('teacher_verification_documents', 'file_path')) {
            $docs = DB::table('teacher_verification_documents')
                ->select(['id', 'file_path'])
                ->whereNull('original_name')
                ->whereNotNull('file_path')
                ->get();

            foreach ($docs as $doc) {
                $filePath = (string) $doc->file_path;
                $basename = basename($filePath);

                DB::table('teacher_verification_documents')
                    ->where('id', $doc->id)
                    ->update(['original_name' => $basename !== '' ? $basename : 'document']);
            }
        }

        if (Schema::hasColumn('teacher_verification_documents', 'teacher_application_id')
            && Schema::hasColumn('teacher_verification_documents', 'user_id')) {
            $docs = DB::table('teacher_verification_documents as d')
                ->select(['d.id', 'd.user_id'])
                ->whereNull('d.teacher_application_id')
                ->whereNotNull('d.user_id')
                ->get();

            foreach ($docs as $doc) {
                $applicationId = DB::table('teacher_applications')
                    ->where('user_id', $doc->user_id)
                    ->orderByDesc('id')
                    ->value('id');

                if ($applicationId) {
                    DB::table('teacher_verification_documents')
                        ->where('id', $doc->id)
                        ->update(['teacher_application_id' => $applicationId]);
                }
            }
        }

        Schema::table('teacher_verification_documents', function (Blueprint $table) {
            if (Schema::hasColumn('teacher_verification_documents', 'teacher_application_id')) {
                $table->index('teacher_application_id', 'tvd_teacher_application_id_index');

                $table->foreign('teacher_application_id', 'tvd_teacher_application_id_fk')
                    ->references('id')
                    ->on('teacher_applications')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('teacher_verification_documents')) {
            return;
        }

        Schema::table('teacher_verification_documents', function (Blueprint $table) {
            if (Schema::hasColumn('teacher_verification_documents', 'teacher_application_id')) {
                try {
                    $table->dropForeign('tvd_teacher_application_id_fk');
                } catch (\Throwable $e) {
                    // Ignore if foreign key does not exist.
                }

                try {
                    $table->dropIndex('tvd_teacher_application_id_index');
                } catch (\Throwable $e) {
                    // Ignore if index does not exist.
                }

                $table->dropColumn('teacher_application_id');
            }

            if (Schema::hasColumn('teacher_verification_documents', 'original_name')) {
                $table->dropColumn('original_name');
            }

            if (Schema::hasColumn('teacher_verification_documents', 'path')) {
                $table->dropColumn('path');
            }
        });
    }
};


<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_applications', function (Blueprint $table) {
            $table->string('document_path')->nullable()->after('bio');
            $table->string('document_original_name')->nullable()->after('document_path');
            // make qualification nullable since file is the main proof
            $table->string('qualification')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('teacher_applications', function (Blueprint $table) {
            $table->dropColumn(['document_path', 'document_original_name']);
        });
    }
};

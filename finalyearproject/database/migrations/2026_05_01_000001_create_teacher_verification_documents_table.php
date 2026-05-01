<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_verification_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_application_id')
                ->constrained('teacher_applications')
                ->cascadeOnDelete();
            $table->string('path');
            $table->string('original_name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_verification_documents');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('qualification')->nullable();
            $table->text('bio')->nullable();
            $table->string('status')->default('pending');
            $table->text('reason')->nullable();
            $table->text('admin_note')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('teacher_verification_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('teacher_application_id')->nullable();
            $table->string('path')->nullable();
            $table->string('original_name')->nullable();
            $table->string('status')->default('pending');
            $table->text('verification_notes')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index('teacher_application_id', 'tvd_teacher_application_id_index');
            $table->foreign('teacher_application_id', 'tvd_teacher_application_id_fk')
                ->references('id')
                ->on('teacher_applications')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_verification_documents');
        Schema::dropIfExists('teacher_applications');
    }
};

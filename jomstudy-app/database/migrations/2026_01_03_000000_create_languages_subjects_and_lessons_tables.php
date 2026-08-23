<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create languages table
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->timestamps();
        });

        // Create subjects table
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // Create lessons table
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedBigInteger('source_post_id')->nullable();
            $table->string('title');
            $table->unsignedInteger('sequence')->default(1);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->unique('source_post_id');
            $table->index(['subject_id', 'sequence']);
            $table->index(['subject_id', 'is_published']);
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
            // Note: source_post_id foreign key will be added in a separate migration after posts table exists
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('languages');
    }
};

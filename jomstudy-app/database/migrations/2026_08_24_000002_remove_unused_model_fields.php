<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropForeign(['source_post_id']);
            $table->dropUnique(['source_post_id']);
            $table->dropIndex(['subject_id', 'is_published']);
            $table->dropColumn(['source_post_id', 'is_published']);
        });

        Schema::table('teacher_verification_documents', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropIndex(['user_id', 'status']);
            $table->dropColumn(['user_id', 'file_path', 'document_type']);
        });

        Schema::table('posts', fn (Blueprint $table) => $table->dropColumn([
            'attachments', 'is_discussion', 'difficulty_level', 'learning_objectives',
        ]));
        Schema::table('comments', fn (Blueprint $table) => $table->dropColumn(['is_answer', 'is_accepted']));
        Schema::table('user_progress', fn (Blueprint $table) => $table->dropColumn([
            'discussion_posts_created', 'questions_answered', 'accepted_answers_count',
        ]));
        Schema::table('material_quiz_attempts', fn (Blueprint $table) => $table->dropColumn([
            'answers', 'time_taken', 'passed',
        ]));
        Schema::table('teacher_applications', fn (Blueprint $table) => $table->dropColumn([
            'document_path', 'document_original_name',
        ]));
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->json('attachments')->nullable();
            $table->boolean('is_discussion')->default(false);
            $table->string('difficulty_level')->nullable();
            $table->json('learning_objectives')->nullable();
        });
        Schema::table('comments', function (Blueprint $table) {
            $table->boolean('is_answer')->default(false);
            $table->boolean('is_accepted')->default(false);
        });
        Schema::table('user_progress', function (Blueprint $table) {
            $table->integer('discussion_posts_created')->default(0);
            $table->integer('questions_answered')->default(0);
            $table->integer('accepted_answers_count')->default(0);
        });
        Schema::table('material_quiz_attempts', function (Blueprint $table) {
            $table->json('answers')->nullable();
            $table->integer('time_taken')->nullable();
            $table->boolean('passed')->default(false);
        });
        Schema::table('teacher_applications', function (Blueprint $table) {
            $table->string('document_path')->nullable();
            $table->string('document_original_name')->nullable();
        });
        Schema::table('teacher_verification_documents', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('file_path')->nullable();
            $table->string('document_type')->nullable();
        });

        DB::table('teacher_verification_documents')->update(['file_path' => DB::raw('path')]);
        DB::table('teacher_verification_documents as documents')
            ->join('teacher_applications as applications', 'applications.id', '=', 'documents.teacher_application_id')
            ->update(['documents.user_id' => DB::raw('applications.user_id')]);

        Schema::table('teacher_verification_documents', function (Blueprint $table) {
            $table->index(['user_id', 'status']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
        Schema::table('lessons', function (Blueprint $table) {
            $table->unsignedBigInteger('source_post_id')->nullable();
            $table->boolean('is_published')->default(true);
            $table->unique('source_post_id');
            $table->index(['subject_id', 'is_published']);
            $table->foreign('source_post_id')->references('id')->on('posts')->nullOnDelete();
        });
    }
};

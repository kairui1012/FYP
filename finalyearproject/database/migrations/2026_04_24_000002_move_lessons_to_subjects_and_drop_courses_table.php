<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lessons') && ! Schema::hasColumn('lessons', 'subject_id')) {
            Schema::table('lessons', function (Blueprint $table) {
                $table->foreignId('subject_id')->nullable()->after('id');
            });
        }

        if (
            Schema::hasTable('courses')
            && Schema::hasColumn('courses', 'subject_id')
            && Schema::hasTable('lessons')
            && Schema::hasColumn('lessons', 'course_id')
        ) {
            DB::table('lessons')
                ->whereNotNull('course_id')
                ->update([
                    'subject_id' => DB::raw('(select courses.subject_id from courses where courses.id = lessons.course_id)'),
                ]);
        }

        if (Schema::hasTable('lessons') && Schema::hasColumn('lessons', 'course_id')) {
            Schema::table('lessons', function (Blueprint $table) {
                $table->dropForeign(['course_id']);
            });

            Schema::table('lessons', function (Blueprint $table) {
                $table->dropIndex(['course_id', 'sequence']);
                $table->dropIndex(['course_id', 'is_published']);
            });

            Schema::table('lessons', function (Blueprint $table) {
                $table->dropColumn('course_id');
            });
        }

        if (Schema::hasTable('courses')) {
            Schema::dropIfExists('courses');
        }

        if (Schema::hasTable('lessons') && Schema::hasColumn('lessons', 'subject_id')) {
            Schema::table('lessons', function (Blueprint $table) {
                $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
                $table->index(['subject_id', 'sequence']);
                $table->index(['subject_id', 'is_published']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('lessons') && Schema::hasColumn('lessons', 'subject_id')) {
            Schema::table('lessons', function (Blueprint $table) {
                $table->dropForeign(['subject_id']);
                $table->dropIndex(['subject_id', 'sequence']);
                $table->dropIndex(['subject_id', 'is_published']);
            });
        }

        if (! Schema::hasTable('courses')) {
            Schema::create('courses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['subject_id', 'is_active']);
                $table->unique('subject_id');
            });
        }

        if (Schema::hasTable('lessons') && ! Schema::hasColumn('lessons', 'course_id')) {
            Schema::table('lessons', function (Blueprint $table) {
                $table->foreignId('course_id')->nullable()->after('id');
            });
        }

        if (Schema::hasTable('lessons') && Schema::hasTable('courses')) {
            DB::table('courses')
                ->insertUsing([
                    'subject_id',
                    'title',
                    'description',
                    'is_active',
                    'created_at',
                    'updated_at',
                ], DB::table('subjects')
                    ->selectRaw('id as subject_id, name as title, NULL as description, 1 as is_active, NOW() as created_at, NOW() as updated_at'));

            DB::table('lessons')
                ->join('courses', 'courses.subject_id', '=', 'lessons.subject_id')
                ->update(['lessons.course_id' => DB::raw('courses.id')]);
        }

        if (Schema::hasTable('lessons') && Schema::hasColumn('lessons', 'subject_id')) {
            Schema::table('lessons', function (Blueprint $table) {
                $table->dropColumn('subject_id');
            });
        }

        if (Schema::hasTable('lessons') && Schema::hasColumn('lessons', 'course_id')) {
            Schema::table('lessons', function (Blueprint $table) {
                $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
                $table->index(['course_id', 'sequence']);
                $table->index(['course_id', 'is_published']);
            });
        }
    }
};

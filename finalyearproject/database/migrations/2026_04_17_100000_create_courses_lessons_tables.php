<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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

        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('source_post_id')->nullable()->constrained('posts')->nullOnDelete();
            $table->string('title');
            $table->unsignedInteger('sequence')->default(1);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['course_id', 'sequence']);
            $table->index(['course_id', 'is_published']);
            $table->unique('source_post_id');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->foreignId('lesson_id')
                ->nullable()
                ->after('subject_id')
                ->constrained('lessons')
                ->nullOnDelete();
        });

        $now = now();

        $subjects = DB::table('subjects')
            ->select('id', 'name')
            ->orderBy('id')
            ->get();

        foreach ($subjects as $subject) {
            $courseId = DB::table('courses')->insertGetId([
                'subject_id' => $subject->id,
                'title' => $subject->name . ' Course',
                'description' => null,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $materialPosts = DB::table('posts')
                ->select('id', 'title', 'created_at')
                ->where('subject_id', $subject->id)
                ->where('post_type', 'material')
                ->orderBy('created_at')
                ->orderBy('id')
                ->get();

            $sequence = 1;

            foreach ($materialPosts as $post) {
                $lessonId = DB::table('lessons')->insertGetId([
                    'course_id' => $courseId,
                    'source_post_id' => $post->id,
                    'title' => $post->title,
                    'sequence' => $sequence,
                    'is_published' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                DB::table('posts')
                    ->where('id', $post->id)
                    ->update(['lesson_id' => $lessonId]);

                $sequence++;
            }
        }
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lesson_id');
        });

        Schema::dropIfExists('lessons');
        Schema::dropIfExists('courses');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('not_started');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('last_viewed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'lesson_id']);
            $table->index(['user_id', 'status']);
        });

        if (Schema::hasTable('bookmark_items')) {
            $now = now();

            $rows = DB::table('bookmark_items')
                ->join('posts', 'posts.id', '=', 'bookmark_items.post_id')
                ->whereNotNull('posts.lesson_id')
                ->select('bookmark_items.user_id', 'posts.lesson_id', 'bookmark_items.created_at')
                ->distinct()
                ->get();

            foreach ($rows as $row) {
                DB::table('lesson_progress')->updateOrInsert(
                    [
                        'user_id' => $row->user_id,
                        'lesson_id' => $row->lesson_id,
                    ],
                    [
                        'status' => 'completed',
                        'completed_at' => $row->created_at ?? $now,
                        'last_viewed_at' => $row->created_at ?? $now,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_progress');
    }
};

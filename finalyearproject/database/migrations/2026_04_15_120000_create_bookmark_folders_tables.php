<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookmark_folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'name']);
            $table->index(['user_id', 'is_default']);
        });

        Schema::create('bookmark_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bookmark_folder_id')->constrained('bookmark_folders')->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'post_id']);
            $table->index(['bookmark_folder_id', 'created_at']);
        });

        if (Schema::hasTable('post_saves')) {
            $now = now();

            $userIds = DB::table('post_saves')
                ->distinct()
                ->pluck('user_id');

            foreach ($userIds as $userId) {
                $folderId = DB::table('bookmark_folders')->insertGetId([
                    'user_id' => $userId,
                    'name' => 'Default',
                    'is_default' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                $savedPosts = DB::table('post_saves')
                    ->where('user_id', $userId)
                    ->orderBy('created_at')
                    ->get();

                foreach ($savedPosts as $savedPost) {
                    DB::table('bookmark_items')->insert([
                        'user_id' => $userId,
                        'bookmark_folder_id' => $folderId,
                        'post_id' => $savedPost->post_id,
                        'created_at' => $savedPost->created_at ?? $now,
                        'updated_at' => $savedPost->updated_at ?? $now,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bookmark_items');
        Schema::dropIfExists('bookmark_folders');
    }
};
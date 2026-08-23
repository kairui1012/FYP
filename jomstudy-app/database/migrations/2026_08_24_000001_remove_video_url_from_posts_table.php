<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('posts')
            ->select(['id', 'content', 'content_blocks'])
            ->whereNotNull('content_blocks')
            ->orderBy('id')
            ->chunkById(100, function ($posts): void {
                foreach ($posts as $post) {
                    $blocks = json_decode((string) $post->content_blocks, true);

                    if (! is_array($blocks)) {
                        continue;
                    }

                    $videoUrls = collect($blocks)
                        ->filter(fn ($block) => is_array($block) && ($block['type'] ?? null) === 'video')
                        ->pluck('url')
                        ->filter(fn ($url) => is_string($url))
                        ->values();

                    if ($videoUrls->isEmpty()) {
                        continue;
                    }

                    $remainingBlocks = collect($blocks)
                        ->reject(fn ($block) => is_array($block) && ($block['type'] ?? null) === 'video')
                        ->values()
                        ->all();

                    $content = (string) $post->content;
                    foreach ($videoUrls as $url) {
                        $content = str_replace($url, '', $content);
                    }

                    DB::table('posts')
                        ->where('id', $post->id)
                        ->update([
                            'content_blocks' => json_encode($remainingBlocks),
                            'content' => trim(preg_replace("/\\n{3,}/", "\\n\\n", $content) ?? $content),
                        ]);
                }
            }, 'id');

        if (Schema::hasColumn('posts', 'video_url')) {
            Schema::table('posts', function (Blueprint $table) {
                $table->dropColumn('video_url');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('posts', 'video_url')) {
            Schema::table('posts', function (Blueprint $table) {
                $table->string('video_url')->nullable();
            });
        }
    }
};

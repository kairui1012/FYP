<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('posts')
            ->where('post_type', 'discussion')
            ->update(['post_type' => 'question']);
    }

    public function down(): void
    {
        // Intentionally left blank because converted records cannot be
        // distinguished safely from original question posts.
    }
};

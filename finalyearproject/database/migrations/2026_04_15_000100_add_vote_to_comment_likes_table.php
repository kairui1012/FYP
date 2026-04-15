<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('comment_likes', 'vote')) {
            Schema::table('comment_likes', function (Blueprint $table) {
                $table->tinyInteger('vote')->default(1)->after('comment_id');
            });

            DB::table('comment_likes')->update(['vote' => 1]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('comment_likes', 'vote')) {
            Schema::table('comment_likes', function (Blueprint $table) {
                $table->dropColumn('vote');
            });
        }
    }
};

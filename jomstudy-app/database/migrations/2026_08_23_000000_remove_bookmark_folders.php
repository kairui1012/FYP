<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookmark_items', function (Blueprint $table) {
            $table->dropForeign(['bookmark_folder_id']);
            $table->dropIndex(['bookmark_folder_id', 'created_at']);
            $table->dropColumn('bookmark_folder_id');
        });

        Schema::dropIfExists('bookmark_folders');
    }

    public function down(): void
    {
        Schema::create('bookmark_folders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('name');
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'name']);
            $table->index(['user_id', 'is_default']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('bookmark_items', function (Blueprint $table) {
            $table->unsignedBigInteger('bookmark_folder_id')->nullable()->after('user_id');
            $table->index(['bookmark_folder_id', 'created_at']);
            $table->foreign('bookmark_folder_id')->references('id')->on('bookmark_folders')->nullOnDelete();
        });
    }
};

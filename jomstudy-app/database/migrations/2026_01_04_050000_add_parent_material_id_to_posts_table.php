<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_material_id')->nullable()->after('lesson_id');
            $table->foreign('parent_material_id')->references('id')->on('posts')->cascadeOnDelete();
            $table->index('parent_material_id');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['parent_material_id']);
            $table->dropColumn('parent_material_id');
        });
    }
};

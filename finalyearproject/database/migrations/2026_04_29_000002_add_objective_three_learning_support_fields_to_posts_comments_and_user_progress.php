<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'role')) {
                $table->string('role', 20)->default('student')->after('email');
                $table->index('role');
            }
        });

        Schema::table('posts', function (Blueprint $table) {
            if (! Schema::hasColumn('posts', 'parent_material_id')) {
                $table->foreignId('parent_material_id')
                    ->nullable()
                    ->after('post_type')
                    ->constrained('posts')
                    ->nullOnDelete();
                $table->index(['parent_material_id', 'post_type']);
            }

            if (! Schema::hasColumn('posts', 'material_improved_from_feedback')) {
                $table->boolean('material_improved_from_feedback')
                    ->default(false)
                    ->after('video_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            if (Schema::hasColumn('posts', 'parent_material_id')) {
                $table->dropForeign(['parent_material_id']);
                $table->dropIndex(['parent_material_id', 'post_type']);
                $table->dropColumn('parent_material_id');
            }

            if (Schema::hasColumn('posts', 'material_improved_from_feedback')) {
                $table->dropColumn('material_improved_from_feedback');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role')) {
                $table->dropIndex(['role']);
                $table->dropColumn('role');
            }
        });
    }
};

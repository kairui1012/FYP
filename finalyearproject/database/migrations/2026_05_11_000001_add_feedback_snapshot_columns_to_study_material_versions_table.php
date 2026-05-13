<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('study_material_versions')) {
            return;
        }

        Schema::table('study_material_versions', function (Blueprint $table) {
            if (! Schema::hasColumn('study_material_versions', 'average_rating')) {
                $table->decimal('average_rating', 3, 1)->default(0)->after('title');
            }

            if (! Schema::hasColumn('study_material_versions', 'rating_count')) {
                $table->unsignedInteger('rating_count')->default(0)->after('average_rating');
            }

            if (! Schema::hasColumn('study_material_versions', 'recommended_count')) {
                $table->unsignedInteger('recommended_count')->default(0)->after('rating_count');
            }

            if (! Schema::hasColumn('study_material_versions', 'total_votes')) {
                $table->unsignedInteger('total_votes')->default(0)->after('recommended_count');
            }

            if (! Schema::hasColumn('study_material_versions', 'recommendation_rate')) {
                $table->unsignedTinyInteger('recommendation_rate')->default(0)->after('total_votes');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('study_material_versions')) {
            return;
        }

        Schema::table('study_material_versions', function (Blueprint $table) {
            $columns = [
                'recommendation_rate',
                'total_votes',
                'recommended_count',
                'rating_count',
                'average_rating',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('study_material_versions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

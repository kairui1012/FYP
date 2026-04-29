<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('study_material_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->string('title', 150);
            $table->decimal('average_rating', 4, 2)->default(0);
            $table->unsignedInteger('rating_count')->default(0);
            $table->unsignedInteger('recommended_count')->default(0);
            $table->unsignedInteger('total_votes')->default(0);
            $table->unsignedTinyInteger('recommendation_rate')->default(0);
            $table->timestamps();

            $table->unique(['post_id', 'version_number']);
            $table->index(['post_id', 'created_at']);
        });

        $materials = DB::table('posts')
            ->where('post_type', 'material')
            ->select('id', 'title', 'created_at', 'updated_at')
            ->get();

        foreach ($materials as $material) {
            $feedback = DB::table('study_material_feedback')
                ->where('post_id', $material->id)
                ->selectRaw('AVG(rating) as average_rating')
                ->selectRaw('SUM(CASE WHEN rating IS NOT NULL THEN 1 ELSE 0 END) as rating_count')
                ->selectRaw('SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) as recommended_count')
                ->selectRaw('SUM(CASE WHEN vote IN (1, -1) THEN 1 ELSE 0 END) as total_votes')
                ->first();

            $averageRating = round((float) ($feedback->average_rating ?? 0), 1);
            $ratingCount = (int) ($feedback->rating_count ?? 0);
            $recommendedCount = (int) ($feedback->recommended_count ?? 0);
            $totalVotes = (int) ($feedback->total_votes ?? 0);
            $recommendationRate = $totalVotes > 0
                ? (int) round(($recommendedCount / $totalVotes) * 100)
                : 0;

            DB::table('study_material_versions')->insert([
                'post_id' => $material->id,
                'version_number' => 1,
                'title' => $material->title,
                'average_rating' => $averageRating,
                'rating_count' => $ratingCount,
                'recommended_count' => $recommendedCount,
                'total_votes' => $totalVotes,
                'recommendation_rate' => $recommendationRate,
                'created_at' => $material->created_at ?? now(),
                'updated_at' => $material->updated_at ?? now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('study_material_versions');
    }
};

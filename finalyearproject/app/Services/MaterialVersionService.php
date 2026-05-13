<?php

namespace App\Services;

use App\Models\Post;
use App\Models\StudyMaterialFeedback;
use App\Models\StudyMaterialVersion;
use Illuminate\Support\Facades\Schema;

class MaterialVersionService
{
    public function createSnapshot(Post $post): ?StudyMaterialVersion
    {
        if (
            $post->post_type !== 'material'
            || ! Schema::hasTable('study_material_versions')
        ) {
            return null;
        }

        $snapshot = $this->buildFeedbackSnapshot($post);
        $nextVersionNumber = ((int) StudyMaterialVersion::query()
            ->where('post_id', $post->id)
            ->max('version_number')) + 1;

        $columns = array_flip(Schema::getColumnListing('study_material_versions'));
        $attributes = [
            'post_id' => $post->id,
            'version_number' => $nextVersionNumber,
            'title' => $post->title,
        ];

        $optionalAttributes = [
            'user_id' => $post->user_id,
            'content' => $post->content ?? '',
            'content_blocks' => $post->content_blocks,
            'change_summary' => 'Initial version',
            'average_rating' => $snapshot['average_rating'],
            'rating_count' => $snapshot['rating_count'],
            'recommended_count' => $snapshot['recommended_count'],
            'total_votes' => $snapshot['total_votes'],
            'recommendation_rate' => $snapshot['recommendation_rate'],
        ];

        foreach ($optionalAttributes as $column => $value) {
            if (isset($columns[$column])) {
                $attributes[$column] = $value;
            }
        }

        return StudyMaterialVersion::query()->create($attributes);
    }

    /**
     * @return array{
     *     average_rating: float,
     *     rating_count: int,
     *     recommended_count: int,
     *     not_recommended_count: int,
     *     total_votes: int,
     *     recommendation_rate: int
     * }
     */
    public function buildFeedbackSnapshot(Post $post): array
    {
        if (! Schema::hasTable('study_material_feedback')) {
            return [
                'average_rating' => 0.0,
                'rating_count' => 0,
                'recommended_count' => 0,
                'not_recommended_count' => 0,
                'total_votes' => 0,
                'recommendation_rate' => 0,
            ];
        }

        $base = StudyMaterialFeedback::query()->where('post_id', $post->id);
        $averageRating = (float) (clone $base)->whereNotNull('rating')->avg('rating');
        $ratingCount = (int) (clone $base)->whereNotNull('rating')->count();
        $recommendedCount = (int) (clone $base)->where('vote', 1)->count();
        $notRecommendedCount = (int) (clone $base)->where('vote', -1)->count();
        $totalVotes = $recommendedCount + $notRecommendedCount;
        $recommendationRate = $totalVotes > 0
            ? (int) round(($recommendedCount / $totalVotes) * 100)
            : 0;

        return [
            'average_rating' => round($averageRating, 1),
            'rating_count' => $ratingCount,
            'recommended_count' => $recommendedCount,
            'not_recommended_count' => $notRecommendedCount,
            'total_votes' => $totalVotes,
            'recommendation_rate' => $recommendationRate,
        ];
    }
}

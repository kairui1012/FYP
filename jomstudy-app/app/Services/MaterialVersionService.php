<?php

namespace App\Services;

use App\Models\Post;
use App\Models\StudyMaterialFeedback;
use App\Models\StudyMaterialVersion;
use Illuminate\Support\Facades\Schema;

/**
 * Service responsible for creating and building snapshots (versions)
 * for study material posts. A snapshot captures the post content and
 * aggregated feedback metrics at a point in time.
 *
 * Used by controllers and traits to persist and compute material
 * version data (see PostCreateController, PostController,
 * StudyMaterialFeedbackController, and ManagesStudyMaterials).
 */
class MaterialVersionService
{
    /**
     * Create a version snapshot for a study material post.
     *
     * Returns the created `StudyMaterialVersion` or null if the post is not
     * a material or the versions table does not exist.
     */
    public function createSnapshot(Post $post): ?StudyMaterialVersion
    {
        // Only create snapshots for posts of type 'material' and if the
        // `study_material_versions` table exists in the database.
        if (
            $post->post_type !== 'material'
            || ! Schema::hasTable('study_material_versions')
        ) {
            return null;
        }

        // Build feedback summary (ratings, votes) to include in the snapshot.
        $snapshot = $this->buildFeedbackSnapshot($post);

        // Determine the next version number for this post.
        $nextVersionNumber = ((int) StudyMaterialVersion::query()
            ->where('post_id', $post->id)
            ->max('version_number')) + 1;

        // Only include attributes that exist on the `study_material_versions`
        // table to keep this service resilient to schema changes.
        $columns = array_flip(Schema::getColumnListing('study_material_versions'));
        $attributes = [
            'post_id' => $post->id,
            'version_number' => $nextVersionNumber,
            'title' => $post->title,
        ];

        $optionalAttributes = [
            // Post ownership and content
            'user_id' => $post->user_id,
            'content' => $post->content ?? '',
            'content_blocks' => $post->content_blocks,
            'change_summary' => 'Initial version',
            // Aggregated feedback metrics computed above
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

        // Persist and return the created StudyMaterialVersion model.
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
        return $this->buildFeedbackSnapshots([$post->id])[$post->id] ?? $this->emptyFeedbackSnapshot();
    }

    /**
     * Build feedback snapshots for multiple materials with one aggregate query.
     *
     * @param  array<int>  $postIds
     * @return array<int, array{average_rating: float, rating_count: int, recommended_count: int, not_recommended_count: int, total_votes: int, recommendation_rate: int}>
     */
    public function buildFeedbackSnapshots(array $postIds): array
    {
        $postIds = collect($postIds)->map(fn ($postId) => (int) $postId)->filter()->unique()->values();

        if ($postIds->isEmpty() || ! Schema::hasTable('study_material_feedback')) {
            return [];
        }

        return StudyMaterialFeedback::query()
            ->whereIn('post_id', $postIds->all())
            ->select('post_id')
            ->selectRaw('AVG(CASE WHEN rating IS NOT NULL THEN rating END) as average_rating')
            ->selectRaw('COUNT(rating) as rating_count')
            ->selectRaw('SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) as recommended_count')
            ->selectRaw('SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) as not_recommended_count')
            ->groupBy('post_id')
            ->get()
            ->mapWithKeys(function (StudyMaterialFeedback $feedback): array {
                $recommendedCount = (int) $feedback->recommended_count;
                $notRecommendedCount = (int) $feedback->not_recommended_count;
                $totalVotes = $recommendedCount + $notRecommendedCount;

                return [(int) $feedback->post_id => [
                    'average_rating' => round((float) $feedback->average_rating, 1),
                    'rating_count' => (int) $feedback->rating_count,
                    'recommended_count' => $recommendedCount,
                    'not_recommended_count' => $notRecommendedCount,
                    'total_votes' => $totalVotes,
                    'recommendation_rate' => $totalVotes > 0
                        ? (int) round(($recommendedCount / $totalVotes) * 100)
                        : 0,
                ]];
            })
            ->all();
    }

    /** @return array{average_rating: float, rating_count: int, recommended_count: int, not_recommended_count: int, total_votes: int, recommendation_rate: int} */
    public function emptyFeedbackSnapshot(): array
    {
        return [
            'average_rating' => 0.0,
            'rating_count' => 0,
            'recommended_count' => 0,
            'not_recommended_count' => 0,
            'total_votes' => 0,
            'recommendation_rate' => 0,
        ];
    }
}

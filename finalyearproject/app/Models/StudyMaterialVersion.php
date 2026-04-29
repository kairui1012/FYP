<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudyMaterialVersion extends Model
{
    protected $fillable = [
        'post_id',
        'version_number',
        'title',
        'average_rating',
        'rating_count',
        'recommended_count',
        'total_votes',
        'recommendation_rate',
    ];

    protected function casts(): array
    {
        return [
            'version_number' => 'integer',
            'average_rating' => 'float',
            'rating_count' => 'integer',
            'recommended_count' => 'integer',
            'total_votes' => 'integer',
            'recommendation_rate' => 'float',
        ];
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}

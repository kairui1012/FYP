<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudyMaterialFeedback extends Model
{
    protected $table = 'study_material_feedback';

    protected $fillable = [
        'user_id',
        'post_id',
        'vote',
        'rating',
        'feedback',
    ];

    protected function casts(): array
    {
        return [
            'vote' => 'integer',
            'rating' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}

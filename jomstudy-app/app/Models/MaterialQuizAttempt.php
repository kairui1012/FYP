<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialQuizAttempt extends Model
{
    protected $fillable = [
        'user_id',
        'post_id',
        'material_id',
        'score',
        'total_questions',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'total_questions' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'post_id');
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'material_id');
    }
}

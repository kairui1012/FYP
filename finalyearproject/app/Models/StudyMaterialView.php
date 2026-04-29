<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudyMaterialView extends Model
{
    protected $fillable = [
        'user_id',
        'post_id',
        'view_count',
        'last_viewed_at',
    ];

    protected function casts(): array
    {
        return [
            'view_count' => 'integer',
            'last_viewed_at' => 'datetime',
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

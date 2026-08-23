<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommentReport extends Model
{
    protected $fillable = [
        'user_id',
        'comment_id',
        'reason',
        'status',
        'moderation_queued_at',
    ];

    protected function casts(): array
    {
        return [
            'moderation_queued_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comment()
    {
        return $this->belongsTo(Comment::class);
    }
}

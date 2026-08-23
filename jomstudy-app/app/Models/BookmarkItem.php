<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookmarkItem extends Model
{
    protected $fillable = [
        'user_id',
        'bookmark_folder_id',
        'post_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(BookmarkFolder::class, 'bookmark_folder_id');
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
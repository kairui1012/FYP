<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'content',
        'post_type',
        'quiz_data',
        'subject_id',
        'lesson_id',
        'language_id',
        'image',
    ];

    protected function casts(): array
    {
        return [
            'image' => 'array',
            'quiz_data' => 'array',
        ];
    }

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function comments() {
        return $this->hasMany(Comment::class);
    }

    public function likes() {
        return $this->hasMany(Like::class);
    }

    public function saves() {
        return $this->hasMany(PostSave::class);
    }

    public function bookmarkItems(): HasMany
    {
        return $this->hasMany(BookmarkItem::class);
    }

    public function bookmarkFolders(): BelongsToMany
    {
        return $this->belongsToMany(BookmarkFolder::class, 'bookmark_items')
            ->withPivot(['id', 'user_id', 'created_at', 'updated_at'])
            ->withTimestamps();
    }

    public function language() {
        return $this->belongsTo(Language::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}

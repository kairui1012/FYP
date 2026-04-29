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
        'is_anonymous',
        'title',
        'content',
        'content_blocks',
        'post_type',
        'parent_material_id',
        'quiz_data',
        'subject_id',
        'language_id',
        'image',
        'video_url',
        'material_improved_from_feedback',
    ];

    protected function casts(): array
    {
        return [
            'image' => 'array',
            'content_blocks' => 'array',
            'quiz_data' => 'array',
            'is_anonymous' => 'boolean',
            'material_improved_from_feedback' => 'boolean',
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

    public function parentMaterial(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'parent_material_id');
    }

    public function linkedPosts(): HasMany
    {
        return $this->hasMany(Post::class, 'parent_material_id');
    }

    public function linkedQuizzes(): HasMany
    {
        return $this->hasMany(Post::class, 'parent_material_id')
            ->where('post_type', 'quiz');
    }

    public function materialFeedback(): HasMany
    {
        return $this->hasMany(StudyMaterialFeedback::class);
    }

    public function materialViews(): HasMany
    {
        return $this->hasMany(StudyMaterialView::class);
    }

    public function materialQuizAttempts(): HasMany
    {
        return $this->hasMany(MaterialQuizAttempt::class, 'material_id');
    }

    public function materialVersions(): HasMany
    {
        return $this->hasMany(StudyMaterialVersion::class)
            ->orderBy('version_number');
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

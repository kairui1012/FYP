<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'content',
        'post_type',
        'subject_id',
        'language_id',
        'image',
    ];

    protected function casts(): array
    {
        return [
            'image' => 'array',
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

    public function language() {
        return $this->belongsTo(Language::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}

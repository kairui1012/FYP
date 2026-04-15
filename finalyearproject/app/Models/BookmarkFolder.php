<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookmarkFolder extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public static function defaultFor(User $user): self
    {
        return static::query()->firstOrCreate(
            [
                'user_id' => $user->id,
                'is_default' => true,
            ],
            [
                'name' => 'Default',
            ]
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(BookmarkItem::class);
    }

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'bookmark_items')
            ->withPivot(['id', 'user_id', 'created_at', 'updated_at'])
            ->withTimestamps();
    }
}
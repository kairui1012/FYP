<?php

namespace App\Services;

use App\Models\Post;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class PostQueryBuilder
{
    private Builder $query;

    public function __construct()
    {
        $this->query = Post::query();
    }

    /**
     * Load standard relations for post display
     */
    public function withStandardRelations(): self
    {
        $this->query->with([
            'user:id,name,role',
            'user.socialAccounts:id,user_id,avatar',
            'subject:id,name',
            'lesson:id,title,sequence',
            'language:id,code,name',
        ]);

        return $this;
    }

    /**
     * Load standard counts
     */
    public function withStandardCounts(): self
    {
        $this->query->withCount(['likes', 'comments', 'bookmarkItems as saves_count']);

        return $this;
    }

    /**
     * Load user-specific flags (is_liked, is_saved)
     */
    public function withUserFlags(?int $userId = null): self
    {
        $userId = $userId ?? Auth::id();

        $this->query->withExists([
            'likes as is_liked' => fn ($query) => $query->where('user_id', $userId),
            'bookmarkItems as is_saved' => fn ($query) => $query->where('user_id', $userId),
        ]);

        return $this;
    }

    /**
     * Exclude posts from blocked users
     */
    public function excludeBlockedUsers(): self
    {
        $this->query->whereHas('user', fn ($q) => $q->where('is_blocked', false));

        return $this;
    }

    /**
     * Apply post type filter
     */
    public function filterByPostType(string|array|null $postType): self
    {
        if (is_array($postType) && count($postType) > 0) {
            $this->query->whereIn('post_type', $postType);
        } elseif (is_string($postType) && $postType !== '') {
            $this->query->where('post_type', $postType);
        }

        return $this;
    }

    /**
     * Apply language filter
     */
    public function filterByLanguage(string $languageCode): self
    {
        if ($languageCode !== '') {
            $this->query->whereHas('language', fn ($query) => $query->where('code', $languageCode));
        }

        return $this;
    }

    /**
     * Apply subject filter
     */
    public function filterBySubject(int|null $subjectId): self
    {
        if ($subjectId !== null) {
            $this->query->where('subject_id', $subjectId);
        }

        return $this;
    }

    /**
     * Order by latest
     */
    public function latest(): self
    {
        $this->query->latest();

        return $this;
    }

    /**
     * Get the built query
     */
    public function getQuery()
    {
        return $this->query;
    }

    /**
     * Execute and get results
     */
    public function get()
    {
        return $this->query->get();
    }

    /**
     * Get single result
     */
    public function first()
    {
        return $this->query->first();
    }
}

<?php

namespace App\Services;

use App\Models\Post;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class PostQueryBuilder
{
    /**
     * Eloquent query builder for the Post model that this class wraps and
     * augments with common scopes and eager loads used across the app.
     */
    private Builder $query;

    /**
     * Initialize with a fresh Post query builder.
     */
    public function __construct()
    {
        // Start from the Post model query; methods below mutate this builder
        // and return $this for chainability.
        $this->query = Post::query();
    }

    /**
     * Load a set of commonly-needed relations to avoid N+1 queries when
     * rendering posts in listings or detail views.
     *
     * @return $this
     */
    public function withStandardRelations(): self
    {
        $this->query->with([
            'user:id,name,role,is_verified',
            'user.socialAccounts:id,user_id,avatar',
            'subject:id,name',
            'lesson:id,title,sequence',
            'language:id,code,name',
        ]);

        return $this;
    }

    /**
     * Add common relationship counts (likes, comments, saves) to the query.
     *
     * @return $this
     */
    public function withStandardCounts(): self
    {
        $this->query->withCount(['likes', 'comments', 'bookmarkItems as saves_count']);

        return $this;
    }

    /**
     * Add boolean flags that indicate whether the given user has liked or
     * saved each post. If $userId is null the currently authenticated
     * user id will be used.
     *
     * @return $this
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
     * Exclude posts authored by users who are blocked.
     *
     * @return $this
     */
    public function excludeBlockedUsers(): self
    {
        $this->query->whereHas('user', fn ($q) => $q->where('is_blocked', false));

        return $this;
    }

    /**
     * Filter posts by post type. Accepts a single type string, an array of
     * types, or null to skip the filter.
     *
     * @return $this
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
     * Filter posts by language code (e.g. 'en', 'zh'). Empty string will
     * skip the filter.
     *
     * @return $this
     */
    public function filterByLanguage(string $languageCode): self
    {
        if ($languageCode !== '') {
            $this->query->whereHas('language', fn ($query) => $query->where('code', $languageCode));
        }

        return $this;
    }

    /**
     * Filter posts by subject id. Passing null skips the filter.
     *
     * @return $this
     */
    public function filterBySubject(?int $subjectId): self
    {
        if ($subjectId !== null) {
            $this->query->where('subject_id', $subjectId);
        }

        return $this;
    }

    /**
     * Order the query by newest posts first.
     *
     * @return $this
     */
    public function latest(): self
    {
        $this->query->latest();

        return $this;
    }

    /**
     * Return the underlying Eloquent query builder for further customization
     * or to execute advanced queries.
     *
     * @return Builder
     */
    public function getQuery()
    {
        return $this->query;
    }
}

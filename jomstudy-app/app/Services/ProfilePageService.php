<?php

namespace App\Services;

use App\Models\Post;
use App\Models\Profile;
use App\Models\User;
use App\Models\UserFeaturedBadge;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProfilePageService
{
    public function __construct(
        private readonly AchievementService $achievementService,
        private readonly LeaderboardTitleService $leaderboardTitleService,
    ) {}

    /** @return array{profileUser: array<string, mixed>, posts: mixed} */
    public function pageData(User $viewer, User $profileUser): array
    {
        $profileUser->loadMissing([
            'profile:id,user_id,avatar,about',
            'socialAccounts:id,user_id,avatar',
        ]);

        $socialAvatar = $profileUser->socialAccounts
            ->first(fn ($account) => ! empty($account->avatar))
            ?->avatar;
        $profileAvatar = $profileUser->profile?->avatar
            ? Storage::disk('public')->url($profileUser->profile->avatar)
            : null;

        $isFollowing = $viewer->id !== $profileUser->id
            ? $viewer->following()->where('following_id', $profileUser->id)->exists()
            : false;

        $achievementData = $this->achievementService->syncUser($profileUser);
        $earnedBadges = collect($achievementData['earned_badges'])
            ->map(fn ($badge) => [
                'id' => $badge->id,
                'key' => $badge->key,
                'name' => $badge->name,
                'description' => $badge->description,
                'icon' => $badge->icon,
                'points_required' => $badge->points_required,
                'awarded_at' => $badge->pivot?->awarded_at ? (string) $badge->pivot->awarded_at : null,
            ])
            ->values();

        $featuredBadgeIds = UserFeaturedBadge::query()
            ->where('user_id', $profileUser->id)
            ->pluck('badge_id')
            ->values()
            ->all();

        $posts = Post::query()
            ->where('user_id', $profileUser->id)
            ->where('is_anonymous', false)
            ->with('language:id,code,name')
            ->withCount(['likes', 'comments'])
            ->latest()
            ->get()
            ->map(fn (Post $post) => [
                'id' => $post->id,
                'title' => $post->title,
                'content' => $post->content,
                'image' => $post->image,
                'created_at' => optional($post->created_at)->toISOString(),
                'likes_count' => $post->likes_count,
                'comments_count' => $post->comments_count,
                'language' => $post->language ? [
                    'code' => $post->language->code,
                    'name' => $post->language->name,
                ] : null,
            ]);

        return [
            'profileUser' => [
                'id' => $profileUser->id,
                'name' => $profileUser->name,
                'email' => $viewer->id === $profileUser->id ? $profileUser->email : null,
                'role' => $profileUser->role ?? 'student',
                'is_verified' => (bool) ($profileUser->is_verified ?? false),
                'avatar' => $profileAvatar ?? $socialAvatar,
                'about' => $profileUser->profile?->about,
                'leaderboard_title' => $this->leaderboardTitleService->titleForUserId($profileUser->id),
                'is_following' => $isFollowing,
                'followers_count' => $profileUser->followers()->count(),
                'following_count' => $profileUser->following()->count(),
                'points' => $achievementData['points'],
                'badges' => $earnedBadges,
                'featured_badge_ids' => $featuredBadgeIds,
            ],
            'posts' => $posts,
        ];
    }

    /** @return array{name: string, avatar: string|null, about: string|null} */
    public function update(User $user, array $validated, ?UploadedFile $avatar): array
    {
        $user->forceFill(['name' => $validated['name']])->save();

        /** @var Profile $profile */
        $profile = $user->profile()->firstOrCreate(['user_id' => $user->id]);

        if ($avatar) {
            if ($profile->avatar) {
                Storage::disk('public')->delete($profile->avatar);
            }

            $profile->avatar = $avatar->store('profiles/avatars', 'public');
        }

        $profile->about = trim($validated['about'] ?? '') ?: null;
        $profile->save();

        return [
            'name' => $user->name,
            'avatar' => $profile->avatar ? Storage::disk('public')->url($profile->avatar) : null,
            'about' => $profile->about,
        ];
    }
}

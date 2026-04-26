<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use App\Models\UserFeaturedBadge;
use App\Services\AchievementService;
use App\Services\LeaderboardTitleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfilePageController extends Controller
{
    public function __construct(
        private readonly AchievementService $achievementService,
        private readonly LeaderboardTitleService $leaderboardTitleService,
    ) {}

    public function show(Request $request, ?User $user = null): Response
    {
        /** @var User $viewer */
        $viewer = $request->user();
        $profileUser = $user ?? $viewer;

        $profileUser->loadMissing([
            'socialAccounts:id,user_id,avatar',
        ]);

        $avatar = $profileUser->socialAccounts
            ->first(fn ($account) => ! empty($account->avatar))
            ?->avatar;

        $isFollowing = $viewer->id !== $profileUser->id
            ? $viewer->following()->where('following_id', $profileUser->id)->exists()
            : false;

        $achievementData = $this->achievementService->syncUser($profileUser);
        $earnedBadges = collect($achievementData['earned_badges'])
            ->map(fn ($badge) => [
                'id'              => $badge->id,
                'key'             => $badge->key,
                'name'            => $badge->name,
                'description'     => $badge->description,
                'icon'            => $badge->icon,
                'points_required' => $badge->points_required,
                'awarded_at'      => $badge->pivot?->awarded_at ? (string) $badge->pivot->awarded_at : null,
            ])
            ->values();

        $featuredBadgeIds = UserFeaturedBadge::where('user_id', $profileUser->id)
            ->pluck('badge_id')
            ->values()
            ->all();

        $posts = Post::query()
            ->where('user_id', $profileUser->id)
            ->where('is_anonymous', false)
            ->with(['language:id,code,name'])
            ->withCount(['likes', 'comments'])
            ->latest()
            ->get()
            ->map(fn (Post $post) => [
                'id'            => $post->id,
                'title'         => $post->title,
                'content'       => $post->content,
                'image'         => $post->image,
                'created_at'    => optional($post->created_at)->toISOString(),
                'likes_count'   => $post->likes_count,
                'comments_count' => $post->comments_count,
                'language'      => $post->language ? [
                    'code' => $post->language->code,
                    'name' => $post->language->name,
                ] : null,
            ]);

        return Inertia::render('profilePage', [
            'profileUser' => [
                'id'               => $profileUser->id,
                'name'             => $profileUser->name,
                'email'            => $viewer->id === $profileUser->id ? $profileUser->email : null,
                'avatar'           => $avatar,
                'leaderboard_title' => $this->leaderboardTitleService->titleForUserId($profileUser->id),
                'is_following'     => $isFollowing,
                'points'           => $achievementData['points'],
                'badges'           => $earnedBadges,
                'featured_badge_ids' => $featuredBadgeIds,
            ],
            'posts' => $posts,
        ]);
    }
}

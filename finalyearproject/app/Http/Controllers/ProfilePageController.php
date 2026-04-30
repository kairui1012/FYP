<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Profile;
use App\Models\User;
use App\Models\UserFeaturedBadge;
use App\Services\AchievementService;
use App\Services\LeaderboardTitleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            'profile:id,user_id,avatar,about',
            'socialAccounts:id,user_id,avatar',
        ]);

        $socialAvatar = $profileUser->socialAccounts
            ->first(fn ($account) => ! empty($account->avatar))
            ?->avatar;
        $profileAvatar = $profileUser->profile?->avatar
            ? Storage::disk('public')->url($profileUser->profile->avatar)
            : null;
        $avatar = $profileAvatar ?? $socialAvatar;

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

        return Inertia::render('ProfilePage', [
            'profileUser' => [
                'id'               => $profileUser->id,
                'name'             => $profileUser->name,
                'email'            => $viewer->id === $profileUser->id ? $profileUser->email : null,
                'avatar'           => $avatar,
                'about'            => $profileUser->profile?->about,
                'leaderboard_title' => $this->leaderboardTitleService->titleForUserId($profileUser->id),
                'is_following'     => $isFollowing,
                'followers_count'  => $profileUser->followers()->count(),
                'following_count'  => $profileUser->following()->count(),
                'points'           => $achievementData['points'],
                'badges'           => $earnedBadges,
                'featured_badge_ids' => $featuredBadgeIds,
            ],
            'posts' => $posts,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'about' => ['nullable', 'string', 'max:800'],
            'avatar' => ['nullable', 'image', 'max:2048'],
        ]);

        $user->forceFill([
            'name' => $validated['name'],
        ])->save();

        /** @var Profile $profile */
        $profile = $user->profile()->firstOrCreate(['user_id' => $user->id]);

        if ($request->hasFile('avatar')) {
            if ($profile->avatar) {
                Storage::disk('public')->delete($profile->avatar);
            }

            $profile->avatar = $request->file('avatar')->store('profiles/avatars', 'public');
        }

        $profile->about = trim($validated['about'] ?? '') ?: null;
        $profile->save();

        return response()->json([
            'profileUser' => [
                'name' => $user->name,
                'avatar' => $profile->avatar ? Storage::disk('public')->url($profile->avatar) : null,
                'about' => $profile->about,
            ],
        ]);
    }
}

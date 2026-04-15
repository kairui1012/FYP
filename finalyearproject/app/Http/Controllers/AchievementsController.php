<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AchievementService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AchievementsController extends Controller
{
    public function __construct(private readonly AchievementService $achievementService)
    {
    }

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('socialAccounts:id,user_id,avatar');

        $result = $this->achievementService->syncUser($user);

        return Inertia::render('AchievementsPage', [
            'summary' => [
                'points' => $result['points'],
                'posts_count' => $result['posts_count'],
                'likes_received_count' => $result['likes_received_count'],
            ],
            'badges' => collect($result['earned_badges'])->map(fn ($badge) => [
                'id' => $badge->id,
                'key' => $badge->key,
                'name' => $badge->name,
                'description' => $badge->description,
                'icon' => $badge->icon,
                'points_required' => $badge->points_required,
                'awarded_at' => $badge->pivot?->awarded_at ? (string) $badge->pivot->awarded_at : null,
            ])->values(),
            'next_badge' => $result['next_badge'] ? [
                'id' => $result['next_badge']->id,
                'key' => $result['next_badge']->key,
                'name' => $result['next_badge']->name,
                'description' => $result['next_badge']->description,
                'icon' => $result['next_badge']->icon,
                'points_required' => $result['next_badge']->points_required,
            ] : null,
        ]);
    }
}

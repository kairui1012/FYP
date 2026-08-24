<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\FollowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FollowerController extends Controller
{
    private const FEED_PER_PAGE = 10;

    public function __construct(private readonly FollowService $followService) {}

    /**
     * Toggle follow status for a user. Prevents self-follow.
     * Awards/revokes follower points to the target user.
     * Returns JSON or redirect depending on request type.
     */
    public function toggle(Request $request, User $user): JsonResponse|RedirectResponse
    {
        $authUser = $request->user();

        if (! $authUser || $authUser->id === $user->id) {
            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'invalid',
                    'is_following' => false,
                ], 422);
            }

            return back()->with('status', 'invalid');
        }

        $result = $this->followService->toggle($authUser, $user);

        if ($request->expectsJson()) {
            return response()->json([
                'status' => $result['status'],
                'is_following' => $result['is_following'],
            ]);
        }

        return back()->with('status', $result['status']);
    }

    /**
     * Display paginated feed of posts from users the authenticated user follows.
     * Excludes blocked users. Includes post engagement counts and user info.
     */
    public function index(Request $request)
    {
        $feed = $this->followService->feed($request->user(), self::FEED_PER_PAGE);

        return inertia('followingPage', [
            'posts' => $feed['posts'],
            'pagination' => $feed['pagination'],
            'postTypeFilter' => null,
        ]);
    }
}

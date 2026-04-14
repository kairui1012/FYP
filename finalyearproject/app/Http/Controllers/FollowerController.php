<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;


class FollowerController extends Controller
{
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

        if ($authUser->following()->where('following_id', $user->id)->exists()) {
            $authUser->following()->detach($user->id);
            $status = 'unfollowed';
            $isFollowing = false;
        } else {
            $authUser->following()->attach($user->id);
            $status = 'followed';
            $isFollowing = true;
        }

        if ($request->expectsJson()) {
            return response()->json([
                'status' => $status,
                'is_following' => $isFollowing,
            ]);
        }

        return back()->with('status', $status);
    }
}

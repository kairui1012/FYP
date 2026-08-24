<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ProfilePageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfilePageController extends Controller
{
    public function __construct(private readonly ProfilePageService $profilePageService) {}

    /**
     * Display user profile page with bio, badges, achievements, and user's posts.
     * Shows follower/following counts and featured badge selection.
     * If viewing own profile, includes email. Syncs user achievements.
     */
    public function show(Request $request, ?User $user = null): Response
    {
        /** @var User $viewer */
        $viewer = $request->user();
        $profileUser = $user ?? $viewer;

        return Inertia::render('profilePage', $this->profilePageService->pageData($viewer, $profileUser));
    }

    /**
     * Update user's profile name, about bio, and avatar image.
     * Handles file upload and storage cleanup for old avatars.
     * Returns updated profile data as JSON.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'about' => ['nullable', 'string', 'max:800'],
            'avatar' => ['nullable', 'image', 'max:2048'],
        ]);

        return response()->json([
            'profileUser' => $this->profilePageService->update($user, $validated, $request->file('avatar')),
        ]);
    }
}

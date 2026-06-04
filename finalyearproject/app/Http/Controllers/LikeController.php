<?php

namespace App\Http\Controllers;

use App\Models\Like;
use App\Models\Post;
use App\Services\AchievementService;
use App\Services\PointsService;
use App\Services\ProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function __construct(
        private readonly AchievementService $achievementService,
        private readonly PointsService $pointsService,
        private readonly ProgressService $progressService,
    ) {
    }

    /**
     * Toggle like status for a post. Awards/revokes points and updates achievement/progress.
     * Only awards points for question/quiz/material posts.
     * Returns JSON or redirect response depending on request type.
     */
    public function toggle(Request $request, Post $posts): RedirectResponse|JsonResponse
    {
        $existingLike = Like::query()
            ->where('user_id', $request->user()->id)
            ->where('post_id', $posts->id)
            ->first();

        $isLiked = false;
        $pointsAction = $this->leaderboardActionForPost($posts);

        if ($existingLike) {
            if ($pointsAction && $posts->user) {
                $this->pointsService->revoke($posts->user, $pointsAction, $existingLike);
            }

            $existingLike->delete();
        } else {
            $like = new Like();
            $like->user_id = $request->user()->id;
            $like->post_id = $posts->id;
            $like->save();
            $isLiked = true;

            if ($pointsAction && $posts->user) {
                $this->pointsService->award($posts->user, $pointsAction, $like, $request->user());
            }
        }

        $likesCount = $posts->likes()->count();

        if ($posts->user) {
            $this->achievementService->syncUser($posts->user);
            $this->progressService->syncLikesReceived($posts->user);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'liked' => $isLiked,
                'likes_count' => $likesCount,
            ]);
        }

        return redirect()->back()->with('success', $isLiked ? 'Post liked.' : 'Like removed.');
    }

    /**
     * Determine the leaderboard action for a post type.
     * Only question/quiz/material posts award points for likes.
     */
    private function leaderboardActionForPost(Post $post): ?string
    {
        return in_array($post->post_type, ['question', 'quiz', 'material'], true)
            ? 'question_upvoted'
            : null;
    }
}

<?php

namespace App\Services;

use App\Models\Like;
use App\Models\Post;
use App\Models\User;

class PostLikeService
{
    public function __construct(
        private readonly AchievementService $achievementService,
        private readonly PointsService $pointsService,
        private readonly ProgressService $progressService,
    ) {}

    /** @return array{liked: bool, likes_count: int} */
    public function toggle(User $actor, Post $post): array
    {
        $existingLike = Like::query()
            ->where('user_id', $actor->id)
            ->where('post_id', $post->id)
            ->first();

        $isLiked = false;
        $pointsAction = in_array($post->post_type, ['question', 'quiz', 'material'], true)
            ? 'question_upvoted'
            : null;

        if ($existingLike) {
            if ($pointsAction && $post->user) {
                $this->pointsService->revoke($post->user, $pointsAction, $existingLike);
            }

            $existingLike->delete();
        } else {
            $like = new Like;
            $like->user_id = $actor->id;
            $like->post_id = $post->id;
            $like->save();
            $isLiked = true;

            if ($pointsAction && $post->user) {
                $this->pointsService->award($post->user, $pointsAction, $like, $actor);
            }
        }

        $likesCount = $post->likes()->count();

        if ($post->user) {
            $this->achievementService->syncUser($post->user);
            $this->progressService->syncLikesReceived($post->user);
        }

        return ['liked' => $isLiked, 'likes_count' => $likesCount];
    }
}

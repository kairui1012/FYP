<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardController extends Controller
{
    public function index(): Response
    {
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();

        $totalLeaderboard = $this->buildLeaderboardData();
        $weeklyLeaderboard = $this->buildLeaderboardData($startOfWeek, $endOfWeek);

        return Inertia::render('Leaderboard', [
            'totalLeaderboard' => $totalLeaderboard,
            'weeklyLeaderboard' => $weeklyLeaderboard,
            'weeklyMeta' => [
                'start' => $startOfWeek->toDateString(),
                'end' => $endOfWeek->toDateString(),
                'nextRefreshAt' => $endOfWeek->copy()->addSecond()->toIso8601String(),
            ],
        ]);
    }

    private function buildLeaderboardData(?Carbon $startAt = null, ?Carbon $endAt = null): array
    {
        // Posts whose authors received the most likes.
        $topPostLikers = DB::table('likes')
            ->join('posts', 'likes.post_id', '=', 'posts.id')
            ->join('users', 'posts.user_id', '=', 'users.id')
            ->leftJoin('social_accounts', 'users.id', '=', 'social_accounts.user_id')
            ->when($startAt && $endAt, function ($query) use ($startAt, $endAt) {
                $query->whereBetween('likes.created_at', [$startAt, $endAt]);
            })
            ->select(
                'users.id',
                'users.name',
                DB::raw('MAX(social_accounts.avatar) as avatar'),
                DB::raw('COUNT(DISTINCT likes.id) as like_count')
            )
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('like_count')
            ->limit(10)
            ->get();

        // Posts whose authors received the most comments.
        $topCommenters = DB::table('comments')
            ->join('posts', 'comments.post_id', '=', 'posts.id')
            ->join('users', 'posts.user_id', '=', 'users.id')
            ->leftJoin('social_accounts', 'users.id', '=', 'social_accounts.user_id')
            ->when($startAt && $endAt, function ($query) use ($startAt, $endAt) {
                $query->whereBetween('comments.created_at', [$startAt, $endAt]);
            })
            ->select(
                'users.id',
                'users.name',
                DB::raw('MAX(social_accounts.avatar) as avatar'),
                DB::raw('COUNT(DISTINCT comments.id) as comment_count')
            )
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('comment_count')
            ->limit(10)
            ->get();

        // Users who posted the most comments.
        $topContributorsByComments = User::select(
            'users.id',
            'users.name',
            DB::raw('MAX(social_accounts.avatar) as avatar'),
            DB::raw('COUNT(DISTINCT comments.id) as comment_count')
        )
            ->leftJoin('comments', 'users.id', '=', 'comments.user_id')
            ->leftJoin('social_accounts', 'users.id', '=', 'social_accounts.user_id')
            ->when($startAt && $endAt, function ($query) use ($startAt, $endAt) {
                $query->whereBetween('comments.created_at', [$startAt, $endAt]);
            })
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('comment_count')
            ->limit(10)
            ->get();

        // Users whose comments received the most likes.
        $topCommentLikers = User::select(
            'users.id',
            'users.name',
            DB::raw('MAX(social_accounts.avatar) as avatar'),
            DB::raw('COUNT(DISTINCT comment_likes.id) as like_count')
        )
            ->leftJoin('comments', 'users.id', '=', 'comments.user_id')
            ->leftJoin('comment_likes', 'comments.id', '=', 'comment_likes.comment_id')
            ->leftJoin('social_accounts', 'users.id', '=', 'social_accounts.user_id')
            ->when($startAt && $endAt, function ($query) use ($startAt, $endAt) {
                $query->whereBetween('comment_likes.created_at', [$startAt, $endAt]);
            })
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('like_count')
            ->limit(10)
            ->get();

        return [
            'topPostLikers' => $topPostLikers,
            'topCommenters' => $topCommenters,
            'topContributorsByComments' => $topContributorsByComments,
            'topCommentLikers' => $topCommentLikers,
        ];
    }
}
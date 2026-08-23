<?php

use App\Models\Post;
use App\Models\User;
use App\Services\PointsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function pointsSource(int $id = 1): Post
{
    $post = new Post;
    $post->setRawAttributes(['id' => $id], true);

    return $post;
}

test('it awards points for a supported action', function () {
    $user = User::factory()->create();
    $source = pointsSource();

    $awarded = app(PointsService::class)->award($user, 'question_asked', $source);

    expect($awarded)->toBeTrue()
        ->and($user->fresh()->total_points)->toBe(2)
        ->and(DB::table('points_transactions')->count())->toBe(1);

    $transaction = DB::table('points_transactions')->first();

    expect($transaction->user_id)->toBe($user->id)
        ->and($transaction->points)->toBe(2)
        ->and($transaction->action)->toBe('question_asked')
        ->and($transaction->source_type)->toBe($source->getMorphClass())
        ->and($transaction->source_id)->toBe($source->getKey());
});

test('it revokes points for the same action and source', function () {
    $user = User::factory()->create();
    $source = pointsSource();
    $service = app(PointsService::class);

    $service->award($user, 'answer_posted', $source);
    $revoked = $service->revoke($user, 'answer_posted', $source);

    expect($revoked)->toBeTrue()
        ->and($user->fresh()->total_points)->toBe(0)
        ->and(DB::table('points_transactions')->count())->toBe(2)
        ->and(DB::table('points_transactions')->sum('points'))->toBe(0);

    $reversal = DB::table('points_transactions')->latest('id')->first();

    expect($reversal->points)->toBe(-5)
        ->and($reversal->action)->toBe('answer_posted');
});

test('it blocks self awards', function () {
    $user = User::factory()->create();
    $source = pointsSource();

    $awarded = app(PointsService::class)->award($user, 'question_upvoted', $source, $user);

    expect($awarded)->toBeFalse()
        ->and($user->fresh()->total_points)->toBe(0)
        ->and(DB::table('points_transactions')->count())->toBe(0);
});

test('it does not double award the same action and source', function () {
    $user = User::factory()->create();
    $source = pointsSource();
    $service = app(PointsService::class);

    $firstAward = $service->award($user, 'answer_upvoted', $source);
    $secondAward = $service->award($user, 'answer_upvoted', $source);

    expect($firstAward)->toBeTrue()
        ->and($secondAward)->toBeFalse()
        ->and($user->fresh()->total_points)->toBe(10)
        ->and(DB::table('points_transactions')->count())->toBe(1);
});

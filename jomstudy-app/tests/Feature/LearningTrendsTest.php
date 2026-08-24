<?php

use App\Models\Language;
use App\Models\Post;
use App\Models\Subject;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

afterEach(function () {
    Carbon::setTestNow();
});

function createLearningTrendPost(User $user, Language $language, Subject $subject, string $title, Carbon $createdAt): Post
{
    $post = Post::create([
        'user_id' => $user->id,
        'title' => $title,
        'content' => $title.' content',
        'post_type' => 'material',
        'language_id' => $language->id,
        'subject_id' => $subject->id,
    ]);

    $post->forceFill([
        'created_at' => $createdAt,
        'updated_at' => $createdAt,
    ])->save();

    return $post;
}

test('learning trends week range only shows posts created in the current calendar week', function () {
    Carbon::setTestNow(Carbon::parse('2026-05-20 12:00:00'));

    $viewer = User::factory()->create();
    $author = User::factory()->create();
    $language = Language::create(['code' => 'en', 'name' => 'English']);
    $subject = Subject::create(['name' => 'Mathematics']);

    createLearningTrendPost($author, $language, $subject, 'This week post', Carbon::parse('2026-05-18 09:00:00'));
    createLearningTrendPost($author, $language, $subject, 'Last week post', Carbon::parse('2026-05-17 23:59:59'));

    $this
        ->actingAs($viewer)
        ->get(route('popularPage', ['range' => 'week', 'sort' => 'newest']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('learningTrendsPage')
            ->has('posts', 1)
            ->where('posts.0.title', 'This week post')
            ->where('activeRange', 'week')
        );
});

test('learning trends today range only shows posts created today', function () {
    Carbon::setTestNow(Carbon::parse('2026-05-20 12:00:00'));

    $viewer = User::factory()->create();
    $author = User::factory()->create();
    $language = Language::create(['code' => 'en', 'name' => 'English']);
    $subject = Subject::create(['name' => 'Mathematics']);

    createLearningTrendPost($author, $language, $subject, 'Today post', Carbon::parse('2026-05-20 00:00:00'));
    createLearningTrendPost($author, $language, $subject, 'Yesterday post', Carbon::parse('2026-05-19 23:59:59'));

    $this
        ->actingAs($viewer)
        ->get(route('popularPage', ['range' => 'today', 'sort' => 'newest']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('learningTrendsPage')
            ->has('posts', 1)
            ->where('posts.0.title', 'Today post')
            ->where('activeRange', 'today')
        );
});

test('learning trends month range only shows posts created in the current calendar month', function () {
    Carbon::setTestNow(Carbon::parse('2026-05-20 12:00:00'));

    $viewer = User::factory()->create();
    $author = User::factory()->create();
    $language = Language::create(['code' => 'en', 'name' => 'English']);
    $subject = Subject::create(['name' => 'Mathematics']);

    createLearningTrendPost($author, $language, $subject, 'This month post', Carbon::parse('2026-05-01 00:00:00'));
    createLearningTrendPost($author, $language, $subject, 'Last month post', Carbon::parse('2026-04-30 23:59:59'));

    $this
        ->actingAs($viewer)
        ->get(route('popularPage', ['range' => 'month', 'sort' => 'newest']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('learningTrendsPage')
            ->has('posts', 1)
            ->where('posts.0.title', 'This month post')
            ->where('activeRange', 'month')
        );
});

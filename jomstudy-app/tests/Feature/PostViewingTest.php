<?php

use App\Models\Language;
use App\Models\Post;
use App\Models\QuizCompletion;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('direct quiz detail exposes completed state for current user', function () {
    $user = User::factory()->create();
    $language = Language::create([
        'code' => fake()->unique()->lexify('??'),
        'name' => fake()->unique()->word(),
    ]);
    $subject = Subject::create([
        'name' => fake()->unique()->word(),
    ]);

    $quiz = Post::create([
        'user_id' => $user->id,
        'title' => 'Completed direct quiz',
        'content' => 'Answer the quiz questions.',
        'post_type' => 'quiz',
        'quiz_data' => [
            'questions' => [
                [
                    'question' => 'What is 2 + 2?',
                    'options' => ['3', '4'],
                    'correct_answer' => 1,
                ],
            ],
        ],
        'language_id' => $language->id,
        'subject_id' => $subject->id,
    ]);

    QuizCompletion::create([
        'user_id' => $user->id,
        'post_id' => $quiz->id,
        'subject_id' => $subject->id,
        'completed_at' => now(),
    ]);

    $this
        ->actingAs($user)
        ->get(route('posts.show', $quiz))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('PostContent')
            ->where('post.id', $quiz->id)
            ->where('post.is_quiz_completed', true)
        );
});

test('material detail does not expose learning analytics to students', function () {
    $owner = User::factory()->create(['role' => 'teacher']);
    $viewer = User::factory()->create(['role' => 'student']);
    $language = Language::create([
        'code' => fake()->unique()->lexify('??'),
        'name' => fake()->unique()->word(),
    ]);
    $subject = Subject::create([
        'name' => fake()->unique()->word(),
    ]);

    $material = Post::create([
        'user_id' => $owner->id,
        'title' => 'Material with private analytics',
        'content' => 'This material should hide analytics from non-admin users.',
        'post_type' => 'material',
        'language_id' => $language->id,
        'subject_id' => $subject->id,
    ]);

    $this
        ->actingAs($viewer)
        ->get(route('posts.show', $material))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('PostContent')
            ->where('post.id', $material->id)
            ->where('post.learning_analytics', null)
        );
});

test('material detail does not expose learning analytics to admins', function () {
    $owner = User::factory()->create(['role' => 'teacher']);
    $admin = User::factory()->create(['role' => 'admin']);
    $language = Language::create([
        'code' => fake()->unique()->lexify('??'),
        'name' => fake()->unique()->word(),
    ]);
    $subject = Subject::create([
        'name' => fake()->unique()->word(),
    ]);

    $material = Post::create([
        'user_id' => $owner->id,
        'title' => 'Material analytics hidden from admins',
        'content' => 'Admins should not receive teacher learning analytics.',
        'post_type' => 'material',
        'language_id' => $language->id,
        'subject_id' => $subject->id,
    ]);

    $this
        ->actingAs($admin)
        ->get(route('posts.show', $material))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('PostContent')
            ->where('post.id', $material->id)
            ->where('post.learning_analytics', null)
        );
});

test('material detail exposes learning analytics to teachers', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    $language = Language::create([
        'code' => fake()->unique()->lexify('??'),
        'name' => fake()->unique()->word(),
    ]);
    $subject = Subject::create([
        'name' => fake()->unique()->word(),
    ]);

    $material = Post::create([
        'user_id' => $teacher->id,
        'title' => 'Material analytics for teachers',
        'content' => 'Teachers should receive learning analytics.',
        'post_type' => 'material',
        'language_id' => $language->id,
        'subject_id' => $subject->id,
    ]);

    $this
        ->actingAs($teacher)
        ->get(route('posts.show', $material))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('PostContent')
            ->where('post.id', $material->id)
            ->has('post.learning_analytics')
            ->where('post.learning_analytics.views', 1)
            ->where('post.learning_analytics.unique_users', 1)
        );
});

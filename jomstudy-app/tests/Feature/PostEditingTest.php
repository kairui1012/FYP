<?php

use App\Models\Language;
use App\Models\Post;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createPostEditingTaxonomy(): array
{
    return [
        Language::create([
            'code' => fake()->unique()->lexify('??'),
            'name' => fake()->unique()->word(),
        ]),
        Subject::create([
            'name' => fake()->unique()->word(),
        ]),
    ];
}

test('material creation rejects video content blocks', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    [$language, $subject] = createPostEditingTaxonomy();

    $this
        ->actingAs($teacher)
        ->post(route('posts.store'), [
            'title' => 'Material with a removed content type',
            'post_type' => 'material',
            'subject_id' => $subject->id,
            'language_code' => $language->code,
            'material_blocks' => [
                [
                    'type' => 'video',
                    'url' => 'https://example.test/video',
                ],
            ],
        ])
        ->assertSessionHasErrors(['material_blocks.0.type']);
});

test('anonymous question keeps author hidden while exposing owner state', function () {
    $owner = User::factory()->create();
    $viewer = User::factory()->create();
    [$language, $subject] = createPostEditingTaxonomy();

    $question = Post::create([
        'user_id' => $owner->id,
        'is_anonymous' => true,
        'title' => 'Anonymous question',
        'content' => 'How can I solve this?',
        'post_type' => 'question',
        'language_id' => $language->id,
        'subject_id' => $subject->id,
    ]);

    $this
        ->actingAs($owner)
        ->get(route('posts.show', $question))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('PostContent')
            ->where('post.id', $question->id)
            ->where('post.is_anonymous', true)
            ->where('post.user', null)
            ->where('post.is_owner', true)
        );

    $this
        ->actingAs($viewer)
        ->get(route('posts.show', $question))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('PostContent')
            ->where('post.id', $question->id)
            ->where('post.is_anonymous', true)
            ->where('post.user', null)
            ->where('post.is_owner', false)
        );
});

test('question creation works without study material link', function () {
    $student = User::factory()->create(['role' => 'student']);
    [$language, $subject] = createPostEditingTaxonomy();

    $response = $this
        ->actingAs($student)
        ->post(route('posts.store'), [
            'title' => 'Question without material link',
            'content' => 'How do I solve this problem?',
            'post_type' => 'question',
            'subject_id' => $subject->id,
            'language_code' => $language->code,
            'is_anonymous' => false,
        ]);

    $response->assertRedirect(route('homePage'));
    $this->assertDatabaseHas('posts', [
        'title' => 'Question without material link',
        'post_type' => 'question',
        'parent_material_id' => null,
    ]);
});

test('question creation rejects study material link', function () {
    $student = User::factory()->create(['role' => 'student']);
    $teacher = User::factory()->create(['role' => 'teacher']);
    [$language, $subject] = createPostEditingTaxonomy();

    $material = Post::create([
        'user_id' => $teacher->id,
        'title' => 'Reference material',
        'content' => 'Study this first.',
        'content_blocks' => [
            [
                'type' => 'text',
                'text' => 'Study this first.',
            ],
        ],
        'post_type' => 'material',
        'language_id' => $language->id,
        'subject_id' => $subject->id,
    ]);

    $response = $this
        ->actingAs($student)
        ->post(route('posts.store'), [
            'title' => 'Question with blocked material link',
            'content' => 'Can this link a material?',
            'post_type' => 'question',
            'parent_material_id' => $material->id,
            'subject_id' => $subject->id,
            'language_code' => $language->code,
        ]);

    $response->assertSessionHasErrors(['parent_material_id']);
    $this->assertDatabaseMissing('posts', [
        'title' => 'Question with blocked material link',
    ]);
});

test('quiz creation can link to study material', function () {
    $student = User::factory()->create(['role' => 'student']);
    $teacher = User::factory()->create(['role' => 'teacher']);
    [$language, $subject] = createPostEditingTaxonomy();

    $material = Post::create([
        'user_id' => $teacher->id,
        'title' => 'Quiz reference material',
        'content' => 'Read before quiz.',
        'content_blocks' => [
            [
                'type' => 'text',
                'text' => 'Read before quiz.',
            ],
        ],
        'post_type' => 'material',
        'language_id' => $language->id,
        'subject_id' => $subject->id,
    ]);

    $response = $this
        ->actingAs($student)
        ->post(route('posts.store'), [
            'title' => 'Linked quiz',
            'content' => 'Answer this linked quiz.',
            'post_type' => 'quiz',
            'parent_material_id' => $material->id,
            'subject_id' => $subject->id,
            'language_code' => $language->code,
            'quiz_questions' => [
                [
                    'question' => 'What is 2 + 2?',
                    'options' => ['3', '4'],
                    'answer_index' => 1,
                    'explanation' => 'Two plus two equals four.',
                ],
            ],
        ]);

    $response->assertRedirect(route('homePage'));
    $this->assertDatabaseHas('posts', [
        'title' => 'Linked quiz',
        'post_type' => 'quiz',
        'parent_material_id' => $material->id,
    ]);
});

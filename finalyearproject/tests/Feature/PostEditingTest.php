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

test('material update rejects invalid video block url', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    [$language, $subject] = createPostEditingTaxonomy();

    $material = Post::create([
        'user_id' => $teacher->id,
        'title' => 'Material with a video block',
        'content' => 'Existing material body.',
        'content_blocks' => [
            [
                'type' => 'text',
                'text' => 'Existing material body.',
            ],
        ],
        'post_type' => 'material',
        'language_id' => $language->id,
        'subject_id' => $subject->id,
    ]);

    $response = $this
        ->actingAs($teacher)
        ->patch(route('posts.update', $material), [
            'title' => 'Updated material title',
            'content' => '',
            'material_blocks' => [
                [
                    'type' => 'video',
                    'url' => 'not a video url',
                ],
            ],
        ]);

    $response->assertSessionHasErrors(['material_blocks.0.url']);
    $this->assertDatabaseHas('posts', [
        'id' => $material->id,
        'title' => 'Material with a video block',
    ]);
});

test('material creation rejects invalid video block url', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    [$language, $subject] = createPostEditingTaxonomy();

    $response = $this
        ->actingAs($teacher)
        ->post(route('posts.store'), [
            'title' => 'New material with invalid video',
            'post_type' => 'material',
            'subject_id' => $subject->id,
            'language_code' => $language->code,
            'material_blocks' => [
                [
                    'type' => 'video',
                    'url' => 'not a video url',
                ],
            ],
        ]);

    $response->assertSessionHasErrors(['material_blocks.0.url']);
    $this->assertDatabaseMissing('posts', [
        'title' => 'New material with invalid video',
    ]);
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

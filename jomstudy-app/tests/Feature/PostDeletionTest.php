<?php

use App\Models\Language;
use App\Models\Post;
use App\Models\Subject;
use App\Models\User;

function createDeletionTestPost(User $owner, string $postType): Post
{
    $language = Language::create([
        'code' => fake()->unique()->lexify('??'),
        'name' => fake()->unique()->word(),
    ]);
    $subject = Subject::create([
        'name' => fake()->unique()->word(),
    ]);

    return Post::create([
        'user_id' => $owner->id,
        'title' => 'Deletion authorization fixture',
        'content' => 'Content used for delete authorization tests.',
        'post_type' => $postType,
        'language_id' => $language->id,
        'subject_id' => $subject->id,
    ]);
}

test('admin can delete another users material post', function () {
    $owner = User::factory()->create(['role' => 'teacher']);
    $admin = User::factory()->create(['role' => 'admin']);
    $post = createDeletionTestPost($owner, 'material');

    $response = $this
        ->actingAs($admin)
        ->delete(route('posts.destroy', $post));

    $response->assertRedirect(route('feed.index'));
    $this->assertDatabaseMissing('posts', ['id' => $post->id]);
});

test('non admin cannot delete another users material post', function () {
    $owner = User::factory()->create(['role' => 'teacher']);
    $otherUser = User::factory()->create(['role' => 'student']);
    $post = createDeletionTestPost($owner, 'material');

    $response = $this
        ->actingAs($otherUser)
        ->delete(route('posts.destroy', $post));

    $response->assertForbidden();
    $this->assertDatabaseHas('posts', ['id' => $post->id]);
});

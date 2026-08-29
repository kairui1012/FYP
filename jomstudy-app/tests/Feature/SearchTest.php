<?php

use App\Models\Language;
use App\Models\Post;
use App\Models\Subject;
use App\Models\User;

test('post search matches keywords in post content', function () {
    $user = User::factory()->create();
    $language = Language::create(['code' => 'en', 'name' => 'English']);
    $subject = Subject::create(['name' => 'Mathematics']);

    $post = Post::create([
        'user_id' => $user->id,
        'title' => 'Basic algebra notes',
        'content' => 'This lesson explains quadratic factorisation clearly.',
        'post_type' => 'material',
        'language_id' => $language->id,
        'subject_id' => $subject->id,
    ]);

    $response = $this
        ->actingAs($user)
        ->getJson(route('search.index', ['q' => 'factorisation']));

    $response
        ->assertOk()
        ->assertJsonPath('posts.0.id', $post->id);
});

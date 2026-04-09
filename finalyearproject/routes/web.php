<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\PostController;
use App\Models\Post;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    syncLangFiles('auth');

    if (Auth::check()) {
        return redirect()->route('homePage');
    }

    return Inertia::render('auth/login', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/homePage', function () {
        $posts = Post::query()
            ->with(['user:id,name', 'language:id,code,name'])
            ->withCount(['likes', 'comments'])
            ->latest()
            ->get()
            ->map(function (Post $post) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'content' => $post->content,
                    'image' => $post->image,
                    'created_at' => optional($post->created_at)->toISOString(),
                    'user' => $post->user ? [
                        'name' => $post->user->name,
                    ] : null,
                    'language' => $post->language ? [
                        'code' => $post->language->code,
                        'name' => $post->language->name,
                    ] : null,
                    'likes_count' => $post->likes_count,
                    'comments_count' => $post->comments_count,
                ];
            });

        return Inertia::render('homePage', [
            'posts' => $posts,
        ]);
    })->name('homePage');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('popularPage', 'popularPage')->name('popularPage');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('createPostPage', 'createPostPage')->name('createPostPage');
    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
});


Route::get('/login/google', [GoogleAuthController::class, 'redirectToProvider'])->name('login.google');

Route::get('/login/google/callback', [GoogleAuthController::class, 'handleProviderCallback']);

Route::post('/change-language-setting', [LocaleController::class, 'switchMethod'])->name('language.switch');

require __DIR__.'/settings.php';

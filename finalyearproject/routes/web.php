<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CommentLikeController;
use App\Http\Controllers\FollowerController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfilePageController;
use App\Http\Controllers\PostSaveController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;
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
    Route::get('/homePage', [PostController::class, 'index'])->name('homePage');
    Route::get('/questions', [PostController::class, 'questions'])->name('questionsPage');
    Route::get('/learning-materials', [PostController::class, 'learningMaterials'])->name('learningMaterialsPage');
    Route::post('/profilePage/cover', [ProfilePageController::class, 'updateCover'])->name('profilePage.cover.update');
    Route::get('/profilePage/{user?}', [ProfilePageController::class, 'show'])->whereNumber('user')->name('profilePage');
    Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show');
    Route::get('/posts/{post}/comments/mentions', [CommentController::class, 'mentionables'])->name('comments.mentionables');
    Route::post('/posts/{post}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::post('/comments/{comment}/like', [CommentLikeController::class, 'toggle'])->name('comments.like.toggle');
    Route::inertia('popularPage', 'popularPage')->name('popularPage');
    Route::inertia('createPostPage', 'createPostPage')->name('createPostPage');
    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
    Route::post('/posts/{posts}/like',[LikeController::class,'toggle'])->name('like.toggle');
    Route::post('/posts/{post}/save', [PostSaveController::class, 'toggle'])->name('posts.save.toggle');
    Route::post('/users/{user}/follow', [FollowerController::class, 'toggle'])->name('users.follow.toggle');
});

Route::get('/login/google', [GoogleAuthController::class, 'redirectToProvider'])->name('login.google');

Route::get('/login/google/callback', [GoogleAuthController::class, 'handleProviderCallback']);

Route::post('/change-language-setting', [LocaleController::class, 'switchMethod'])->name('language.switch');

require __DIR__.'/callAI.php';

require __DIR__.'/settings.php';

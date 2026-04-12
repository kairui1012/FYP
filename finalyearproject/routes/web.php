<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfilePageController;
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
    Route::post('/profilePage/cover', [ProfilePageController::class, 'updateCover'])->name('profilePage.cover.update');
    Route::get('/profilePage/{user?}', [ProfilePageController::class, 'show'])->whereNumber('user')->name('profilePage');
    Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show');
    Route::inertia('popularPage', 'popularPage')->name('popularPage');
    Route::inertia('createPostPage', 'createPostPage')->name('createPostPage');
    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
    Route::post('/posts/{posts}/like',[LikeController::class,'toggle'])->name('like.toggle');
});

Route::get('/login/google', [GoogleAuthController::class, 'redirectToProvider'])->name('login.google');

Route::get('/login/google/callback', [GoogleAuthController::class, 'handleProviderCallback']);

Route::post('/change-language-setting', [LocaleController::class, 'switchMethod'])->name('language.switch');

require __DIR__.'/callAI.php';

require __DIR__.'/settings.php';

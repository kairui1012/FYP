<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\LocaleController;
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
    Route::inertia('homePage', 'homePage')->name('homePage');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('popularPage', 'popularPage')->name('popularPage');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('createPostPage', 'createPostPage')->name('createPostPage');
});


Route::get('/login/google', [GoogleAuthController::class, 'redirectToProvider'])->name('login.google');

Route::get('/login/google/callback', [GoogleAuthController::class, 'handleProviderCallback']);

Route::post('/change-language-setting', [LocaleController::class, 'switchMethod'])->name('language.switch');

require __DIR__.'/settings.php';

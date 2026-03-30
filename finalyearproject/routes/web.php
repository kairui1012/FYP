<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('homePage', 'homePage')->name('homePage');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('popularPage', 'popularPage')->name('popularPage');
});


Route::get('/login/google', [GoogleAuthController::class, 'redirectToProvider'])->name('login.google');

Route::get('/login/google/callback', [GoogleAuthController::class, 'handleProviderCallback']);

require __DIR__.'/settings.php';

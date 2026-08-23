<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TeacherCertificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Profile (auth)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

/*
|--------------------------------------------------------------------------
| Account settings (auth + verified)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // --- Password ---
    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    // --- Appearance ---
    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    // --- Teacher certification ---
    Route::get('settings/teacher-certification', [TeacherCertificationController::class, 'show'])
        ->name('teacher-certification.show');
    Route::post('settings/teacher-certification', [TeacherCertificationController::class, 'store'])
        ->name('teacher-certification.store');
    Route::get('settings/teacher-certification/documents/{document}', [TeacherCertificationController::class, 'viewDocument'])
        ->name('teacher-certification.document.view');
});

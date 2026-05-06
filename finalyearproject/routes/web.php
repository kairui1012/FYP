<?php

use App\Http\Controllers\AchievementsController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\BookmarkFolderController;
use App\Http\Controllers\UserFeaturedBadgeController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CommentLikeController;
use App\Http\Controllers\CommentReportController;
use App\Http\Controllers\FollowerController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\PostBookmarkController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostCreateController;
use App\Http\Controllers\PostPopularController;
use App\Http\Controllers\PostBookmarkToggleController;
use App\Http\Controllers\ProfilePageController;
use App\Http\Controllers\SearchController;
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
    Route::get('/homePage', [PostController::class, 'index'])->name('homePage');
    Route::get('/posts', [PostController::class, 'index'])->name('posts.index');
    Route::get('/learning/overview', [PostController::class, 'learningOverview'])->name('learning.overview');
    Route::get('/questions', [PostController::class, 'questions'])->name('questionsPage');
    Route::get('/learning-materials', [PostController::class, 'learningMaterials'])->name('learningMaterialsPage');
    Route::get('/following', [FollowerController::class, 'index'])->name('followingPage');
    Route::get('/profilePage/{user?}', [ProfilePageController::class, 'show'])->whereNumber('user')->name('profilePage');
    Route::post('/profilePage', [ProfilePageController::class, 'update'])->name('profilePage.update');
    Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show');
    Route::post('/posts/{post}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::patch('/comments/{comment}', [CommentController::class, 'update'])->name('comments.update');
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');
    Route::post('/comments/{comment}/vote', [CommentLikeController::class, 'toggle'])->name('comments.vote.toggle');
    Route::post('/comments/{comment}/report', [CommentReportController::class, 'store'])->name('comments.report');
    Route::get('/popularPage', [PostPopularController::class, 'index'])->name('popularPage');
    Route::get('/createPostPage', [PostCreateController::class, 'create'])->name('createPostPage');
    Route::get('/leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard');
    Route::post('/leaderboard/toggle-visibility', [LeaderboardController::class, 'toggleVisibility'])->name('leaderboard.toggle-visibility');
    Route::post('/leaderboard/toggle-title-badge', [LeaderboardController::class, 'toggleTitleBadge'])->name('leaderboard.toggle-title-badge');
    Route::post('/posts', [PostCreateController::class, 'store'])->name('posts.store');
    Route::patch('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');
    Route::post('/posts/{post}/complete', [PostController::class, 'completeLesson'])->name('posts.complete');
    Route::post('/posts/{post}/complete-quiz', [PostController::class, 'completeQuiz'])->name('posts.completeQuiz');
    Route::post('/posts/{post}/material-feedback', [PostController::class, 'materialFeedback'])->name('posts.materialFeedback');
    Route::delete('/posts/{post}/material-feedback', [PostController::class, 'destroyMaterialFeedback'])->name('posts.materialFeedback.destroy');
    Route::post('/posts/{posts}/like', [LikeController::class, 'toggle'])->name('like.toggle');
    Route::post('/posts/{post}/bookmark', [PostBookmarkToggleController::class, 'toggle'])->name('posts.bookmark.toggle');
    Route::post('/users/{user}/follow', [FollowerController::class, 'toggle'])->name('users.follow.toggle');
    Route::post('/users/{user}/featured-badges', [UserFeaturedBadgeController::class, 'update'])->name('users.featured-badges.update');
    Route::post('/bookmarks/folders', [BookmarkFolderController::class, 'store'])->name('bookmarks.folders.store');
    Route::patch('/bookmarks/folders/{bookmarkFolder}', [BookmarkFolderController::class, 'update'])->name('bookmarks.folders.update');
    Route::delete('/bookmarks/folders/{bookmarkFolder}', [BookmarkFolderController::class, 'destroy'])->name('bookmarks.folders.destroy');
    Route::post('/bookmarks/posts/{post}/move', [BookmarkFolderController::class, 'movePost'])->name('bookmarks.posts.move');

    // New pages routes
    Route::get('/achievements', [AchievementsController::class, 'index'])->name('achievements');
    Route::get('/categories', [PostController::class, 'categories'])->name('categories');
    Route::get('/rules', fn () => Inertia::render('RulesPage'))->name('rules');
    Route::get('/teacher/material-insights', [PostController::class, 'teacherMaterialInsights'])->name('teacher.material-insights');
    Route::get('/bookmarks', [PostBookmarkController::class, 'index'])->name('bookmarks');
    Route::get('/search', [SearchController::class, 'search'])->name('search');
});

Route::get('/login/google', [GoogleAuthController::class, 'redirectToProvider'])->name('login.google');

Route::get('/login/google/callback', [GoogleAuthController::class, 'handleProviderCallback']);

Route::get('/privacy-policy', fn () => Inertia::render('PrivacyPolicyPage'))->name('privacy-policy');
Route::get('/terms-of-service', fn () => Inertia::render('TermsOfServicePage'))->name('terms-of-service');

Route::post('/change-language-setting', [LocaleController::class, 'switchMethod'])->name('language.switch');

// Admin routes
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => redirect()->route('admin.users'))->name('index');
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::patch('/users/{user}/role', [AdminController::class, 'updateUserRole'])->name('users.role');
    Route::patch('/users/{user}/toggle-block', [AdminController::class, 'toggleBlock'])->name('users.toggle-block');
    Route::get('/reports', [AdminController::class, 'reports'])->name('reports');
    Route::delete('/reports/{report}', [AdminController::class, 'deleteReport'])->name('reports.delete');
    Route::get('/teacher-applications', [AdminController::class, 'teacherApplications'])->name('teacher-applications');
    Route::patch('/teacher-applications/{application}/approve', [AdminController::class, 'approveApplication'])->name('teacher-applications.approve');
    Route::patch('/teacher-applications/{application}/reject', [AdminController::class, 'rejectApplication'])->name('teacher-applications.reject');
    Route::patch('/teacher-applications/{application}/toggle-verification', [AdminController::class, 'toggleVerification'])->name('teacher-applications.toggle-verification');
    Route::get('/verification-documents/{document}/download', [AdminController::class, 'downloadVerificationDocument'])->name('verification-document.download');
});

// Teacher application (any auth user can submit)
Route::middleware(['auth', 'verified'])->post('/teacher-applications', function (\Illuminate\Http\Request $request) {
    $request->validate(['qualification' => 'required|string|max:255', 'bio' => 'nullable|string|max:2000']);
    \App\Models\TeacherApplication::create([
        'user_id'       => $request->user()->id,
        'qualification' => $request->qualification,
        'bio'           => $request->bio,
    ]);
    return back()->with('success', 'Application submitted.');
})->name('teacher-applications.store');

require __DIR__.'/callAI.php';

require __DIR__.'/settings.php';

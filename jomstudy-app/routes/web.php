<?php

use App\Http\Controllers\AchievementsController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CommentLikeController;
use App\Http\Controllers\CommentReportController;
use App\Http\Controllers\FollowerController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\PostBookmarkController;
use App\Http\Controllers\PostBookmarkToggleController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostCreateController;
use App\Http\Controllers\PostPopularController;
use App\Http\Controllers\PostQuizController;
use App\Http\Controllers\PostReportController;
use App\Http\Controllers\ProfilePageController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\StudyMaterialFeedbackController;
use App\Http\Controllers\TeacherMaterialInsightsController;
use App\Http\Controllers\UserFeaturedBadgeController;
use App\Models\TeacherApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

/*
|--------------------------------------------------------------------------
| Public pages
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('feed.index');
    }

    syncLangFiles('auth');

    return Inertia::render('LandingPage', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('/privacy-policy', fn () => Inertia::render('privacyPolicyPage'))->name('legal.privacy');
Route::get('/terms-of-service', fn () => Inertia::render('termsOfServicePage'))->name('legal.terms');

Route::get('/sitemap.xml', function () {
    $lastmod = now()->toDateString();
    $urls = [
        [
            'loc' => url('/'),
            'lastmod' => $lastmod,
            'changefreq' => 'daily',
            'priority' => '1.0',
        ],
        [
            'loc' => route('legal.privacy'),
            'lastmod' => $lastmod,
            'changefreq' => 'monthly',
            'priority' => '0.3',
        ],
        [
            'loc' => route('legal.terms'),
            'lastmod' => $lastmod,
            'changefreq' => 'monthly',
            'priority' => '0.3',
        ],
    ];

    $xml = view('sitemap', ['urls' => $urls])->render();

    return response($xml, 200)->header('Content-Type', 'application/xml');
})->name('sitemap');

/*
|--------------------------------------------------------------------------
| Authentication and localization
|--------------------------------------------------------------------------
*/

Route::get('/login/google', [GoogleAuthController::class, 'redirectToProvider'])->name('auth.google.redirect');
Route::get('/login/google/callback', [GoogleAuthController::class, 'handleProviderCallback'])->name('auth.google.callback');
Route::post('/change-language-setting', [LocaleController::class, 'switchMethod'])->name('locale.update');

/*
|--------------------------------------------------------------------------
| Authenticated application
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    // Feeds and discovery
    Route::get('/homePage', [PostController::class, 'index'])->name('feed.index');
    Route::get('/posts', [PostController::class, 'index'])->name('posts.index');
    Route::get('/following', [FollowerController::class, 'index'])->name('following.index');
    Route::get('/popularPage', [PostPopularController::class, 'index'])->name('popular.index');
    Route::get('/categories', [PostController::class, 'categories'])->name('categories.index');
    Route::get('/search', [SearchController::class, 'search'])->name('search.index');

    // Posts
    Route::get('/createPostPage', [PostCreateController::class, 'create'])->name('posts.create');
    Route::post('/posts', [PostCreateController::class, 'store'])->name('posts.store');
    Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show');
    Route::patch('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');
    Route::post('/posts/{post}/report', [PostReportController::class, 'store'])->name('posts.reports.store');
    Route::post('/posts/{posts}/like', [LikeController::class, 'toggle'])->name('posts.likes.toggle');
    Route::post('/posts/{post}/bookmark', [PostBookmarkToggleController::class, 'toggle'])->name('posts.bookmarks.toggle');

    // Comments
    Route::post('/posts/{post}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::patch('/comments/{comment}', [CommentController::class, 'update'])->name('comments.update');
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');
    Route::post('/comments/{comment}/vote', [CommentLikeController::class, 'toggle'])->name('comments.votes.toggle');
    Route::post('/comments/{comment}/report', [CommentReportController::class, 'store'])->name('comments.reports.store');

    // Learning materials and quizzes
    Route::post('/posts/{post}/complete-quiz', [PostQuizController::class, 'completeQuiz'])->name('posts.quiz.complete');
    Route::post('/posts/{post}/material-feedback', [StudyMaterialFeedbackController::class, 'store'])->name('posts.material-feedback.store');
    Route::get('/teacher/material-insights', [TeacherMaterialInsightsController::class, 'index'])->name('teacher.material-insights.index');

    // Profiles and social actions
    Route::get('/profilePage/{user?}', [ProfilePageController::class, 'show'])->whereNumber('user')->name('profiles.show');
    Route::post('/profilePage', [ProfilePageController::class, 'update'])->name('profiles.update');
    Route::post('/users/{user}/follow', [FollowerController::class, 'toggle'])->name('users.follow.toggle');
    Route::post('/users/{user}/featured-badges', [UserFeaturedBadgeController::class, 'update'])->name('users.featured-badges.update');

    // Progress and saved content
    Route::get('/leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard.index');
    Route::post('/leaderboard/toggle-visibility', [LeaderboardController::class, 'toggleVisibility'])->name('leaderboard.visibility.toggle');
    Route::post('/leaderboard/toggle-title-badge', [LeaderboardController::class, 'toggleTitleBadge'])->name('leaderboard.title-badge.toggle');
    Route::get('/achievements', [AchievementsController::class, 'index'])->name('achievements.index');
    Route::get('/bookmarks', [PostBookmarkController::class, 'index'])->name('bookmarks.index');

    // Community information
    Route::get('/rules', fn () => Inertia::render('rulesPage'))->name('rules.show');
});

/*
|--------------------------------------------------------------------------
| Teacher applications
|--------------------------------------------------------------------------
| Authenticated users can submit, including unverified students.
*/

Route::middleware('auth')->post('/teacher-applications', function (Request $request) {
    $request->validate([
        'qualification' => 'required|string|max:255',
        'bio' => 'nullable|string|max:2000',
    ]);

    TeacherApplication::create([
        'user_id' => $request->user()->id,
        'qualification' => $request->qualification,
        'bio' => $request->bio,
    ]);

    return back()->with('success', 'Application submitted.');
})->name('teacher-applications.store');

/*
|--------------------------------------------------------------------------
| Administration
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => redirect()->route('admin.users.index'))->name('index');

    // Users
    Route::get('/users', [AdminController::class, 'users'])->name('users.index');
    Route::patch('/users/{user}/role', [AdminController::class, 'updateUserRole'])->name('users.role.update');
    Route::patch('/users/{user}/toggle-block', [AdminController::class, 'toggleBlock'])->name('users.block.toggle');

    // Reports
    Route::get('/reports', [AdminController::class, 'reports'])->name('reports.index');
    Route::delete('/reports/comments/{report}', [AdminController::class, 'deleteCommentReport'])->name('comment-reports.destroy');
    Route::delete('/reports/comments/{comment}/content', [AdminController::class, 'deleteReportedComment'])->name('reported-comments.destroy');
    Route::delete('/reports/posts/{report}', [AdminController::class, 'deletePostReport'])->name('post-reports.destroy');
    Route::delete('/reports/posts/{post}/content', [AdminController::class, 'deleteReportedPost'])->name('reported-posts.destroy');

    // Teacher verification
    Route::get('/teacher-applications', [AdminController::class, 'teacherApplications'])->name('teacher-applications.index');
    Route::patch('/teacher-applications/{application}/approve', [AdminController::class, 'approveApplication'])->name('teacher-applications.approve');
    Route::patch('/teacher-applications/{application}/reject', [AdminController::class, 'rejectApplication'])->name('teacher-applications.reject');
    Route::patch('/teacher-applications/{application}/toggle-verification', [AdminController::class, 'toggleVerification'])->name('teacher-applications.verification.toggle');
    Route::get('/verification-documents/{document}/download', [AdminController::class, 'downloadVerificationDocument'])->name('verification-documents.download');
});

/*
|--------------------------------------------------------------------------
| Additional route files
|--------------------------------------------------------------------------
*/

require __DIR__.'/ai/ai-routes.php';
require __DIR__.'/settings.php';

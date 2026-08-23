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
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

/*
|--------------------------------------------------------------------------
| Public landing page
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('homePage');
    }

    syncLangFiles('auth');

    return Inertia::render('landingPage', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

/*
|--------------------------------------------------------------------------
| Authenticated app (auth + verified)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {

    // --- Pages / feeds ---
    Route::get('/homePage', [PostController::class, 'index'])->name('homePage');
    Route::get('/posts', [PostController::class, 'index'])->name('posts.index');
    Route::get('/learning/overview', [PostController::class, 'learningOverview'])->name('learning.overview');
    Route::get('/questions', [PostController::class, 'questions'])->name('questionsPage');
    Route::get('/learning-materials', [PostController::class, 'learningMaterials'])->name('learningMaterialsPage');
    Route::get('/following', [FollowerController::class, 'index'])->name('followingPage');
    Route::get('/popularPage', [PostPopularController::class, 'index'])->name('popularPage');
    Route::get('/createPostPage', [PostCreateController::class, 'create'])->name('createPostPage');

    // --- Profile ---
    Route::get('/profilePage/{user?}', [ProfilePageController::class, 'show'])->whereNumber('user')->name('profilePage');
    Route::post('/profilePage', [ProfilePageController::class, 'update'])->name('profilePage.update');

    // --- Posts ---
    Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show');
    Route::post('/posts', [PostCreateController::class, 'store'])->name('posts.store');
    Route::patch('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');
    Route::post('/posts/{post}/report', [PostReportController::class, 'store'])->name('posts.report');
    Route::post('/posts/{posts}/like', [LikeController::class, 'toggle'])->name('like.toggle');

    // --- Comments ---
    Route::post('/posts/{post}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::patch('/comments/{comment}', [CommentController::class, 'update'])->name('comments.update');
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');
    Route::post('/comments/{comment}/vote', [CommentLikeController::class, 'toggle'])->name('comments.vote.toggle');
    Route::post('/comments/{comment}/report', [CommentReportController::class, 'store'])->name('comments.report');

    // --- Lessons / quizzes / material feedback ---
    Route::post('/posts/{post}/complete', [PostQuizController::class, 'completeLesson'])->name('posts.complete');
    Route::post('/posts/{post}/complete-quiz', [PostQuizController::class, 'completeQuiz'])->name('posts.completeQuiz');
    Route::post('/posts/{post}/material-feedback', [StudyMaterialFeedbackController::class, 'store'])->name('posts.materialFeedback');
    Route::delete('/posts/{post}/material-feedback', [StudyMaterialFeedbackController::class, 'destroy'])->name('posts.materialFeedback.destroy');

    // --- Leaderboard ---
    Route::get('/leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard');
    Route::post('/leaderboard/toggle-visibility', [LeaderboardController::class, 'toggleVisibility'])->name('leaderboard.toggle-visibility');
    Route::post('/leaderboard/toggle-title-badge', [LeaderboardController::class, 'toggleTitleBadge'])->name('leaderboard.toggle-title-badge');

    // --- Social: follow / featured badges ---
    Route::post('/posts/{post}/bookmark', [PostBookmarkToggleController::class, 'toggle'])->name('posts.bookmark.toggle');
    Route::post('/users/{user}/follow', [FollowerController::class, 'toggle'])->name('users.follow.toggle');
    Route::post('/users/{user}/featured-badges', [UserFeaturedBadgeController::class, 'update'])->name('users.featured-badges.update');

    // --- Other pages ---
    Route::get('/achievements', [AchievementsController::class, 'index'])->name('achievements');
    Route::get('/categories', [PostController::class, 'categories'])->name('categories');
    Route::get('/rules', fn () => Inertia::render('RulesPage'))->name('rules');
    Route::get('/teacher/material-insights', [TeacherMaterialInsightsController::class, 'index'])->name('teacher.material-insights');
    Route::get('/bookmarks', [PostBookmarkController::class, 'index'])->name('bookmarks');
    Route::get('/search', [SearchController::class, 'search'])->name('search');
});

/*
|--------------------------------------------------------------------------
| Google OAuth
|--------------------------------------------------------------------------
*/
Route::get('/login/google', [GoogleAuthController::class, 'redirectToProvider'])->name('login.google');
Route::get('/login/google/callback', [GoogleAuthController::class, 'handleProviderCallback']);

/*
|--------------------------------------------------------------------------
| Static / SEO pages
|--------------------------------------------------------------------------
*/
Route::get('/privacy-policy', fn () => Inertia::render('privacyPolicyPage'))->name('privacy-policy');
Route::get('/terms-of-service', fn () => Inertia::render('TermsOfServicePage'))->name('terms-of-service');

/*
|--------------------------------------------------------------------------
| Sitemap
|--------------------------------------------------------------------------
*/

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
            'loc' => route('privacy-policy'),
            'lastmod' => $lastmod,
            'changefreq' => 'monthly',
            'priority' => '0.3',
        ],
        [
            'loc' => route('terms-of-service'),
            'lastmod' => $lastmod,
            'changefreq' => 'monthly',
            'priority' => '0.3',
        ],
    ];

    $xml = view('sitemap', [
        'urls' => $urls,
    ])->render();

    return response($xml, 200)->header('Content-Type', 'application/xml');
})->name('sitemap');

/*
|--------------------------------------------------------------------------
| Localization
|--------------------------------------------------------------------------
*/
Route::post('/change-language-setting', [LocaleController::class, 'switchMethod'])->name('language.switch');

/*
|--------------------------------------------------------------------------
| Admin (auth + admin, prefix: /admin)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => redirect()->route('admin.users'))->name('index');
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::patch('/users/{user}/role', [AdminController::class, 'updateUserRole'])->name('users.role');
    Route::patch('/users/{user}/toggle-block', [AdminController::class, 'toggleBlock'])->name('users.toggle-block');
    Route::get('/reports', [AdminController::class, 'reports'])->name('reports');
    Route::delete('/reports/comments/{report}', [AdminController::class, 'deleteCommentReport'])->name('reports.comments.delete');
    Route::delete('/reports/comments/{comment}/content', [AdminController::class, 'deleteReportedComment'])->name('reports.comments.content.delete');
    Route::delete('/reports/posts/{report}', [AdminController::class, 'deletePostReport'])->name('reports.posts.delete');
    Route::delete('/reports/posts/{post}/content', [AdminController::class, 'deleteReportedPost'])->name('reports.posts.content.delete');
    Route::get('/teacher-applications', [AdminController::class, 'teacherApplications'])->name('teacher-applications');
    Route::patch('/teacher-applications/{application}/approve', [AdminController::class, 'approveApplication'])->name('teacher-applications.approve');
    Route::patch('/teacher-applications/{application}/reject', [AdminController::class, 'rejectApplication'])->name('teacher-applications.reject');
    Route::patch('/teacher-applications/{application}/toggle-verification', [AdminController::class, 'toggleVerification'])->name('teacher-applications.toggle-verification');
    Route::get('/verification-documents/{document}/download', [AdminController::class, 'downloadVerificationDocument'])->name('verification-document.download');
});

/*
|--------------------------------------------------------------------------
| Teacher application
|--------------------------------------------------------------------------
| Authenticated users can submit, including unverified students.
|
*/
Route::middleware(['auth'])->post('/teacher-applications', function (\Illuminate\Http\Request $request) {
    $request->validate(['qualification' => 'required|string|max:255', 'bio' => 'nullable|string|max:2000']);
    \App\Models\TeacherApplication::create([
        'user_id' => $request->user()->id,
        'qualification' => $request->qualification,
        'bio' => $request->bio,
    ]);

    return back()->with('success', 'Application submitted.');
})->name('teacher-applications.store');

/*
|--------------------------------------------------------------------------
| Additional route files
|--------------------------------------------------------------------------
*/
require __DIR__.'/callAI.php';
require __DIR__.'/settings.php';

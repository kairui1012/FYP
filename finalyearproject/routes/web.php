<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\AchievementsController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CommentLikeController;
use App\Http\Controllers\BookmarkFolderController;
use App\Http\Controllers\FollowerController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\PostBookmarkController;
use App\Http\Controllers\PostCreateController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostPopularController;
use App\Http\Controllers\ProfilePageController;
use App\Http\Controllers\PostSaveController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\SearchController;
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
    Route::get('/posts', [PostController::class, 'index'])->name('posts.index');
    Route::get('/learning/overview', [PostController::class, 'learningOverview'])->name('learning.overview');
    Route::get('/questions', [PostController::class, 'questions'])->name('questionsPage');
    Route::get('/learning-materials', [PostController::class, 'learningMaterials'])->name('learningMaterialsPage');
    Route::get('/following', [FollowerController::class, 'index'])->name('followingPage');
    Route::get('/profilePage/{user?}', [ProfilePageController::class, 'show'])->whereNumber('user')->name('profilePage');
    Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show');
    Route::post('/posts/{post}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::patch('/comments/{comment}', [CommentController::class, 'update'])->name('comments.update');
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');
    Route::post('/comments/{comment}/vote', [CommentLikeController::class, 'toggle'])->name('comments.vote.toggle');
    Route::get('/popularPage', [PostPopularController::class, 'index'])->name('popularPage');
    Route::get('/createPostPage', [PostCreateController::class, 'create'])->name('createPostPage');
    Route::get('/leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard');
    Route::post('/posts', [PostCreateController::class, 'store'])->name('posts.store');
    Route::patch('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');
    Route::post('/posts/{post}/complete', [PostController::class, 'completeLesson'])->name('posts.complete');
    Route::post('/posts/{post}/complete-quiz', [PostController::class, 'completeQuiz'])->name('posts.completeQuiz');
    Route::post('/posts/{posts}/like',[LikeController::class,'toggle'])->name('like.toggle');
    Route::post('/posts/{post}/save', [PostSaveController::class, 'toggle'])->name('posts.save.toggle');
    Route::post('/users/{user}/follow', [FollowerController::class, 'toggle'])->name('users.follow.toggle');
    Route::post('/bookmarks/folders', [BookmarkFolderController::class, 'store'])->name('bookmarks.folders.store');
    Route::patch('/bookmarks/folders/{bookmarkFolder}', [BookmarkFolderController::class, 'update'])->name('bookmarks.folders.update');
    Route::delete('/bookmarks/folders/{bookmarkFolder}', [BookmarkFolderController::class, 'destroy'])->name('bookmarks.folders.destroy');
    Route::post('/bookmarks/posts/{post}/move', [BookmarkFolderController::class, 'movePost'])->name('bookmarks.posts.move');
    
    // New pages routes
    Route::get('/achievements', [AchievementsController::class, 'index'])->name('achievements');
    Route::get('/categories', [PostController::class, 'categories'])->name('categories');
    Route::get('/bookmarks', [PostBookmarkController::class, 'index'])->name('bookmarks');
    Route::get('/search', [SearchController::class, 'search'])->name('search');
});

Route::get('/login/google', [GoogleAuthController::class, 'redirectToProvider'])->name('login.google');

Route::get('/login/google/callback', [GoogleAuthController::class, 'handleProviderCallback']);

Route::post('/change-language-setting', [LocaleController::class, 'switchMethod'])->name('language.switch');

require __DIR__.'/callAI.php';

require __DIR__.'/settings.php';
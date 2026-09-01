<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\LeaderboardTitleService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    public function __construct(private readonly LeaderboardTitleService $leaderboardTitleService) {}

    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'lang' => $this->langForRoute($request),
            'locale' => app()->getLocale(),
            'availableLocales' => [
                'en' => 'English',
                'zh' => '中文',
                'my' => 'BM',
            ],
            'auth' => [
                'user' => $this->serializeAuthUser($request->user()),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * Only share the translation namespaces required by the current page.
     *
     * This keeps the Inertia data-page attribute small instead of embedding
     * every generated language file in every initial HTML response.
     *
     * @return array<string, mixed>
     */
    private function langForRoute(Request $request): array
    {
        $files = ['navigation', 'language_label', 'errors'];
        $routeName = $request->route()?->getName();

        $pageFiles = match ($routeName) {
            'home' => ['landing', 'auth'],

            'feed.index', 'posts.index',
            'following.index', 'popular.index', 'posts.show', 'search.index' => [
                'home', 'createPost', 'comment', 'aiTranslate', 'profile',
                'bookmark', 'achievement', 'subjects', 'category', 'popular',
            ],

            'posts.create' => [
                'createPost', 'subjects', 'category', 'aiTranslate',
            ],

            'profiles.show' => [
                'profile', 'achievement', 'bookmark', 'comment', 'aiTranslate',
                'createPost', 'subjects', 'category',
            ],

            'categories.index' => [
                'category', 'subjects', 'comment', 'aiTranslate', 'profile',
                'bookmark', 'achievement', 'createPost',
            ],

            'achievements.index' => ['achievement'],
            'leaderboard.index' => ['leaderboard', 'achievement', 'profile'],
            'bookmarks.index' => [
                'bookmark', 'comment', 'aiTranslate', 'profile', 'achievement',
                'createPost', 'subjects', 'category',
            ],
            'rules.show' => ['rules', 'achievement', 'leaderboard'],
            'legal.privacy', 'legal.terms' => ['legal'],

            'profile.edit', 'user-password.edit', 'appearance.edit',
            'teacher-certification.show' => [
                'settings', 'profile', 'auth', 'achievement',
            ],

            'teacher.material-insights.index' => ['admin', 'subjects', 'category', 'createPost'],

            default => str_starts_with((string) $routeName, 'admin.')
                ? ['admin', 'comment', 'profile', 'achievement', 'subjects', 'category']
                : ['auth'],
        };

        return array_replace_recursive(...array_map(
            static fn (string $file): array => syncLangFiles($file),
            array_unique([...$files, ...$pageFiles]),
        ));
    }

    private function serializeAuthUser(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        $user->loadMissing([
            'socialAccounts:id,user_id,avatar',
        ]);

        return [
            ...$user->toArray(),
            'avatar' => $user->socialAccounts
                ->first(fn ($account) => ! empty($account->avatar))
                ?->avatar,
            'leaderboard_title' => $this->leaderboardTitleService->titleForUserId($user->id),
        ];
    }
}

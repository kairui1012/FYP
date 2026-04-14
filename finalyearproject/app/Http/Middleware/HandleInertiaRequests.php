<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
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
        $lang = array_replace_recursive(
            syncLangFiles('navigation'),
            syncLangFiles('auth'),
            syncLangFiles('createPost'),
            syncLangFiles('language_label'),
            syncLangFiles('settings'),
            syncLangFiles('profile'),
            syncLangFiles('comment'),
            syncLangFiles('aiTranslate'),
        );

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'lang' => $lang,
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
        ];
    }
}

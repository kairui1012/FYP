<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    /**
     * Switch user's locale. Can be set explicitly or cycle through supported locales.
     * Updates session, user record, and sets cookie for persistence.
     * Supported locales: en, zh, my.
     */
    public function switchMethod(Request $request): RedirectResponse
    {
        $supportedLocales = ['en', 'zh', 'my'];
        $requestedLocale = $request->input('locale', $request->query('locale'));

        if (is_string($requestedLocale) && in_array($requestedLocale, $supportedLocales, true)) {
            $nextLocale = $requestedLocale;
        } else {
            $currentLocale = app()->getLocale();

            $currentIndex = array_search($currentLocale, $supportedLocales, true);
            if ($currentIndex === false) {
                $currentIndex = 0;
            }

            $nextIndex = ($currentIndex + 1) % count($supportedLocales);
            $nextLocale = $supportedLocales[$nextIndex];
        }

        $request->session()->put('locale', $nextLocale);

        if ($request->user() instanceof User) {
            $request->user()->forceFill(['locale' => $nextLocale])->saveQuietly();
        }

        $previousUrl = url()->previous() ?: route('home');

        return redirect()
            ->to($previousUrl)
            ->withCookie(cookie('locale', $nextLocale, 60 * 24 * 365));
    }
}
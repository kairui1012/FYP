<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $supportedLocales = ['en', 'zh','my'];
        $locale = $request->user()?->locale
            ?? $request->session()->get('locale')
            ?? $request->cookie('locale')
            ?? config('app.locale');

        if (! in_array($locale, $supportedLocales, true)) {
            $locale = config('app.locale');
        }

        App::setLocale($locale);
        $request->session()->put('locale', $locale);

        if ($request->user() instanceof User && $request->user()->locale !== $locale) {
            $request->user()->forceFill(['locale' => $locale])->saveQuietly();
        }

        syncLangFiles('navigation');
        syncLangFiles('createPost');
        syncLangFiles('category');
        syncLangFiles('achievement');
        syncLangFiles('bookmark');
        syncLangFiles('popular');

        return $next($request);
    }
}
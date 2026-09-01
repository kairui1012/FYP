<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\EnsureUserNotBlocked;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->alias(['admin' => AdminMiddleware::class]);
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            SetLocale::class,
            EnsureUserNotBlocked::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            $status = $response->getStatusCode();
            $useDeveloperExceptionPage = config('app.debug') && ! app()->environment('production');

            if (
                $useDeveloperExceptionPage
                || $request->expectsJson()
                || ! in_array($status, [404, 500], true)
            ) {
                return $response;
            }

            $supportedLocales = ['en', 'zh', 'my'];
            $locale = $request->user()?->locale
                ?? ($request->hasSession() ? $request->session()->get('locale') : null)
                ?? $request->cookie('locale')
                ?? config('app.locale');

            if (! in_array($locale, $supportedLocales, true)) {
                $locale = config('app.locale');
            }

            app()->setLocale($locale);

            return Inertia::render('errors/ErrorPage', [
                'status' => $status,
                'lang' => array_replace_recursive(
                    syncLangFiles('navigation'),
                    syncLangFiles('language_label'),
                    syncLangFiles('errors'),
                ),
                'locale' => app()->getLocale(),
                'availableLocales' => [
                    'en' => 'English',
                    'zh' => '中文',
                    'my' => 'BM',
                ],
            ])->toResponse($request)->setStatusCode($status);
        });
    })->create();

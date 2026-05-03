## 5.1.1.16 Localization and Shared UI Unit Testing

### System Area
Localization/shared UI

### Responsibility
Provides multilingual UI state and shared app context.

### Locale Switching

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| LS-01 | Switch to a supported locale. | User submits `locale=zh` through the language switch route. | Locale is changed and the user is redirected back. | `LocaleController::switchMethod()` accepts `zh`, stores it in session, updates the authenticated user's `locale` when present, and redirects to the previous URL with a `locale` cookie. | Pass |
| LS-02 | Open the language switch dropdown. | User is on any Inertia page. | Only supported locales are offered. | `BtnChangeLang` exposes only `en`, `zh`, and `my`, and posts the selected locale to `/change-language-setting`. | Pass |
| LS-03 | Submit an unsupported locale. | User submits `locale=fr` to the language switch route. | Unsupported locale should be rejected. | The controller does not reject the value; it falls back to the next supported locale in the cycle based on `app()->getLocale()`. | Failed |
| LS-04 | Switch language as a guest. | Guest submits a valid locale. | Locale changes without requiring authentication. | The route is public; the session is updated and the cookie is set, but no user record is updated because there is no authenticated user. | Pass |

Locale Switching Testing Table

### Locale Persistence

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| LP-01 | Reload the app after switching locale. | Session or cookie already contains a supported locale. | The selected locale persists across the next request. | `SetLocale` reads the user locale first, then session, then cookie, sets the application locale, and writes the resolved locale back to session. | Pass |
| LP-02 | Open a page as an authenticated user. | User record already has `locale=my`. | The stored user locale is used instead of the cookie or session value. | `SetLocale` gives priority to `$request->user()?->locale`, so the authenticated user's stored locale wins. | Pass |
| LP-03 | Provide an invalid stored locale. | Session or cookie contains `locale=fr`. | Invalid locale should be normalized to the application default. | `SetLocale` checks `['en', 'zh', 'my']` and falls back to `config('app.locale')`, then stores that value in session. | Pass |
| LP-04 | Change language while signed in. | Authenticated user submits a valid locale. | The new locale is persisted for later visits. | `LocaleController::switchMethod()` updates the session, saves the locale on the user model with `saveQuietly()`, and sets a long-lived `locale` cookie. | Pass |

Locale Persistence Testing Table

### Inertia Shared Props

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| IP-01 | Load any Inertia page. | Guest request. | Shared props include the app name, locale, supported locales, auth state, and sidebar state. | `HandleInertiaRequests::share()` returns `name`, `lang`, `locale`, `availableLocales`, `auth.user`, and `sidebarOpen`. | Pass |
| IP-02 | Load any Inertia page as an authenticated user. | Logged-in request. | The authenticated user is available in shared props. | `serializeAuthUser()` returns the full user payload plus derived `avatar` and `leaderboard_title`, and that value is shared under `auth.user`. | Pass |
| IP-03 | Inspect the shared translation bundle. | Inertia page response. | Translation keys for the shared UI are present. | The shared `lang` payload merges `navigation`, `home`, `auth`, `createPost`, `language_label`, `settings`, `profile`, `comment`, `aiTranslate`, `leaderboard`, `subjects`, `category`, `achievement`, `bookmark`, `popular`, `errors`, `rules`, `admin`, and `legal`. | Pass |
| IP-04 | Expect flash messages in shared data. | Controller redirects with `success` or `error` flash data. | Flash messages should be exposed through Inertia shared props. | `HandleInertiaRequests::share()` does not define a `flash` key, so flash messages are not explicitly shared by this middleware. | Failed |

Inertia Shared Props Testing Table

### Appearance Cookie Handling

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| AC-01 | Load the root Blade layout with a dark appearance cookie. | `appearance=dark`. | The root HTML should render in dark mode. | `resources/views/app.blade.php` applies the `dark` class when `$appearance === 'dark'`, and `HandleAppearance` shares the cookie value to that view. | Pass |
| AC-02 | Load the root Blade layout with system appearance. | `appearance=system`. | The page should follow system color scheme preference. | The Blade layout leaves the class unset for `system`, and the inline script adds `dark` only when `window.matchMedia('(prefers-color-scheme: dark)')` matches. | Pass |
| AC-03 | Send an invalid appearance cookie. | `appearance=purple`. | Invalid appearance values should be rejected or normalized safely. | `HandleAppearance` shares the raw cookie value, and the root template only treats exact `dark` as dark; there is no validation or normalization for invalid values. | Failed |
| AC-04 | Use the appearance toggle UI. | User opens the appearance settings page. | The user should be able to switch appearance modes from the UI. | `AppearanceToggleTab` currently renders only a Light option, and `useAppearance()` forces `light` because `DARK_MODE_ENABLED` is `false`. | Failed |

Appearance Cookie Handling Testing Table

### Shared Layout Context

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SC-01 | Change locale while the main app shell is open. | User switches locale on an Inertia page. | The visible shell should refresh to match the new locale. | `resources/js/layouts/app/app-header-layout.tsx` uses `page.props.locale` as a key for `AppHeader` and `AppSidebar`, so the layout remounts when locale changes. | Pass |
| SC-02 | Change locale while the admin shell is open. | Admin user switches locale. | The admin shell should refresh to match the new locale. | `resources/js/layouts/admin/admin-layout.tsx` also keys `AppHeaderAdmin` by `page.props.locale`, so the admin header remounts on locale change. | Pass |
| SC-03 | Inspect the header language label. | Any page with the shared header. | The header should show the current locale from shared props. | `BtnChangeLang` reads `page.props.locale` and displays the current locale label from that shared value. | Pass |

Shared Layout Context Testing Table

### Custom 404 Page

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| NF-01 | Visit a missing web route. | Browser request for a route that does not exist. | A custom 404 page should be rendered. | The exception responder in `bootstrap/app.php` renders `Inertia::render('errors/ErrorPage')` for status 404 when the request is not JSON and the app is not using the developer exception page. | Pass |
| NF-02 | View the custom 404 page content. | 404 response is rendered. | The page should show localized error text and shared navigation actions. | `ErrorPage.tsx` uses `reactLang()` with `errors.not_found_*` strings and includes the language switch button plus home/back actions. | Pass |
| NF-03 | Trigger a missing route with a JSON request. | Request expects JSON. | The custom 404 page should still be returned. | The exception responder returns the original response when `$request->expectsJson()` is true, so the custom page is bypassed for JSON requests. | Failed |

Custom 404 Page Testing Table

### Custom 500 Page

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SF-01 | Trigger an unhandled server error. | Non-JSON request in production-like mode. | A custom 500 page should be rendered. | The exception responder renders `Inertia::render('errors/ErrorPage')` for status 500 when the request is not JSON and the developer exception page is not enabled. | Pass |
| SF-02 | View the custom 500 page content. | 500 response is rendered. | The page should show localized server error text and shared navigation actions. | `ErrorPage.tsx` switches to `errors.server_error_*` strings, shows the alert icon, and offers the home and refresh actions. | Pass |
| SF-03 | Trigger a server error while debugging or expecting JSON. | Debug mode or JSON request. | The custom 500 page should still be returned. | The exception responder returns the original response when app debug mode is active or the request expects JSON, so the custom page is bypassed in those cases. | Failed |

Custom 500 Page Testing Table

### Validation and Fallback Control

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| VF-01 | Submit a locale value that is not supported. | `locale=de`. | Unsupported locale should be rejected. | The locale switch controller does not reject it; it cycles to the next supported locale instead of blocking the request. | Failed |
| VF-02 | Load the app with an invalid locale in session or cookie. | `locale=de`. | The locale should fall back to the app default. | `SetLocale` falls back to `config('app.locale')` and writes the fallback value back to session before continuing. | Pass |
| VF-03 | Use an invalid appearance cookie value. | `appearance=blue`. | Invalid appearance values should be normalized or rejected. | The server shares the raw cookie value, and the Blade layout only treats exact `dark` as dark, so invalid values are not validated. | Failed |
| VF-04 | Request a missing route or server error as JSON. | `Accept: application/json`. | The custom error page should be bypassed. | The exception responder explicitly returns the framework response when the request expects JSON, so the Inertia error page is not rendered. | Pass |

Validation and Fallback Control Testing Table

### Coverage Summary

The inspected code provides supported locale switching for `en`, `zh`, and `my`, shared Inertia props for auth state and translation payloads, cookie-driven appearance handling, locale-aware app shell remounting, and custom 404/500 rendering through the exception responder. The main gaps are unsupported-locale rejection, explicit flash prop sharing, and a multi-theme appearance switch UI.

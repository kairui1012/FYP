<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirectToProvider()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleProviderCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect('/login')->with('error', 'The Google authorization verification sequence failed or was actively terminated, please try again.');
        }

        $provider = 'google';
        $providerId = $googleUser->getId();
        $email = $googleUser->getEmail();

        $socialAccount = SocialAccount::query()
            ->where('provider', $provider)
            ->where('provider_id', $providerId)
            ->first();

        if ($socialAccount) {
            if ((bool) $socialAccount->user?->is_blocked) {
                return redirect()->route('login')->withErrors([
                    'email' => __('auth.blocked'),
                ]);
            }

            Auth::login($socialAccount->user, true);

            return $this->redirectAfterLogin($socialAccount->user);
        }

        if (!$email) {
            return redirect('/login')->with('error', 'Google account email is missing, please use another login method.');
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            $name = $googleUser->getName() ?: explode('@', $email)[0];

            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make(str()->random(32)),
                'email_verified_at' => now(),
            ]);
        }

        if ((bool) $user->is_blocked) {
            return redirect()->route('login')->withErrors([
                'email' => __('auth.blocked'),
            ]);
        }

        SocialAccount::updateOrCreate(
            [
                'user_id' => $user->id,
                'provider' => $provider,
            ],
            [
                'provider_id' => $providerId,
                'avatar' => $googleUser->getAvatar(),
            ]
        );

        Auth::login($user, true);

        return $this->redirectAfterLogin($user);
    }

    private function redirectAfterLogin(User $user): RedirectResponse
    {
        if ($user->role === 'admin') {
            return redirect()->route('admin.users')->with('success', 'success verification');
        }

        return redirect()->intended('/homePage')->with('success', 'success verification');
    }
}

<?php

use App\Models\SocialAccount;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;

function fakeGoogleUser(string $providerId, string $email, string $name = 'Google User'): object
{
    return new class ($providerId, $email, $name) {
        public function __construct(
            private readonly string $providerId,
            private readonly string $email,
            private readonly string $name,
        ) {}

        public function getId(): string
        {
            return $this->providerId;
        }

        public function getEmail(): string
        {
            return $this->email;
        }

        public function getName(): string
        {
            return $this->name;
        }

        public function getAvatar(): string
        {
            return 'https://example.com/avatar.jpg';
        }
    };
}

function mockGoogleCallbackUser(object $googleUser): void
{
    Socialite::shouldReceive('driver')
        ->once()
        ->with('google')
        ->andReturnSelf();

    Socialite::shouldReceive('user')
        ->once()
        ->andReturn($googleUser);
}

test('admin users linked to google are redirected to admin users page', function () {
    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'role' => 'admin',
    ]);

    SocialAccount::factory()->create([
        'user_id' => $user->id,
        'provider' => 'google',
        'provider_id' => 'google-admin-id',
    ]);

    mockGoogleCallbackUser(fakeGoogleUser('google-admin-id', 'admin@example.com'));

    $response = $this->get('/login/google/callback');

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('admin.users'));
});

test('non-admin users linked to google are redirected to home page', function () {
    $user = User::factory()->create([
        'email' => 'student@example.com',
        'role' => 'student',
    ]);

    SocialAccount::factory()->create([
        'user_id' => $user->id,
        'provider' => 'google',
        'provider_id' => 'google-student-id',
    ]);

    mockGoogleCallbackUser(fakeGoogleUser('google-student-id', 'student@example.com'));

    $response = $this->get('/login/google/callback');

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect('/homePage');
});


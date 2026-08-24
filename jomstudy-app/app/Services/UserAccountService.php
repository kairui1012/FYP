<?php

namespace App\Services;

use App\Models\User;

class UserAccountService
{
    public function updatePassword(User $user, string $password): void
    {
        $user->update(['password' => $password]);
    }

    public function updateProfile(User $user, array $attributes): void
    {
        $user->fill($attributes);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();
    }

    public function delete(User $user): void
    {
        $user->delete();
    }
}

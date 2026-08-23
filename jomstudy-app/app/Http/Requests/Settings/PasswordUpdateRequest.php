<?php

namespace App\Http\Requests\Settings;

use App\Concerns\PasswordValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PasswordUpdateRequest extends FormRequest
{
    use PasswordValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $requiresCurrentPassword = ! $this->user()?->socialAccounts()->exists();

        return [
            'current_password' => $requiresCurrentPassword
                ? $this->currentPasswordRules()
                : ['nullable', 'string', 'current_password'],
            'password' => $this->passwordRules(),
        ];
    }
}

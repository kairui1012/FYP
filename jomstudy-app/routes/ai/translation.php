<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    /*
    |----------------------------------------------------------------------
    | POST /translate
    | Translate a batch of UI strings into the user's current locale.
    |----------------------------------------------------------------------
    */

    Route::post('/translate', function (Request $request) {
        $request->validate([
            'texts' => 'required|array|max:200',
            'texts.*' => 'string|max:500',
        ]);

        $texts = $request->input('texts');
        $currentLocale = app()->getLocale();
        $targetLanguage = match ($currentLocale) {
            'zh' => 'Chinese (Simplified)',
            'my' => 'Malay',
            default => 'English',
        };

        $prompt = "Translate the following JSON array of strings to {$targetLanguage}.\n"
            ."Return ONLY a valid JSON object where each key is the original string and the value is the {$targetLanguage} translation.\n"
            ."Each translation value must contain only {$targetLanguage} text, without the original source text.\n"
            ."Do NOT translate proper nouns, brand names, or code.\n"
            ."Sexual explicit content -> {\"error\":\"inappropriate content\"}. Biological ok.\n"
            ."No explanation, no extra text.\n\n"
            .json_encode($texts, JSON_UNESCAPED_UNICODE);

        try {
            $res = Http::withToken(config('services.deepseek.key'))
                ->timeout(15)
                ->post('https://api.deepseek.com/v1/chat/completions', [
                    'model' => 'deepseek-chat',
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a professional translator. 
                    Always respond with valid JSON only, no markdown.'],
                        ['role' => 'user',   'content' => $prompt],
                    ],
                    'temperature' => 0.2,
                    'response_format' => ['type' => 'json_object'],
                ]);

            if (! $res->successful()) {
                throw new \Exception('DeepSeek error: '.$res->status());
            }

            $decoded = json_decode($res->json('choices.0.message.content'), true);

            if (! is_array($decoded)) {
                throw new \Exception('DeepSeek returned invalid JSON structure');
            }

            if (isset($decoded['error']) && is_string($decoded['error'])) {
                throw new \Exception('DeepSeek blocked content: '.$decoded['error']);
            }

            foreach ($decoded as $value) {
                if (! is_string($value)) {
                    throw new \Exception('DeepSeek returned non-string translation value');
                }
            }

            return response()->json([
                'translations' => $decoded,
                'provider' => 'deepseek',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'provider' => 'deepseek',
            ], 502);
        }

    })->middleware(['web', 'throttle:30,1']);

});

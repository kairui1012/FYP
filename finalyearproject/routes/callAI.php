<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\PostController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Laravel\Fortify\Features;
use Illuminate\Support\Facades\Http;

Route::post('/translate', function (Request $request) {
    $request->validate([
        'texts'    => 'required|array|max:200',
        'texts.*'  => 'string|max:500',
        'provider' => 'required|in:deepseek,gemini',
    ]);

    $texts    = $request->input('texts');
    $provider = $request->input('provider');
    $currentLocale = app()->getLocale();
    $targetLanguage = match ($currentLocale) {
        'zh' => 'Chinese (Simplified)',
        'my' => 'Malay',
        default => 'English',
    };

    $prompt = "Translate the following JSON array of strings to {$targetLanguage}.\n"
        . "Return ONLY a valid JSON object where each key is the original string and the value is the {$targetLanguage} translation.\n"
        . "Do NOT translate proper nouns, brand names, or code.\n"
        . "Sexual explicit content -> {\"error\":\"inappropriate content\"}. Biological ok.\n"
        . "No explanation, no extra text.\n\n"
        . json_encode($texts, JSON_UNESCAPED_UNICODE);

    try {
        $translations = match ($provider) {

            'deepseek' => (function () use ($prompt) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(15)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model'           => 'deepseek-chat',
                        'messages'        => [
                            ['role' => 'system', 'content' => 'You are a professional translator. Always respond with valid JSON only, no markdown.'],
                            ['role' => 'user',   'content' => $prompt],
                        ],
                        'temperature'     => 0.2,
                        'response_format' => ['type' => 'json_object'],
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('DeepSeek error: ' . $res->status());
                }

                $decoded = json_decode($res->json('choices.0.message.content'), true);

                if (!is_array($decoded)) {
                    throw new \Exception('DeepSeek returned invalid JSON structure');
                }

                if (isset($decoded['error']) && is_string($decoded['error'])) {
                    throw new \Exception('DeepSeek blocked content: ' . $decoded['error']);
                }

                foreach ($decoded as $value) {
                    if (!is_string($value)) {
                        throw new \Exception('DeepSeek returned non-string translation value');
                    }
                }

                return $decoded;
            })(),

            'gemini' => (function () use ($prompt) {
                $res = Http::withQueryParameters(['key' => config('services.gemini.key')])
                    ->timeout(15)
                    ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                        'generationConfig' => [
                            'responseMimeType' => 'application/json',
                            'temperature'      => 0.2,
                        ],
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('Gemini error: ' . $res->status());
                }

                $text    = $res->json('candidates.0.content.parts.0.text');
                $decoded = json_decode($text, true);

                if (!is_array($decoded)) {
                    throw new \Exception('Gemini returned invalid JSON structure');
                }

                if (isset($decoded['error']) && is_string($decoded['error'])) {
                    throw new \Exception('Gemini blocked content: ' . $decoded['error']);
                }

                foreach ($decoded as $value) {
                    if (!is_string($value)) {
                        throw new \Exception('Gemini returned non-string translation value');
                    }
                }

                return $decoded;
            })(),
        };

        return response()->json([
            'translations' => $translations,
            'provider'     => $provider,
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error'   => $e->getMessage(),
            'provider' => $provider,
        ], 502);
    }

})->middleware(['web', 'throttle:30,1']);

Route::post('/ai-explain', function (Request $request) {
    $request->validate([
        'question'       => 'required|string|max:500',
        'user_answer'    => 'required|string|max:300',
        'correct_answer' => 'required|string|max:300',
        'provider'       => 'required|in:deepseek,gemini',
    ]);

    $question      = $request->input('question');
    $userAnswer    = $request->input('user_answer');
    $correctAnswer = $request->input('correct_answer');
    $provider      = $request->input('provider');
    $isCorrect     = $userAnswer === $correctAnswer;

    $currentLocale = app()->getLocale();
    $lang = match ($currentLocale) {
        'zh'    => 'Chinese (Simplified)',
        'my'    => 'Malay',
        default => 'English',
    };

    $wrongPart = $isCorrect
        ? ''
        : "2. Briefly explain why \"{$userAnswer}\" is incorrect.\n";

    $prompt = "You are a helpful tutor. Respond entirely in {$lang}. Plain text only — no markdown.\n\n"
        . "Quiz question: {$question}\n"
        . "Correct answer: {$correctAnswer}\n"
        . ($isCorrect ? '' : "Student's answer: {$userAnswer}\n")
        . "\nProvide a concise educational explanation (3–5 sentences):\n"
        . "1. Explain WHY \"{$correctAnswer}\" is the correct answer.\n"
        . $wrongPart;

    try {
        $explanation = match ($provider) {

            'deepseek' => (function () use ($prompt) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(20)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model'       => 'deepseek-chat',
                        'messages'    => [
                            ['role' => 'system', 'content' => 'You are a helpful tutor. Always respond in plain text with no markdown formatting.'],
                            ['role' => 'user',   'content' => $prompt],
                        ],
                        'temperature' => 0.4,
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('DeepSeek error: ' . $res->status());
                }

                $text = $res->json('choices.0.message.content');

                if (!is_string($text) || trim($text) === '') {
                    throw new \Exception('DeepSeek returned empty explanation');
                }

                return trim($text);
            })(),

            'gemini' => (function () use ($prompt) {
                $res = Http::withQueryParameters(['key' => config('services.gemini.key')])
                    ->timeout(20)
                    ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                        'generationConfig' => [
                            'temperature' => 0.4,
                        ],
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('Gemini error: ' . $res->status());
                }

                $text = $res->json('candidates.0.content.parts.0.text');

                if (!is_string($text) || trim($text) === '') {
                    throw new \Exception('Gemini returned empty explanation');
                }

                return trim($text);
            })(),
        };

        return response()->json([
            'explanation' => $explanation,
            'provider'    => $provider,
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error'    => $e->getMessage(),
            'provider' => $provider,
        ], 502);
    }

})->middleware(['web', 'throttle:20,1']);
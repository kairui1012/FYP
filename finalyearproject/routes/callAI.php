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
        'question'    => 'required|string|max:500',
        'options'     => 'required|array|min:2|max:8',
        'options.*'   => 'required|string|max:300',
        'user_answer' => 'required|string|max:300',
        'creator_answer' => 'required|string|max:300',
        'provider'    => 'required|in:deepseek,gemini',
    ]);

    $question   = $request->input('question');
    $options    = array_values(array_filter($request->input('options'), fn ($option) => is_string($option) && trim($option) !== ''));
    $userAnswer = $request->input('user_answer');
    $creatorAnswer = $request->input('creator_answer');
    $provider   = $request->input('provider');

    $currentLocale = app()->getLocale();
    $lang = match ($currentLocale) {
        'zh'    => 'Chinese (Simplified)',
        'my'    => 'Malay',
        default => 'English',
    };

    $optionLines = collect($options)
        ->map(function ($option, $index) {
            return chr(65 + $index) . '. ' . $option;
        })
        ->implode("\n");

    $prompt = "You are an expert quiz tutor. Respond entirely in {$lang}. Return ONLY valid JSON. No markdown, no code fences, no extra text.\n\n"
        . "You must:\n"
        . "1. Analyze the question carefully.\n"
        . "2. Evaluate ALL options.\n"
        . "3. Determine the most likely correct answer.\n"
        . "4. Compare it with the student's selected answer.\n"
        . "5. Compare it with the quiz creator's intended correct answer.\n"
        . "6. If your answer differs from the creator's, explicitly detect the disagreement.\n"
        . "7. Do NOT blindly trust the creator's answer.\n"
        . "8. If multiple answers could be valid, say so explicitly.\n"
        . "9. Keep reasoning clear and structured.\n\n"
        . "Question: {$question}\n"
        . "Options:\n{$optionLines}\n"
        . "Student selected answer: {$userAnswer}\n\n"
        . "Quiz creator's answer: {$creatorAnswer}\n\n"
        . "Return JSON in this exact shape:\n"
        . '{"aiAnswer":"string","isUserCorrect":false,"matchesCreator":false,"explanation":"string","discrepancyAnalysis":"string","creatorReasoning":"string","ambiguityNote":"string","confidence":"high|medium|low"}';

    $decodeAnalysis = function (string $text) {
        $trimmed = trim($text);
        $candidates = [$trimmed];

        if (str_starts_with($trimmed, '```')) {
            $candidates[] = trim(preg_replace('/^```(?:json)?\s*|\s*```$/', '', $trimmed));
        }

        $start = strpos($trimmed, '{');
        $end = strrpos($trimmed, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $candidates[] = trim(substr($trimmed, $start, $end - $start + 1));
        }

        foreach ($candidates as $candidate) {
            $decoded = json_decode($candidate, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
        }

        throw new \Exception('AI returned invalid JSON analysis');
    };

    try {
        $analysis = match ($provider) {

            'deepseek' => (function () use ($prompt) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(20)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model'       => 'deepseek-chat',
                        'messages'    => [
                            ['role' => 'system', 'content' => 'You are an expert quiz tutor. Always respond with valid JSON only.'],
                            ['role' => 'user',   'content' => $prompt],
                        ],
                        'temperature' => 0.4,
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('DeepSeek error: ' . $res->status());
                }

                $text = $res->json('choices.0.message.content');

                if (!is_string($text) || trim($text) === '') {
                    throw new \Exception('DeepSeek returned empty analysis');
                }

                return $text;
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
                    throw new \Exception('Gemini returned empty analysis');
                }

                return $text;
            })(),
        };

        $decoded = $decodeAnalysis($analysis);

        $normalizeAnswer = function ($value) {
            if (!is_string($value)) {
                return '';
            }

            $normalized = mb_strtolower(trim($value));
            return preg_replace('/\s+/', ' ', $normalized) ?? '';
        };

        $extractString = function (array $data, array $keys) {
            foreach ($keys as $key) {
                if (isset($data[$key]) && is_string($data[$key]) && trim($data[$key]) !== '') {
                    return trim($data[$key]);
                }
            }

            return '';
        };

        $extractBool = function (array $data, array $keys) {
            foreach ($keys as $key) {
                if (array_key_exists($key, $data) && is_bool($data[$key])) {
                    return $data[$key];
                }
            }

            return null;
        };

        $aiAnswer = $extractString($decoded, ['aiAnswer', 'ai_answer']);
        $isUserCorrect = $extractBool($decoded, ['isUserCorrect', 'is_user_correct']);
        $matchesCreator = $extractBool($decoded, ['matchesCreator', 'matches_creator']);
        $explanation = $extractString($decoded, ['explanation']);
        $discrepancyAnalysis = $extractString($decoded, ['discrepancyAnalysis', 'discrepancy_analysis']);
        $creatorReasoning = $extractString($decoded, ['creatorReasoning', 'creator_reasoning']);
        $ambiguityNote = $extractString($decoded, ['ambiguityNote', 'ambiguity_note']);
        $confidence = $extractString($decoded, ['confidence']);

        if ($aiAnswer === '') {
            throw new \Exception('AI returned missing ai answer');
        }

        if ($explanation === '') {
            throw new \Exception('AI returned missing explanation');
        }

        if ($isUserCorrect === null) {
            $isUserCorrect = $normalizeAnswer($aiAnswer) === $normalizeAnswer($userAnswer);
        }

        if ($matchesCreator === null) {
            $matchesCreator = $normalizeAnswer($aiAnswer) === $normalizeAnswer($creatorAnswer);
        }

        if ($confidence === '' || !in_array($confidence, ['high', 'medium', 'low'], true)) {
            $confidence = 'medium';
        }

        if (!$matchesCreator && $discrepancyAnalysis === '') {
            $discrepancyAnalysis = 'AI and creator answers differ. Review the question wording and available options for ambiguity or missing constraints.';
        }

        if (!$matchesCreator && $creatorReasoning === '') {
            $creatorReasoning = 'The quiz creator likely intended: ' . trim($creatorAnswer) . '.';
        }

        if (!$matchesCreator && $ambiguityNote === '') {
            $ambiguityNote = $discrepancyAnalysis;
        }

        return response()->json([
            'analysis' => [
                'aiAnswer' => $aiAnswer,
                'isUserCorrect' => $isUserCorrect,
                'matchesCreator' => $matchesCreator,
                'explanation' => $explanation,
                'discrepancyAnalysis' => $discrepancyAnalysis,
                'creatorReasoning' => $creatorReasoning,
                'ambiguityNote' => $ambiguityNote,
                'confidence' => $confidence,
                'userAnswer' => trim($userAnswer),
                'creatorAnswer' => trim($creatorAnswer),
            ],
            'provider' => $provider,
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'provider' => $provider,
        ], 502);
    }

})->middleware(['web', 'throttle:20,1']);
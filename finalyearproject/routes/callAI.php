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

Route::post('/ai-quiz-options', function (Request $request) {
    $user = $request->user();
    $role = strtolower((string) ($user?->role ?? ''));
    if (!in_array($role, ['teacher', 'admin'], true)) {
        return response()->json([
            'error' => 'Only teachers and admins can use AI quiz options.',
        ], 403);
    }

    $request->validate([
        'question'         => 'required|string|max:500',
        'subject'          => 'nullable|string|max:120',
        'language_code'    => 'nullable|string|in:en,zh,my,bm',
        'existing_options' => 'nullable|array|max:8',
        'existing_options.*' => 'nullable|string|max:255',
        'answer_placement' => 'nullable|in:A,B,C,D,random',
        'provider'         => 'required|in:deepseek,gemini',
    ]);

    $question = trim($request->input('question'));
    $subject = trim((string) $request->input('subject', ''));
    $languageCode = (string) ($request->input('language_code') ?: app()->getLocale());
    $answerPlacement = (string) ($request->input('answer_placement') ?: 'random');
    $provider = $request->input('provider');
    $existingOptions = collect($request->input('existing_options', []))
        ->filter(fn ($option) => is_string($option) && trim($option) !== '')
        ->map(fn ($option) => trim($option))
        ->values()
        ->all();

    $targetLanguage = match ($languageCode) {
        'zh' => 'Chinese (Simplified)',
        'my', 'bm' => 'Malay',
        default => 'English',
    };

    $subjectLine = $subject !== '' ? "Subject: {$subject}\n" : '';
    $existingOptionsBlock = count($existingOptions) > 0
        ? "Existing draft options, if any. You may improve or replace them:\n"
            . collect($existingOptions)->map(fn ($option, $index) => chr(65 + $index) . ". {$option}")->implode("\n")
            . "\n\n"
        : '';
    $answerPlacementInstruction = match ($answerPlacement) {
        'A', 'B', 'C', 'D' => "8. The correct answer must be placed at option {$answerPlacement}.\n",
        default => "8. You may place the correct answer at any option position.\n",
    };
    $isMathLikeQuestion = str($subject)->lower()->contains('math')
        || preg_match('/[=+\-*\/^()]/u', $question) === 1;
    $mathInstruction = $isMathLikeQuestion
        ? "9. For math or calculation questions, solve carefully first.\n"
            . "10. Make all 4 options mathematically distinct.\n"
            . "11. Keep math notation plain and concise, such as x = -9 or -9. Do not add extra explanation inside the options.\n"
        : '';

    $prompt = "You are an expert teacher creating multiple-choice quiz options for students. Respond entirely in {$targetLanguage}. Return ONLY valid JSON. No markdown, no code fences, no extra text.\n\n"
        . "Task:\n"
        . "1. Generate exactly 4 answer options for the quiz question.\n"
        . "2. Exactly 1 option must be clearly correct.\n"
        . "3. The other 3 options must be plausible distractors, not silly or obviously fake.\n"
        . "4. Keep options concise and suitable for classroom learning.\n"
        . "5. Do not include option letters like A, B, C, D inside the option text.\n"
        . "6. Set answerIndex to the zero-based index of the correct option.\n"
        . "7. If the question is ambiguous, choose the best answer and make distractors reflect common misunderstandings.\n\n"
        . $answerPlacementInstruction
        . $mathInstruction
        . $subjectLine
        . "Question: {$question}\n\n"
        . $existingOptionsBlock
        . "Return JSON in this exact shape:\n"
        . '{"options":["string","string","string","string"],"answerIndex":0,"explanation":"string"}';

    $decodeResult = function (string $text) {
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

        throw new \Exception('AI returned invalid quiz options JSON');
    };

    try {
        $raw = match ($provider) {
            'deepseek' => (function () use ($prompt) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(25)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model' => 'deepseek-chat',
                        'messages' => [
                            ['role' => 'system', 'content' => 'You are an expert quiz writer. Always respond with valid JSON only.'],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'temperature' => 0.45,
                        'response_format' => ['type' => 'json_object'],
                    ]);

                if (! $res->successful()) {
                    throw new \Exception('DeepSeek error: ' . $res->status());
                }

                $text = $res->json('choices.0.message.content');
                if (! is_string($text) || trim($text) === '') {
                    throw new \Exception('DeepSeek returned empty quiz options');
                }

                return $text;
            })(),

            'gemini' => (function () use ($prompt) {
                $res = Http::withQueryParameters(['key' => config('services.gemini.key')])
                    ->timeout(25)
                    ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                        'generationConfig' => [
                            'responseMimeType' => 'application/json',
                            'temperature' => 0.45,
                        ],
                    ]);

                if (! $res->successful()) {
                    throw new \Exception('Gemini error: ' . $res->status());
                }

                $text = $res->json('candidates.0.content.parts.0.text');
                if (! is_string($text) || trim($text) === '') {
                    throw new \Exception('Gemini returned empty quiz options');
                }

                return $text;
            })(),
        };

        $decoded = $decodeResult($raw);
        $normalizeOption = function ($option) {
            if (! is_string($option)) {
                return '';
            }

            $normalized = trim($option);
            $normalized = preg_replace('/^\s*[A-D]\s*[\.\):：-]\s*/u', '', $normalized) ?? $normalized;

            return trim($normalized);
        };
        $extractOptions = function (array $decoded) use ($normalizeOption) {
            $rawOptions = $decoded['options'] ?? null;

            if (is_array($rawOptions)) {
                if (array_is_list($rawOptions)) {
                    return array_values(array_filter(array_map(
                        $normalizeOption,
                        $rawOptions,
                    )));
                }

                $letterOptions = [];
                foreach (['A', 'B', 'C', 'D'] as $letter) {
                    $option = $rawOptions[$letter] ?? $rawOptions[strtolower($letter)] ?? null;
                    $normalized = $normalizeOption($option);
                    if ($normalized !== '') {
                        $letterOptions[] = $normalized;
                    }
                }

                return $letterOptions;
            }

            return [];
        };
        $parseAnswerIndex = function (array $decoded) {
            $rawAnswerIndex = $decoded['answerIndex']
                ?? $decoded['answer_index']
                ?? $decoded['answer']
                ?? $decoded['correctAnswer']
                ?? $decoded['correct_answer']
                ?? null;

            if (is_int($rawAnswerIndex)) {
                return $rawAnswerIndex;
            }

            if (is_string($rawAnswerIndex)) {
                $normalized = strtoupper(trim($rawAnswerIndex));

                if ($normalized !== '' && ctype_digit($normalized)) {
                    return (int) $normalized;
                }

                return match ($normalized) {
                    'A' => 0,
                    'B' => 1,
                    'C' => 2,
                    'D' => 3,
                    default => null,
                };
            }

            return null;
        };

        $options = $extractOptions($decoded);
        $answerIndex = $parseAnswerIndex($decoded);
        $explanation = isset($decoded['explanation']) && is_string($decoded['explanation'])
            ? trim($decoded['explanation'])
            : '';

        if (count($options) !== 4) {
            throw new \Exception('AI must return exactly 4 quiz options');
        }

        if ($answerIndex === null || $answerIndex < 0 || $answerIndex > 3) {
            throw new \Exception('AI returned invalid correct answer index');
        }

        $targetAnswerIndex = match ($answerPlacement) {
            'A' => 0,
            'B' => 1,
            'C' => 2,
            'D' => 3,
            default => random_int(0, 3),
        };

        if ($answerIndex !== $targetAnswerIndex) {
            $correctOption = $options[$answerIndex];
            unset($options[$answerIndex]);
            $options = array_values($options);
            array_splice($options, $targetAnswerIndex, 0, [$correctOption]);
            $answerIndex = $targetAnswerIndex;
        }

        return response()->json([
            'quiz_options' => [
                'options' => $options,
                'answerIndex' => $answerIndex,
                'explanation' => $explanation,
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

Route::post('/ai-material-quiz', function (Request $request) {
    $request->validate([
        'material_title' => 'required|string|max:300',
        'material_content' => 'required|string|max:4000',
        'subject' => 'nullable|string|max:120',
        'language_code' => 'nullable|string|max:10',
        'question_count' => 'nullable|integer|min:1|max:1',
        'provider' => 'required|in:deepseek,gemini',
    ]);

    $materialTitle = trim($request->input('material_title'));
    $materialContent = trim($request->input('material_content'));
    $subject = trim((string) $request->input('subject', ''));
    $languageCode = (string) ($request->input('language_code') ?: app()->getLocale());
    $questionCount = 1;
    $provider = $request->input('provider');

    $targetLanguage = match ($languageCode) {
        'zh' => 'Chinese (Simplified)',
        'my', 'bm' => 'Malay',
        default => 'English',
    };

    $subjectLine = $subject !== '' ? "Subject: {$subject}\n" : '';

    $prompt = "You are an expert teacher creating a quiz from a Study Material. Respond entirely in {$targetLanguage}. Return ONLY valid JSON. No markdown, no code fences, no extra text.\n\n"
        . "Task:\n"
        . "1. Generate exactly 1 multiple-choice question from the Study Material.\n"
        . "2. The question must check understanding of the material, not trivia outside it.\n"
        . "3. The question must have exactly 4 options.\n"
        . "4. Exactly 1 option must be correct.\n"
        . "5. Distractors should reflect common learner misunderstandings.\n"
        . "6. Include a short explanation for the correct answer.\n"
        . "7. The questions array must contain exactly 1 item only.\n\n"
        . $subjectLine
        . "Study Material Title: {$materialTitle}\n\n"
        . "Study Material Content:\n{$materialContent}\n\n"
        . "Return JSON in this exact shape:\n"
        . '{"questions":[{"question":"string","options":["string","string","string","string"],"answerIndex":0,"explanation":"string"}]}';
        
    $decodeResult = function (string $text) {
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

        throw new \Exception('AI returned invalid material quiz JSON');
    };

    try {
        $raw = match ($provider) {
            'deepseek' => (function () use ($prompt) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(30)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model' => 'deepseek-chat',
                        'messages' => [
                            ['role' => 'system', 'content' => 'You are an expert quiz writer. Always respond with valid JSON only.'],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'temperature' => 0.35,
                        'response_format' => ['type' => 'json_object'],
                    ]);

                if (! $res->successful()) {
                    throw new \Exception('DeepSeek error: ' . $res->status());
                }

                $text = $res->json('choices.0.message.content');
                if (! is_string($text) || trim($text) === '') {
                    throw new \Exception('DeepSeek returned empty material quiz');
                }

                return $text;
            })(),

            'gemini' => (function () use ($prompt) {
                $res = Http::withQueryParameters(['key' => config('services.gemini.key')])
                    ->timeout(30)
                    ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                        'generationConfig' => [
                            'responseMimeType' => 'application/json',
                            'temperature' => 0.35,
                        ],
                    ]);

                if (! $res->successful()) {
                    throw new \Exception('Gemini error: ' . $res->status());
                }

                $text = $res->json('candidates.0.content.parts.0.text');
                if (! is_string($text) || trim($text) === '') {
                    throw new \Exception('Gemini returned empty material quiz');
                }

                return $text;
            })(),
        };

        $decoded = $decodeResult($raw);
        $questions = collect($decoded['questions'] ?? [])
            ->map(function ($question) {
                if (! is_array($question)) {
                    return null;
                }

                $options = collect($question['options'] ?? [])
                    ->filter(fn ($option) => is_string($option) && trim($option) !== '')
                    ->map(fn ($option) => trim($option))
                    ->values()
                    ->all();
                $answerIndex = $question['answerIndex'] ?? $question['answer_index'] ?? null;

                if (! is_string($question['question'] ?? null) || count($options) !== 4 || ! is_int($answerIndex) || $answerIndex < 0 || $answerIndex > 3) {
                    return null;
                }

                return [
                    'question' => trim($question['question']),
                    'options' => $options,
                    'answerIndex' => $answerIndex,
                    'explanation' => is_string($question['explanation'] ?? null) ? trim($question['explanation']) : '',
                ];
            })
            ->filter()
            ->values()
            ->all();

        if (count($questions) < 1) {
            throw new \Exception('AI returned too few valid material quiz questions');
        }

        return response()->json([
            'quiz' => [
                'questions' => array_slice($questions, 0, $questionCount),
            ],
            'provider' => $provider,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'provider' => $provider,
        ], 502);
    }
})->middleware(['web', 'throttle:12,1']);

Route::post('/ai-best-answer', function (Request $request) {
    $request->validate([
        'post_title'     => 'required|string|max:300',
        'post_content'   => 'nullable|string|max:2000',
        'answer_content' => 'required|string|max:2000',
        'provider'       => 'required|in:deepseek,gemini',
    ]);

    $postTitle     = $request->input('post_title');
    $postContent   = $request->input('post_content', '');
    $answerContent = $request->input('answer_content');
    $provider      = $request->input('provider');

    $currentLocale = app()->getLocale();
    $lang = match ($currentLocale) {
        'zh'    => 'Chinese (Simplified)',
        'my'    => 'Malay',
        default => 'English',
    };

    $contextBlock = trim($postContent) !== ''
        ? "Question: {$postTitle}\n\nContext / Description:\n{$postContent}\n\nBest Answer:\n{$answerContent}"
        : "Question: {$postTitle}\n\nBest Answer:\n{$answerContent}";

    $prompt = "You are an expert tutor helping students understand answers. Respond entirely in {$lang}. Return ONLY valid JSON. No markdown, no code fences, no extra text.\n\n"
        . "Your task:\n"
        . "1. Read the question and the best answer provided.\n"
        . "2. Write a clear, structured, educational explanation of WHY the answer is correct.\n"
        . "3. Break it down step-by-step if the topic benefits from it.\n"
        . "4. Keep it easy to understand for students.\n"
        . "5. Include any key concepts or principles involved.\n\n"
        . $contextBlock . "\n\n"
        . "Return JSON in this exact shape:\n"
        . '{"explanation":"string","key_points":["string"],"summary":"string"}';

    $decodeResult = function (string $text) {
        $trimmed = trim($text);
        $candidates = [$trimmed];

        if (str_starts_with($trimmed, '```')) {
            $candidates[] = trim(preg_replace('/^```(?:json)?\s*|\s*```$/', '', $trimmed));
        }

        $start = strpos($trimmed, '{');
        $end   = strrpos($trimmed, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $candidates[] = trim(substr($trimmed, $start, $end - $start + 1));
        }

        foreach ($candidates as $candidate) {
            $decoded = json_decode($candidate, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
        }

        throw new \Exception('AI returned invalid JSON');
    };

    try {
        $raw = match ($provider) {

            'deepseek' => (function () use ($prompt) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(25)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model'       => 'deepseek-chat',
                        'messages'    => [
                            ['role' => 'system', 'content' => 'You are an expert tutor. Always respond with valid JSON only.'],
                            ['role' => 'user',   'content' => $prompt],
                        ],
                        'temperature' => 0.5,
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('DeepSeek error: ' . $res->status());
                }

                $text = $res->json('choices.0.message.content');
                if (!is_string($text) || trim($text) === '') {
                    throw new \Exception('DeepSeek returned empty response');
                }

                return $text;
            })(),

            'gemini' => (function () use ($prompt) {
                $res = Http::withQueryParameters(['key' => config('services.gemini.key')])
                    ->timeout(25)
                    ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', [
                        'contents'         => [['parts' => [['text' => $prompt]]]],
                        'generationConfig' => ['temperature' => 0.5],
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('Gemini error: ' . $res->status());
                }

                $text = $res->json('candidates.0.content.parts.0.text');
                if (!is_string($text) || trim($text) === '') {
                    throw new \Exception('Gemini returned empty response');
                }

                return $text;
            })(),
        };

        $decoded     = $decodeResult($raw);
        $explanation = isset($decoded['explanation']) && is_string($decoded['explanation']) ? trim($decoded['explanation']) : '';
        $keyPoints   = isset($decoded['key_points']) && is_array($decoded['key_points'])
            ? array_values(array_filter(array_map(fn ($v) => is_string($v) ? trim($v) : '', $decoded['key_points'])))
            : [];
        $summary     = isset($decoded['summary']) && is_string($decoded['summary']) ? trim($decoded['summary']) : '';

        if ($explanation === '') {
            throw new \Exception('AI returned missing explanation');
        }

        return response()->json([
            'result' => [
                'explanation' => $explanation,
                'key_points'  => $keyPoints,
                'summary'     => $summary,
            ],
            'provider' => $provider,
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error'    => $e->getMessage(),
            'provider' => $provider,
        ], 502);
    }

})->middleware(['web', 'throttle:20,1']);

Route::post('/ai-answer-feedback', function (Request $request) {
    $request->validate([
        'post_title'     => 'required|string|max:300',
        'post_content'   => 'nullable|string|max:2000',
        'answer_content' => 'required|string|max:2000',
        'provider'       => 'required|in:deepseek,gemini',
    ]);

    $postTitle     = $request->input('post_title');
    $postContent   = $request->input('post_content', '');
    $answerContent = $request->input('answer_content');
    $provider      = $request->input('provider');

    $currentLocale = app()->getLocale();
    $lang = match ($currentLocale) {
        'zh'    => 'Chinese (Simplified)',
        'my'    => 'Malay',
        default => 'English',
    };

    $contextBlock = trim($postContent) !== ''
        ? "Question: {$postTitle}\n\nContext / Description:\n{$postContent}\n\nStudent Answer:\n{$answerContent}"
        : "Question: {$postTitle}\n\nStudent Answer:\n{$answerContent}";

    $prompt = "You are an expert tutor giving formative feedback. Respond entirely in {$lang}. Return ONLY valid JSON. No markdown, no code fences, no extra text.\n\n"
        . "Your goal is to help the student improve learning, not just judge the answer.\n"
        . "Evaluate the student's answer against the question.\n\n"
        . "Use exactly one status:\n"
        . "- good: the answer is mostly correct and useful.\n"
        . "- incomplete: the answer has useful parts but misses important explanation, steps, evidence, or accuracy.\n"
        . "- wrong: the answer is mostly incorrect, misleading, or does not answer the question.\n\n"
        . "Give specific feedback, mention what is strong, explain what is missing or wrong, and give one concrete next step.\n"
        . "If the question is ambiguous or lacks enough information, say so and mark the status incomplete unless the answer is clearly wrong.\n\n"
        . $contextBlock . "\n\n"
        . "Return JSON in this exact shape:\n"
        . '{"status":"good|incomplete|wrong","feedback":"string","strengths":["string"],"improvements":["string"],"next_step":"string","confidence":"high|medium|low"}';

    $decodeResult = function (string $text) {
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

        throw new \Exception('AI returned invalid feedback JSON');
    };

    try {
        $raw = match ($provider) {

            'deepseek' => (function () use ($prompt) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(25)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model'       => 'deepseek-chat',
                        'messages'    => [
                            ['role' => 'system', 'content' => 'You are an expert tutor. Always respond with valid JSON only.'],
                            ['role' => 'user',   'content' => $prompt],
                        ],
                        'temperature' => 0.35,
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('DeepSeek error: ' . $res->status());
                }

                $text = $res->json('choices.0.message.content');
                if (!is_string($text) || trim($text) === '') {
                    throw new \Exception('DeepSeek returned empty feedback');
                }

                return $text;
            })(),

            'gemini' => (function () use ($prompt) {
                $res = Http::withQueryParameters(['key' => config('services.gemini.key')])
                    ->timeout(25)
                    ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', [
                        'contents'         => [['parts' => [['text' => $prompt]]]],
                        'generationConfig' => ['temperature' => 0.35],
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('Gemini error: ' . $res->status());
                }

                $text = $res->json('candidates.0.content.parts.0.text');
                if (!is_string($text) || trim($text) === '') {
                    throw new \Exception('Gemini returned empty feedback');
                }

                return $text;
            })(),
        };

        $decoded = $decodeResult($raw);

        $status = isset($decoded['status']) && is_string($decoded['status'])
            ? trim($decoded['status'])
            : 'incomplete';
        if (!in_array($status, ['good', 'incomplete', 'wrong'], true)) {
            $status = 'incomplete';
        }

        $feedback = isset($decoded['feedback']) && is_string($decoded['feedback'])
            ? trim($decoded['feedback'])
            : '';
        $nextStep = isset($decoded['next_step']) && is_string($decoded['next_step'])
            ? trim($decoded['next_step'])
            : '';
        $confidence = isset($decoded['confidence']) && is_string($decoded['confidence'])
            ? trim($decoded['confidence'])
            : 'medium';
        if (!in_array($confidence, ['high', 'medium', 'low'], true)) {
            $confidence = 'medium';
        }

        $stringList = function ($value): array {
            if (!is_array($value)) {
                return [];
            }

            return array_values(array_filter(array_map(
                fn ($item) => is_string($item) ? trim($item) : '',
                $value,
            )));
        };

        if ($feedback === '') {
            throw new \Exception('AI returned missing feedback');
        }

        return response()->json([
            'feedback' => [
                'status'       => $status,
                'feedback'     => $feedback,
                'strengths'    => $stringList($decoded['strengths'] ?? []),
                'improvements' => $stringList($decoded['improvements'] ?? []),
                'next_step'    => $nextStep,
                'confidence'   => $confidence,
            ],
            'provider' => $provider,
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error'    => $e->getMessage(),
            'provider' => $provider,
        ], 502);
    }

})->middleware(['web', 'throttle:20,1']);

Route::post('/ai-learning-objectives', function (Request $request) {
    $request->validate([
        'post_title'   => 'required|string|max:300',
        'post_content' => 'nullable|string|max:3000',
        'post_type'    => 'nullable|string|in:material,question,quiz,sharing',
        'provider'     => 'required|in:deepseek,gemini',
    ]);

    $postTitle   = $request->input('post_title');
    $postContent = $request->input('post_content', '');
    $postType    = $request->input('post_type', 'sharing');
    $provider    = $request->input('provider');

    $currentLocale = app()->getLocale();
    $lang = match ($currentLocale) {
        'zh'    => 'Chinese (Simplified)',
        'my'    => 'Malay',
        default => 'English',
    };

    $typeLabel = match ($postType) {
        'material' => 'a learning materials post',
        'question' => 'a learning question',
        'quiz'     => 'a quiz post',
        default    => 'a learning sharing post',
    };

    $contentBlock = trim($postContent) !== ''
        ? "Title: {$postTitle}\n\nContent:\n{$postContent}"
        : "Title: {$postTitle}";

    $prompt = "You are an expert educational designer. Respond entirely in {$lang}. Return ONLY valid JSON. No markdown, no code fences, no extra text.\n\n"
        . "The following is {$typeLabel} on an educational platform. Your task:\n"
        . "1. Write 3 to 5 clear learning objectives that describe what a student will understand or be able to do after reading this post.\n"
        . "2. Each objective must start with an action verb (e.g. Understand, Explain, Apply, Identify, Solve, Compare).\n"
        . "3. Keep each objective concise (one sentence).\n"
        . "4. Estimate the difficulty level: beginner, intermediate, or advanced.\n"
        . "5. Estimate the reading time as a short string (e.g. '3-5 minutes').\n\n"
        . $contentBlock . "\n\n"
        . "Return JSON in this exact shape:\n"
        . '{"objectives":["string","string","string"],"difficulty":"beginner|intermediate|advanced","estimated_time":"string"}';

    $decodeResult = function (string $text) {
        $trimmed = trim($text);
        $candidates = [$trimmed];

        if (str_starts_with($trimmed, '```')) {
            $candidates[] = trim(preg_replace('/^```(?:json)?\s*|\s*```$/', '', $trimmed));
        }

        $start = strpos($trimmed, '{');
        $end   = strrpos($trimmed, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $candidates[] = trim(substr($trimmed, $start, $end - $start + 1));
        }

        foreach ($candidates as $candidate) {
            $decoded = json_decode($candidate, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
        }

        throw new \Exception('AI returned invalid JSON');
    };

    try {
        $raw = match ($provider) {

            'deepseek' => (function () use ($prompt) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(25)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model'           => 'deepseek-chat',
                        'messages'        => [
                            ['role' => 'system', 'content' => 'You are an expert educational designer. Always respond with valid JSON only.'],
                            ['role' => 'user',   'content' => $prompt],
                        ],
                        'temperature'     => 0.4,
                        'response_format' => ['type' => 'json_object'],
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('DeepSeek error: ' . $res->status());
                }

                $text = $res->json('choices.0.message.content');
                if (!is_string($text) || trim($text) === '') {
                    throw new \Exception('DeepSeek returned empty response');
                }

                return $text;
            })(),

            'gemini' => (function () use ($prompt) {
                $res = Http::withQueryParameters(['key' => config('services.gemini.key')])
                    ->timeout(25)
                    ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', [
                        'contents'         => [['parts' => [['text' => $prompt]]]],
                        'generationConfig' => [
                            'responseMimeType' => 'application/json',
                            'temperature'      => 0.4,
                        ],
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('Gemini error: ' . $res->status());
                }

                $text = $res->json('candidates.0.content.parts.0.text');
                if (!is_string($text) || trim($text) === '') {
                    throw new \Exception('Gemini returned empty response');
                }

                return $text;
            })(),
        };

        $decoded    = $decodeResult($raw);
        $objectives = isset($decoded['objectives']) && is_array($decoded['objectives'])
            ? array_values(array_filter(array_map(fn ($v) => is_string($v) ? trim($v) : '', $decoded['objectives'])))
            : [];
        $difficulty = isset($decoded['difficulty']) && in_array($decoded['difficulty'], ['beginner', 'intermediate', 'advanced'], true)
            ? $decoded['difficulty']
            : 'intermediate';
        $estimatedTime = isset($decoded['estimated_time']) && is_string($decoded['estimated_time'])
            ? trim($decoded['estimated_time'])
            : '';

        if (count($objectives) < 1) {
            throw new \Exception('AI returned no learning objectives');
        }

        return response()->json([
            'result' => [
                'objectives'     => $objectives,
                'difficulty'     => $difficulty,
                'estimated_time' => $estimatedTime,
            ],
            'provider' => $provider,
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error'    => $e->getMessage(),
            'provider' => $provider,
        ], 502);
    }

})->middleware(['web', 'throttle:15,1']);

Route::post('/ai-doubt-clarify', function (Request $request) {
    $request->validate([
        'post_title'     => 'required|string|max:300',
        'post_content'   => 'nullable|string|max:2000',
        'answer_content' => 'required|string|max:2000',
        'provider'       => 'required|in:deepseek,gemini',
    ]);

    $postTitle     = $request->input('post_title');
    $postContent   = $request->input('post_content', '');
    $answerContent = $request->input('answer_content');
    $provider      = $request->input('provider');

    $currentLocale = app()->getLocale();
    $lang = match ($currentLocale) {
        'zh'    => 'Chinese (Simplified)',
        'my'    => 'Malay',
        default => 'English',
    };

    $contextBlock = trim($postContent) !== ''
        ? "Question: {$postTitle}\n\nContext:\n{$postContent}\n\nAnswer:\n{$answerContent}"
        : "Question: {$postTitle}\n\nAnswer:\n{$answerContent}";

    $prompt = "You are a supportive tutor helping a student who found an answer confusing. Respond entirely in {$lang}. Return ONLY valid JSON. No markdown, no code fences, no extra text.\n\n"
        . "Your task:\n"
        . "1. Write a clear explanation of WHY this answer is correct or makes sense (2-3 sentences).\n"
        . "2. Address a common misunderstanding a student might have about this answer.\n"
        . "3. Provide one concrete tip to guide the student toward the correct understanding.\n"
        . "Be encouraging, concise, and student-friendly.\n\n"
        . $contextBlock . "\n\n"
        . "Return JSON in this exact shape:\n"
        . '{"explanation":"string","guidance":"string"}';

    $decodeResult = function (string $text) {
        $trimmed = trim($text);
        $candidates = [$trimmed];

        if (str_starts_with($trimmed, '```')) {
            $candidates[] = trim(preg_replace('/^```(?:json)?\s*|\s*```$/', '', $trimmed));
        }

        $start = strpos($trimmed, '{');
        $end   = strrpos($trimmed, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $candidates[] = trim(substr($trimmed, $start, $end - $start + 1));
        }

        foreach ($candidates as $candidate) {
            $decoded = json_decode($candidate, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
        }

        throw new \Exception('AI returned invalid JSON');
    };

    try {
        $raw = match ($provider) {
            'deepseek' => (function () use ($prompt) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(20)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model'       => 'deepseek-chat',
                        'messages'    => [
                            ['role' => 'system', 'content' => 'You are a supportive tutor. Always respond with valid JSON only.'],
                            ['role' => 'user',   'content' => $prompt],
                        ],
                        'temperature' => 0.5,
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('DeepSeek error: ' . $res->status());
                }

                $text = $res->json('choices.0.message.content');
                if (!is_string($text) || trim($text) === '') {
                    throw new \Exception('DeepSeek returned empty response');
                }

                return $text;
            })(),

            'gemini' => (function () use ($prompt) {
                $res = Http::withQueryParameters(['key' => config('services.gemini.key')])
                    ->timeout(20)
                    ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', [
                        'contents'         => [['parts' => [['text' => $prompt]]]],
                        'generationConfig' => ['temperature' => 0.5],
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('Gemini error: ' . $res->status());
                }

                $text = $res->json('candidates.0.content.parts.0.text');
                if (!is_string($text) || trim($text) === '') {
                    throw new \Exception('Gemini returned empty response');
                }

                return $text;
            })(),
        };

        $decoded     = $decodeResult($raw);
        $explanation = isset($decoded['explanation']) && is_string($decoded['explanation']) ? trim($decoded['explanation']) : '';
        $guidance    = isset($decoded['guidance']) && is_string($decoded['guidance']) ? trim($decoded['guidance']) : '';

        if ($explanation === '') {
            throw new \Exception('AI returned missing explanation');
        }

        return response()->json([
            'result'   => compact('explanation', 'guidance'),
            'provider' => $provider,
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error'    => $e->getMessage(),
            'provider' => $provider,
        ], 502);
    }

})->middleware(['web', 'throttle:20,1']);

Route::post('/ai-validate-wrong', function (Request $request) {
    $request->validate([
        'post_title'     => 'required|string|max:300',
        'post_content'   => 'nullable|string|max:2000',
        'answer_content' => 'required|string|max:2000',
        'user_reasoning' => 'required|string|min:10|max:1000',
        'provider'       => 'required|in:deepseek,gemini',
    ]);

    $postTitle     = $request->input('post_title');
    $postContent   = $request->input('post_content', '');
    $answerContent = $request->input('answer_content');
    $userReasoning = $request->input('user_reasoning');
    $provider      = $request->input('provider');

    $currentLocale = app()->getLocale();
    $lang = match ($currentLocale) {
        'zh'    => 'Chinese (Simplified)',
        'my'    => 'Malay',
        default => 'English',
    };

    $contextBlock = trim($postContent) !== ''
        ? "Question: {$postTitle}\n\nContext:\n{$postContent}\n\nAnswer being evaluated:\n{$answerContent}\n\nStudent's reasoning for marking it wrong:\n{$userReasoning}"
        : "Question: {$postTitle}\n\nAnswer being evaluated:\n{$answerContent}\n\nStudent's reasoning for marking it wrong:\n{$userReasoning}";

    $prompt = "You are a fair academic evaluator. Respond entirely in {$lang}. Return ONLY valid JSON. No markdown, no code fences, no extra text.\n\n"
        . "A student wants to flag an answer as 'Wrong'. Evaluate if their reasoning is genuinely valid.\n\n"
        . "Mark is_valid as TRUE only if the reasoning:\n"
        . "- Points to a factual error in the answer\n"
        . "- Identifies a clear logical flaw or contradiction\n"
        . "- Provides a credible counter-argument with supporting logic\n\n"
        . "Mark is_valid as FALSE if the reasoning:\n"
        . "- Is vague, dismissive, or contains no substance (e.g. 'this is wrong', 'bad answer', 'I disagree')\n"
        . "- Is personal opinion without supporting logic or evidence\n"
        . "- Is irrelevant, off-topic, or nonsensical\n"
        . "- Is less than one complete, substantive sentence\n\n"
        . "Be encouraging in your feedback — if invalid, guide the student on how to write better feedback.\n\n"
        . $contextBlock . "\n\n"
        . "Return JSON in this exact shape:\n"
        . '{"is_valid":false,"feedback":"string"}';

    $decodeResult = function (string $text) {
        $trimmed = trim($text);
        $candidates = [$trimmed];

        if (str_starts_with($trimmed, '```')) {
            $candidates[] = trim(preg_replace('/^```(?:json)?\s*|\s*```$/', '', $trimmed));
        }

        $start = strpos($trimmed, '{');
        $end   = strrpos($trimmed, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $candidates[] = trim(substr($trimmed, $start, $end - $start + 1));
        }

        foreach ($candidates as $candidate) {
            $decoded = json_decode($candidate, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
        }

        throw new \Exception('AI returned invalid JSON');
    };

    try {
        $raw = match ($provider) {
            'deepseek' => (function () use ($prompt) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(20)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model'       => 'deepseek-chat',
                        'messages'    => [
                            ['role' => 'system', 'content' => 'You are a fair academic evaluator. Always respond with valid JSON only.'],
                            ['role' => 'user',   'content' => $prompt],
                        ],
                        'temperature' => 0.3,
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('DeepSeek error: ' . $res->status());
                }

                $text = $res->json('choices.0.message.content');
                if (!is_string($text) || trim($text) === '') {
                    throw new \Exception('DeepSeek returned empty response');
                }

                return $text;
            })(),

            'gemini' => (function () use ($prompt) {
                $res = Http::withQueryParameters(['key' => config('services.gemini.key')])
                    ->timeout(20)
                    ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', [
                        'contents'         => [['parts' => [['text' => $prompt]]]],
                        'generationConfig' => ['temperature' => 0.3],
                    ]);

                if (!$res->successful()) {
                    throw new \Exception('Gemini error: ' . $res->status());
                }

                $text = $res->json('candidates.0.content.parts.0.text');
                if (!is_string($text) || trim($text) === '') {
                    throw new \Exception('Gemini returned empty response');
                }

                return $text;
            })(),
        };

        $decoded  = $decodeResult($raw);
        $isValid  = isset($decoded['is_valid']) && is_bool($decoded['is_valid']) ? $decoded['is_valid'] : false;
        $feedback = isset($decoded['feedback']) && is_string($decoded['feedback']) ? trim($decoded['feedback']) : '';

        if ($feedback === '') {
            throw new \Exception('AI returned missing feedback');
        }

        return response()->json([
            'result'   => ['is_valid' => $isValid, 'feedback' => $feedback],
            'provider' => $provider,
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error'    => $e->getMessage(),
            'provider' => $provider,
        ], 502);
    }

})->middleware(['web', 'throttle:15,1']);

<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

Route::middleware(['auth'])->group(function () {

Route::post('/translate', function (Request $request) {
    $request->validate([
        'texts'    => 'required|array|max:200',
        'texts.*'  => 'string|max:500',
    ]);

    $texts    = $request->input('texts');
    $currentLocale = app()->getLocale();
    $targetLanguage = match ($currentLocale) {
        'zh' => 'Chinese (Simplified)',
        'my' => 'Malay',
        default => 'English',
    };

    $prompt = "Translate the following JSON array of strings to {$targetLanguage}.\n"
        . "Return ONLY a valid JSON object where each key is the original string and the value is the {$targetLanguage} translation.\n"
        . "Each translation value must contain only {$targetLanguage} text, without the original source text.\n"
        . "Do NOT translate proper nouns, brand names, or code.\n"
        . "Sexual explicit content -> {\"error\":\"inappropriate content\"}. Biological ok.\n"
        . "No explanation, no extra text.\n\n"
        . json_encode($texts, JSON_UNESCAPED_UNICODE);

    try {
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

        return response()->json([
            'translations' => $decoded,
            'provider'     => 'deepseek',
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error'    => $e->getMessage(),
            'provider' => 'deepseek',
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
    ]);

    $question   = $request->input('question');
    $options    = array_values(array_filter($request->input('options'), fn ($option) => is_string($option) && trim($option) !== ''));
    $userAnswer = $request->input('user_answer');
    $creatorAnswer = $request->input('creator_answer');

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

        $decoded = $decodeAnalysis($text);

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
            'provider' => 'deepseek',
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error'    => $e->getMessage(),
            'provider' => 'deepseek',
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
    ]);

    $question = trim($request->input('question'));
    $subject = trim((string) $request->input('subject', ''));
    $languageCode = (string) ($request->input('language_code') ?: app()->getLocale());
    $answerPlacement = (string) ($request->input('answer_placement') ?: 'random');
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
        $raw = (function () use ($prompt) {
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
        })();

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
            'provider' => 'deepseek',
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error'    => $e->getMessage(),
            'provider' => 'deepseek',
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
    ]);

    $materialTitle = trim($request->input('material_title'));
    $materialContent = trim($request->input('material_content'));
    $subject = trim((string) $request->input('subject', ''));
    $languageCode = (string) ($request->input('language_code') ?: app()->getLocale());
    $questionCount = 1;

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
        $raw = (function () use ($prompt) {
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
        })();

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
            'provider' => 'deepseek',
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error'    => $e->getMessage(),
            'provider' => 'deepseek',
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
        $raw = (function () use ($prompt) {
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
        })();

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
            'provider' => 'deepseek',
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error'    => $e->getMessage(),
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
        $raw = (function () use ($prompt) {
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
        })();

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
            'provider' => 'deepseek',
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error'    => $e->getMessage(),
        ], 502);
    }

})->middleware(['web', 'throttle:20,1']);

Route::post('/ai-learning-objectives', function (Request $request) {
    $request->validate([
        'post_title'   => 'required|string|max:300',
        'post_content' => 'nullable|string|max:3000',
        'post_type'    => 'nullable|string|in:material,question,quiz,sharing',
    ]);

    $postTitle   = $request->input('post_title');
    $postContent = $request->input('post_content', '');
    $postType    = $request->input('post_type', 'sharing');

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
        $raw = (function () use ($prompt) {
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
        })();

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

        if (count($objectives) < 3 || count($objectives) > 5) {
            throw new \Exception('AI must return 3 to 5 learning objectives');
        }

        return response()->json([
            'result' => [
                'objectives'     => $objectives,
                'difficulty'     => $difficulty,
                'estimated_time' => $estimatedTime,
            ],
            'provider' => 'deepseek',
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error'    => $e->getMessage(),
            'provider' => 'deepseek',
        ], 502);
    }

})->middleware(['web', 'throttle:15,1']);

Route::post('/ai-doubt-clarify', function (Request $request) {
    try {
        $validator = Validator::make($request->all(), [
            'post_title'     => ['required', 'string', 'max:300'],
            'post_content'   => ['nullable', 'string', 'max:2000'],
            'answer_content' => ['required', 'string', 'max:2000'],
            'user_confusion' => ['required', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please describe what is confusing about this answer.',
                'errors' => $validator->errors(),
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $postTitle     = trim((string) $request->input('post_title'));
        $postContent   = trim((string) $request->input('post_content', ''));
        $answerContent = trim((string) $request->input('answer_content'));
        $userConfusion = trim((string) $request->input('user_confusion'));

        if ($userConfusion === '') {
            return response()->json([
                'message' => 'Please describe what is confusing about this answer.',
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $currentLocale = app()->getLocale();
        $lang = match ($currentLocale) {
            'zh'    => 'Chinese (Simplified)',
            'my'    => 'Malay',
            default => 'English',
        };

        $contextBlock = trim($postContent) !== ''
            ? "Original question:\n{$postTitle}\n\nQuestion context:\n{$postContent}\n\nComment/Answer the student is confused about:\n{$answerContent}\n\nStudent confusion:\n{$userConfusion}"
            : "Original question:\n{$postTitle}\n\nComment/Answer the student is confused about:\n{$answerContent}\n\nStudent confusion:\n{$userConfusion}";

        $prompt = "You are helping a student understand a Q&A comment/answer. Respond entirely in {$lang}. Return ONLY valid JSON. No markdown, no HTML, no code fences, no extra text.\n\n"
            . "The student is confused about this specific comment/answer. Your job is to explain the comment clearly based on the original question and the comment content.\n\n"
            . "Treat the student's confusion as: I do not understand this comment/answer because...\n\n"
            . "Do not judge whether the comment is wrong unless it is necessary to explain the confusion. Do not mark the comment as an error. Do not treat this as a report.\n\n"
            . "Provide a clear, simple explanation that helps the student understand the comment. Keep it student-friendly and concise.\n\n"
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

        $raw = (function () use ($prompt) {
            $res = Http::withToken(config('services.deepseek.key'))
                ->timeout(20)
                ->post('https://api.deepseek.com/v1/chat/completions', [
                    'model'       => 'deepseek-chat',
                    'messages'    => [
                        ['role' => 'system', 'content' => 'You are a supportive tutor. Always respond with valid JSON only.'],
                        ['role' => 'user',   'content' => $prompt],
                    ],
                    'temperature' => 0.4,
                    'response_format' => ['type' => 'json_object'],
                ]);

            if (!$res->successful()) {
                throw new \Exception('AI service is temporarily unavailable.');
            }

            $text = $res->json('choices.0.message.content');
            if (!is_string($text) || trim($text) === '') {
                throw new \Exception('DeepSeek returned empty response');
            }

            return $text;
        })();

        $decoded     = $decodeResult($raw);
        $explanation = isset($decoded['explanation']) && is_string($decoded['explanation']) ? trim($decoded['explanation']) : '';
        $guidance    = isset($decoded['guidance']) && is_string($decoded['guidance']) ? trim($decoded['guidance']) : '';

        if ($explanation === '') {
            throw new \Exception('AI returned missing explanation');
        }

        return response()->json([
            'result'   => compact('explanation', 'guidance'),
            'provider' => 'deepseek',
        ], 200, [], JSON_UNESCAPED_UNICODE);

    } catch (\Throwable) {
        return response()->json([
            'message' => 'AI clarification is temporarily unavailable. Please try again in a moment.',
            'error' => 'AI clarification failed.',
            'provider' => 'deepseek',
        ], 502, [], JSON_UNESCAPED_UNICODE);
    }

})->middleware(['web', 'throttle:20,1']);

Route::post('/ai-validate-wrong', function (Request $request) {
    try {
        $validator = Validator::make($request->all(), [
            'post_title'     => ['required', 'string', 'max:300'],
            'post_content'   => ['nullable', 'string', 'max:2000'],
            'answer_content' => ['required', 'string', 'max:2000'],
            'user_reasoning' => ['required', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please enter a short reason before checking this answer.',
                'errors' => $validator->errors(),
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $postTitle     = trim((string) $request->input('post_title'));
        $postContent   = trim((string) $request->input('post_content', ''));
        $answerContent = trim((string) $request->input('answer_content'));
        $userReasoning = trim((string) $request->input('user_reasoning'));

        if ($userReasoning === '') {
            return response()->json([
                'message' => 'Please explain why you think this answer is wrong.',
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        if (mb_strlen($userReasoning, 'UTF-8') < 4) {
            return response()->json([
                'message' => 'Please add a little more detail about why this answer is wrong.',
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $currentLocale = app()->getLocale();
        $lang = match ($currentLocale) {
            'zh'    => 'Chinese (Simplified)',
            'my'    => 'Malay',
            default => 'English',
        };

        $contextBlock = trim($postContent) !== ''
            ? "Question:\n{$postTitle}\n\nContext:\n{$postContent}\n\nComment/Answer:\n{$answerContent}\n\nStudent report reason:\n{$userReasoning}"
            : "Question:\n{$postTitle}\n\nComment/Answer:\n{$answerContent}\n\nStudent report reason:\n{$userReasoning}";

        $prompt = "You are checking whether a Q&A comment should be marked as wrong or problematic in an educational platform. Respond entirely in {$lang} except for the category value. Return strict JSON only. No markdown, no HTML, no code fences, no extra text.\n\n"
            . "Be practical and student-friendly. Do not require formal proof, citations, or academic wording. The student's report reason can be short, informal, multilingual, or imperfect.\n\n"
            . "However, the student must still explain WHY they think the comment is wrong/problematic. Treat the reason as a required hint, not as formal evidence.\n\n"
            . "Mark the comment as wrong/problematic if it is factually wrong, logically wrong, misleading, irrelevant, nonsense, placeholder text, spam-like, empty, nearly empty, clearly unhelpful for the learning context, or does not answer the question.\n\n"
            . "Accept simple explanatory reasons such as: This answer is useless; He is saying nonsense; 这个答案没有用; 没有解释; Jawapan ini tidak menjawab soalan; I don't understand because the answer does not explain anything.\n\n"
            . "Do NOT mark it wrong when the student's reason is only a bare label with no explanation, such as: wrong, bad, incorrect, salah, 错, 有问题, I disagree. In those cases, return is_wrong false with category not_wrong and ask the user to explain what is wrong.\n\n"
            . "Do not require a specific mathematical or factual correction if the issue is that the answer is meaningless, irrelevant, or not evaluable. But the reason should still identify that issue in simple words.\n\n"
            . "Return JSON in this exact shape:\n"
            . '{"is_wrong":true,"category":"nonsense","message":"short user-friendly explanation"}' . "\n\n"
            . "Allowed category values: nonsense, irrelevant, factual_error, logical_error, misleading, insufficient_answer, not_wrong.\n\n"
            . $contextBlock . "\n\n"
            . "Decision:";

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

        $allowedCategories = [
            'nonsense',
            'irrelevant',
            'factual_error',
            'logical_error',
            'misleading',
            'insufficient_answer',
            'not_wrong',
        ];

        $raw = (function () use ($prompt) {
            $res = Http::withToken(config('services.deepseek.key'))
                ->timeout(20)
                ->post('https://api.deepseek.com/v1/chat/completions', [
                    'model'       => 'deepseek-chat',
                    'messages'    => [
                        ['role' => 'system', 'content' => 'You are a fair academic evaluator. Always respond with valid JSON only.'],
                        ['role' => 'user',   'content' => $prompt],
                    ],
                    'temperature' => 0.2,
                    'response_format' => ['type' => 'json_object'],
                ]);

            if (!$res->successful()) {
                throw new \Exception('AI service is temporarily unavailable.');
            }

            $text = $res->json('choices.0.message.content');
            if (!is_string($text) || trim($text) === '') {
                throw new \Exception('DeepSeek returned empty response');
            }

            return $text;
        })();

        $decoded = $decodeResult($raw);
        $isWrong = isset($decoded['is_wrong']) && is_bool($decoded['is_wrong'])
            ? $decoded['is_wrong']
            : (isset($decoded['is_valid']) && is_bool($decoded['is_valid']) ? $decoded['is_valid'] : false);
        $category = isset($decoded['category']) && is_string($decoded['category'])
            ? trim($decoded['category'])
            : ($isWrong ? 'insufficient_answer' : 'not_wrong');
        $message = isset($decoded['message']) && is_string($decoded['message'])
            ? trim($decoded['message'])
            : (isset($decoded['feedback']) && is_string($decoded['feedback']) ? trim($decoded['feedback']) : '');

        if (! in_array($category, $allowedCategories, true)) {
            $category = $isWrong ? 'insufficient_answer' : 'not_wrong';
        }

        if (! $isWrong) {
            $category = 'not_wrong';
        }

        if ($message === '') {
            $message = $isWrong
                ? 'This comment appears problematic for the learning context.'
                : 'The AI did not find a clear problem with this comment.';
        }

        return response()->json([
            'result'   => [
                'is_wrong' => $isWrong,
                'category' => $category,
                'message'  => $message,
                'is_valid' => $isWrong,
                'feedback' => $message,
            ],
            'provider' => 'deepseek',
        ], 200, [], JSON_UNESCAPED_UNICODE);

    } catch (\Throwable) {
        return response()->json([
            'message' => 'AI validation is temporarily unavailable. Please try again in a moment.',
            'error' => 'AI validation failed.',
            'provider' => 'deepseek',
        ], 502, [], JSON_UNESCAPED_UNICODE);
    }

})->middleware(['web', 'throttle:15,1']);

});

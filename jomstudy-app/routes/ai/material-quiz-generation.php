<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    /*
    |----------------------------------------------------------------------
    | POST /ai-material-quiz
    | Generate a quiz question from a piece of material content.
    |----------------------------------------------------------------------
    */
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

        $prompt = "You are an expert teacher creating a quiz from a Study Material. Return ONLY valid JSON. No markdown, no code fences, no extra text.\n\n"
            ."Task:\n"
            ."1. Generate exactly 1 multiple-choice question from the Study Material.\n"
            ."2. The question must check understanding of the material, not trivia outside it.\n"
            ."3. The question must have exactly 4 options.\n"
            ."4. Exactly 1 option must be correct.\n"
            ."5. Distractors should reflect common learner misunderstandings.\n"
            ."6. Include a short explanation for the correct answer.\n"
            ."7. The questions array must contain exactly 1 item only.\n\n"
            .$subjectLine
            ."Study Material Title: {$materialTitle}\n\n"
            ."Study Material Content:\n{$materialContent}\n\n"
            ."Return JSON in this exact shape:\n"
            .'{"questions":[{"question":"string","options":["string","string","string","string"],"answerIndex":0,"explanation":"string"}]}'."\n\n"
            ."CRITICAL LANGUAGE REQUIREMENT: The study material above may be written in any language, but you MUST write EVERY text field in your JSON output (question, every item in options, explanation) entirely in {$targetLanguage}. Do NOT mirror the language of the material. Translate any concepts into {$targetLanguage}. The ONLY exception is keeping technical terms or proper nouns that have no natural {$targetLanguage} equivalent. Output language: {$targetLanguage}.";

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
            $raw = (function () use ($prompt, $targetLanguage) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(30)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model' => 'deepseek-chat',
                        'messages' => [
                            ['role' => 'system', 'content' => "You are an expert quiz writer. Always respond with valid JSON only. All human-readable text in your response must be written in {$targetLanguage}, regardless of the language used in the study material."],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'temperature' => 0.35,
                        'response_format' => ['type' => 'json_object'],
                    ]);

                if (! $res->successful()) {
                    throw new \Exception('DeepSeek error: '.$res->status());
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
                'error' => $e->getMessage(),
                'provider' => 'deepseek',
            ], 502);
        }
    })->middleware(['web', 'throttle:12,1']);

});

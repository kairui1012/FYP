<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    /*
    |----------------------------------------------------------------------
    | POST /ai-quiz-options
    | Generate quiz options for a question. Restricted to teachers/admins.
    |----------------------------------------------------------------------
    */
    Route::post('/ai-quiz-options', function (Request $request) {
        $user = $request->user();
        $role = strtolower((string) ($user?->role ?? ''));
        if (! in_array($role, ['teacher', 'admin'], true)) {
            return response()->json([
                'error' => 'Only teachers and admins can use AI quiz options.',
            ], 403);
        }

        $request->validate([
            'question' => 'required|string|max:500',
            'subject' => 'nullable|string|max:120',
            'language_code' => 'nullable|string|in:en,zh,my,bm',
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
                .collect($existingOptions)->map(fn ($option, $index) => chr(65 + $index).". {$option}")->implode("\n")
                ."\n\n"
            : '';
        $answerPlacementInstruction = match ($answerPlacement) {
            'A', 'B', 'C', 'D' => "8. The correct answer must be placed at option {$answerPlacement}.\n",
            default => "8. You may place the correct answer at any option position.\n",
        };
        $isMathLikeQuestion = str($subject)->lower()->contains('math')
            || preg_match('/[=+\-*\/^()]/u', $question) === 1;
        $mathInstruction = $isMathLikeQuestion
            ? "9. For math or calculation questions, solve carefully first.\n"
                ."10. Make all 4 options mathematically distinct.\n"
                ."11. Keep math notation plain and concise, such as x = -9 or -9. Do not add extra explanation inside the options.\n"
            : '';

        $prompt = "You are an expert teacher creating multiple-choice quiz options for students. Return ONLY valid JSON. No markdown, no code fences, no extra text.\n\n"
            ."Task:\n"
            ."1. Generate exactly 4 answer options for the quiz question.\n"
            ."2. Exactly 1 option must be clearly correct.\n"
            ."3. The other 3 options must be plausible distractors, not silly or obviously fake.\n"
            ."4. Keep options concise and suitable for classroom learning.\n"
            ."5. Do not include option letters like A, B, C, D inside the option text.\n"
            ."6. Set answerIndex to the zero-based index of the correct option.\n"
            ."7. If the question is ambiguous, choose the best answer and make distractors reflect common misunderstandings.\n\n"
            .$answerPlacementInstruction
            .$mathInstruction
            .$subjectLine
            ."Question: {$question}\n\n"
            .$existingOptionsBlock
            ."Return JSON in this exact shape:\n"
            .'{"options":["string","string","string","string"],"answerIndex":0,"explanation":"string"}'."\n\n"
            ."CRITICAL LANGUAGE REQUIREMENT: The question above may be written in any language, but you MUST write EVERY text field in your JSON output (every item in options, explanation) entirely in {$targetLanguage}. Do NOT mirror the language of the question. The ONLY exception is keeping technical terms or proper nouns that have no natural {$targetLanguage} equivalent. Output language: {$targetLanguage}.";

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
            $raw = (function () use ($prompt, $targetLanguage) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(25)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model' => 'deepseek-chat',
                        'messages' => [
                            ['role' => 'system', 'content' => "You are an expert quiz writer. Always respond with valid JSON only. All human-readable text in your response must be written in {$targetLanguage}, regardless of the language used in the question."],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'temperature' => 0.45,
                        'response_format' => ['type' => 'json_object'],
                    ]);

                if (! $res->successful()) {
                    throw new \Exception('DeepSeek error: '.$res->status());
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
                'error' => $e->getMessage(),
                'provider' => 'deepseek',
            ], 502);
        }
    })->middleware(['web', 'throttle:20,1']);

});

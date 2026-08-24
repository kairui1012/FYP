<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;

Route::middleware(['auth'])->group(function () {
    /*
    |----------------------------------------------------------------------
    | POST /ai-doubt-clarify
    | Clarify a specific point of confusion a student has about an answer.
    |----------------------------------------------------------------------
    */
    Route::post('/ai-doubt-clarify', function (Request $request) {
        try {
            $validator = Validator::make($request->all(), [
                'post_title' => ['required', 'string', 'max:300'],
                'post_content' => ['nullable', 'string', 'max:2000'],
                'answer_content' => ['required', 'string', 'max:2000'],
                'user_confusion' => ['required', 'string', 'max:1000'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Please describe what is confusing about this answer.',
                    'errors' => $validator->errors(),
                ], 422, [], JSON_UNESCAPED_UNICODE);
            }

            $postTitle = trim((string) $request->input('post_title'));
            $postContent = trim((string) $request->input('post_content', ''));
            $answerContent = trim((string) $request->input('answer_content'));
            $userConfusion = trim((string) $request->input('user_confusion'));

            if ($userConfusion === '') {
                return response()->json([
                    'message' => 'Please describe what is confusing about this answer.',
                ], 422, [], JSON_UNESCAPED_UNICODE);
            }

            $currentLocale = app()->getLocale();
            $lang = match ($currentLocale) {
                'zh' => 'Chinese (Simplified)',
                'my' => 'Malay',
                default => 'English',
            };

            $contextBlock = trim($postContent) !== ''
                ? "Original question:\n{$postTitle}\n\nQuestion context:\n{$postContent}\n\nComment/Answer the student is confused about:
            \n{$answerContent}\n\nStudent confusion:\n{$userConfusion}"
                : "Original question:\n{$postTitle}\n\nComment/Answer the student is confused about:\n{$answerContent}\n\n
            Student confusion:\n{$userConfusion}";

            $prompt = "You are helping a student understand a Q&A comment/answer. Respond entirely in {$lang}. Return ONLY valid JSON. 
        No markdown, no HTML, no code fences, no extra text.\n\n"
                ."The student is confused about this specific comment/answer. Your job is to explain the comment clearly 
            based on the original question and the comment content.\n\n"
                ."Treat the student's confusion as: I do not understand this comment/answer because...\n\n"
                ."Do not judge whether the comment is wrong unless it is necessary to explain the confusion. 
            Do not mark the comment as an error. Do not treat this as a report.\n\n"
                ."Provide a clear, simple explanation that helps the student understand the comment. Keep it student-friendly and concise.\n\n"
                .$contextBlock."\n\n"
                ."Return JSON in this exact shape:\n"
                .'{"explanation":"string","guidance":"string"}'."\n\n"
                ."CRITICAL LANGUAGE REQUIREMENT: The question, comment, and student confusion above may be written in any language, but you MUST write EVERY text field in your JSON output (explanation, guidance) entirely in {$lang}. Do NOT mirror the language of the inputs. Translate any concepts into {$lang}. The ONLY exception is keeping technical terms or proper nouns that have no natural {$lang} equivalent. Output language: {$lang}.";

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

                throw new \Exception('AI returned invalid JSON');
            };

            $raw = (function () use ($prompt, $lang) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(20)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model' => 'deepseek-chat',
                        'messages' => [
                            ['role' => 'system', 'content' => "You are a supportive tutor. Always respond with valid JSON only. All human-readable text in your response must be written in {$lang}, regardless of the language used in the inputs."],
                            ['role' => 'user',   'content' => $prompt],
                        ],
                        'temperature' => 0.4,
                        'response_format' => ['type' => 'json_object'],
                    ]);

                if (! $res->successful()) {
                    throw new \Exception('AI service is temporarily unavailable.');
                }

                $text = $res->json('choices.0.message.content');
                if (! is_string($text) || trim($text) === '') {
                    throw new \Exception('DeepSeek returned empty response');
                }

                return $text;
            })();

            $decoded = $decodeResult($raw);
            $explanation = isset($decoded['explanation']) && is_string($decoded['explanation']) ? trim($decoded['explanation']) : '';
            $guidance = isset($decoded['guidance']) && is_string($decoded['guidance']) ? trim($decoded['guidance']) : '';

            if ($explanation === '') {
                throw new \Exception('AI returned missing explanation');
            }

            return response()->json([
                'result' => compact('explanation', 'guidance'),
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

});

<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    /*
    |----------------------------------------------------------------------
    | POST /ai-best-answer
    | Explain why a forum post's accepted "best answer" is correct.
    |----------------------------------------------------------------------
    */
    Route::post('/ai-best-answer', function (Request $request) {
        $request->validate([
            'post_title' => 'required|string|max:300',
            'post_content' => 'nullable|string|max:2000',
            'answer_content' => 'required|string|max:2000',
            'provider' => 'nullable|in:deepseek',
        ]);

        $postTitle = $request->input('post_title');
        $postContent = $request->input('post_content', '');
        $answerContent = $request->input('answer_content');

        $currentLocale = app()->getLocale();
        $lang = match ($currentLocale) {
            'zh' => 'Chinese (Simplified)',
            'my' => 'Malay',
            default => 'English',
        };

        $contextBlock = trim($postContent) !== ''
            ? "Question: {$postTitle}\n\nContext / Description:\n{$postContent}\n\nBest Answer:\n{$answerContent}"
            : "Question: {$postTitle}\n\nBest Answer:\n{$answerContent}";

        $prompt = "You are an expert tutor helping students understand answers. Return ONLY valid JSON. No markdown, no code fences, no extra text.\n\n"
            ."Your task:\n"
            ."1. Read the question and the best answer provided.\n"
            ."2. Write a clear, structured, educational explanation of WHY the answer is correct.\n"
            ."3. Break it down step-by-step if the topic benefits from it.\n"
            ."4. Keep it easy to understand for students.\n"
            ."5. Include any key concepts or principles involved.\n\n"
            .$contextBlock."\n\n"
            ."Return JSON in this exact shape:\n"
            .'{"explanation":"string","key_points":["string"],"summary":"string"}'."\n\n"
            ."CRITICAL LANGUAGE REQUIREMENT: The question and answer above may be written in any language, but you MUST write EVERY text field in your JSON output (explanation, every item in key_points, summary) entirely in {$lang}. Do NOT mirror the language of the question or answer. Translate any concepts into {$lang}. The ONLY exception is keeping technical terms or proper nouns that have no natural {$lang} equivalent. Output language: {$lang}.";

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

        try {
            $raw = (function () use ($prompt, $lang) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(25)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model' => 'deepseek-chat',
                        'messages' => [
                            ['role' => 'system', 'content' => "You are an expert tutor. Always respond with valid JSON only. All human-readable text in your response must be written in {$lang}, regardless of the language used in the question or answer."],
                            ['role' => 'user',   'content' => $prompt],
                        ],
                        'temperature' => 0.5,
                    ]);

                if (! $res->successful()) {
                    throw new \Exception('DeepSeek error: '.$res->status());
                }

                $text = $res->json('choices.0.message.content');
                if (! is_string($text) || trim($text) === '') {
                    throw new \Exception('DeepSeek returned empty response');
                }

                return $text;
            })();

            $decoded = $decodeResult($raw);
            $explanation = isset($decoded['explanation']) && is_string($decoded['explanation']) ? trim($decoded['explanation']) : '';
            $keyPoints = isset($decoded['key_points']) && is_array($decoded['key_points'])
                ? array_values(array_filter(array_map(fn ($v) => is_string($v) ? trim($v) : '', $decoded['key_points'])))
                : [];
            $summary = isset($decoded['summary']) && is_string($decoded['summary']) ? trim($decoded['summary']) : '';

            if ($explanation === '') {
                throw new \Exception('AI returned missing explanation');
            }

            return response()->json([
                'result' => [
                    'explanation' => $explanation,
                    'key_points' => $keyPoints,
                    'summary' => $summary,
                ],
                'provider' => 'deepseek',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 502);
        }

    })->middleware(['web', 'throttle:20,1']);

});

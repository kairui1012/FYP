<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;

Route::middleware(['auth'])->group(function () {
    Route::post('/ai-validate-wrong', function (Request $request) {
        try {
            $validator = Validator::make($request->all(), [
                'post_title' => ['required', 'string', 'max:300'],
                'post_content' => ['nullable', 'string', 'max:2000'],
                'answer_content' => ['required', 'string', 'max:2000'],
                'user_reasoning' => ['required', 'string', 'max:1000'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Please enter a short reason before checking this answer.',
                    'errors' => $validator->errors(),
                ], 422, [], JSON_UNESCAPED_UNICODE);
            }

            $postTitle = trim((string) $request->input('post_title'));
            $postContent = trim((string) $request->input('post_content', ''));
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
                'zh' => 'Chinese (Simplified)',
                'my' => 'Malay',
                default => 'English',
            };

            $contextBlock = trim($postContent) !== ''
                ? "Question:\n{$postTitle}\n\nContext:\n{$postContent}\n\nComment/Answer:\n{$answerContent}\n\nStudent report reason:\n{$userReasoning}"
                : "Question:\n{$postTitle}\n\nComment/Answer:\n{$answerContent}\n\nStudent report reason:\n{$userReasoning}";

            $prompt = "You are checking whether a Q&A comment should be marked as wrong or problematic in an 
        educational platform. Respond entirely in {$lang} except for the category value. 
        Return strict JSON only. No markdown, no HTML, no code fences, no extra text.\n\n"
                ."Be practical and student-friendly. Do not require formal proof, citations, 
            or academic wording. The student's report reason can be short, informal, multilingual, 
            or imperfect.\n\n"
                ."However, the student must still explain WHY they think the comment is wrong/problematic. 
            Treat the reason as a required hint, not as formal evidence.\n\n"
                ."Mark the comment as wrong/problematic if it is factually wrong, logically wrong, misleading, 
            irrelevant, nonsense, placeholder text, spam-like, empty, nearly empty, 
            clearly unhelpful for the learning context, or does not answer the question.\n\n"
                ."Accept simple explanatory reasons such as: This answer is useless; 
            He is saying nonsense; 这个答案没有用; 没有解释; Jawapan ini tidak menjawab soalan; 
            I don't understand because the answer does not explain anything.\n\n"
                ."Do NOT mark it wrong when the student's reason is only a bare label with no explanation, 
            such as: wrong, bad, incorrect, salah, 错, 有问题, I disagree. 
            In those cases, return is_wrong false with category not_wrong and ask 
            the user to explain what is wrong.\n\n"
                ."Do not require a specific mathematical or factual correction 
            if the issue is that the answer is meaningless, irrelevant, 
            or not evaluable. But the reason should still identify that issue in simple words.\n\n"
                ."Return JSON in this exact shape:\n"
                .'{"is_wrong":true,"category":"nonsense","message":"short user-friendly explanation"}'."\n\n"
                ."Allowed category values: nonsense, irrelevant, factual_error,
            logical_error, misleading, insufficient_answer, not_wrong.\n\n"
                ."CRITICAL LANGUAGE REQUIREMENT: The inputs above may be written in any language, but the \"message\" field MUST be written entirely in {$lang}, regardless of the language of the question, comment, or report reason. Do NOT mirror the input language. The \"category\" field MUST stay one of the exact English values listed above. Output language for message: {$lang}.\n\n"
                .$contextBlock."\n\n"
                .'Decision:';

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

            $allowedCategories = [
                'nonsense',
                'irrelevant',
                'factual_error',
                'logical_error',
                'misleading',
                'insufficient_answer',
                'not_wrong',
            ];

            $raw = (function () use ($prompt, $lang) {
                $res = Http::withToken(config('services.deepseek.key'))
                    ->timeout(20)
                    ->post('https://api.deepseek.com/v1/chat/completions', [
                        'model' => 'deepseek-chat',
                        'messages' => [
                            ['role' => 'system', 'content' => "You are a fair academic evaluator. Always respond with valid JSON only. The human-readable \"message\" field must be written in {$lang} regardless of the input language; the \"category\" field must stay one of the exact English enum values."],
                            ['role' => 'user',   'content' => $prompt],
                        ],
                        'temperature' => 0.2,
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
                'result' => [
                    'is_wrong' => $isWrong,
                    'category' => $category,
                    'message' => $message,
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

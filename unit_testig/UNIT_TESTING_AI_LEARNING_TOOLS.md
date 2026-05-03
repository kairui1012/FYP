## 5.1.1.15 AI Learning Tools Unit Testing

### Translation AI

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| TAI-01 | Request translation with valid payload. | `POST /translate` with `texts[]` and `provider=deepseek` or `gemini`. | Translations are returned as structured JSON. | Route validates input and returns `{ translations, provider }` when provider response is valid. | Pass |
| TAI-02 | Submit empty or invalid texts payload. | Missing `texts`, non-array `texts`, or non-string `texts.*`. | Request is rejected by validation. | Laravel validation enforces `required|array|max:200` and `texts.*` string rule; invalid request is rejected. | Pass |
| TAI-03 | Submit invalid provider value. | `provider=openai`. | Request is rejected by validation. | Validation enforces `provider in deepseek,gemini`; invalid provider is rejected. | Pass |
| TAI-04 | Provider returns malformed JSON. | AI returns non-JSON or invalid structure. | System handles failure safely with error response. | Code throws exception (`invalid JSON structure` / non-string values) and returns JSON error with HTTP 502. | Pass |
| TAI-05 | Test provider fallback behavior on backend route. | DeepSeek fails for `/translate`. | Backend should auto-fallback to Gemini if implemented. | Backend route does not auto-fallback; it only processes the requested provider and returns 502 on failure. | Failed |

### Quiz Explanation AI

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| QEAI-01 | Request AI quiz explanation. | `POST /ai-explain` with valid question, options, user/creator answer, provider. | Structured analysis is returned. | Route returns `analysis` object with `aiAnswer`, correctness flags, explanation, discrepancy fields, confidence, and echoed answers. | Pass |
| QEAI-02 | Submit invalid quiz explanation payload. | Missing required fields or options < 2. | Request is rejected by validation. | Validation enforces required strings, options array bounds, and provider rule; invalid input is rejected. | Pass |
| QEAI-03 | AI returns JSON wrapped in code fence or extra text. | Response contains fenced JSON or surrounding text. | JSON should still be parsed if recoverable. | `decodeAnalysis` attempts raw, fence-stripped, and `{...}` substring parsing before failing. | Pass |
| QEAI-04 | AI omits `isUserCorrect` or `matchesCreator`. | JSON includes answer and explanation but missing boolean flags. | System should derive booleans safely if possible. | Code computes fallback booleans by normalized answer comparison with user and creator answers. | Pass |
| QEAI-05 | AI omits mandatory explanation/answer text. | Missing `aiAnswer` or `explanation`. | Request should fail safely. | Code throws `missing ai answer` or `missing explanation` and returns 502 JSON error. | Pass |

### Quiz Option Generation

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| QOG-01 | Generate quiz options as teacher/admin. | Authenticated teacher/admin calls `POST /ai-quiz-options`. | Returns exactly 4 options and valid answer index. | Route validates and enforces exactly 4 options plus index 0–3 before returning `quiz_options`. | Pass |
| QOG-02 | Generate quiz options as student/guest. | Non-teacher/admin calls `POST /ai-quiz-options`. | Access is denied. | Route checks `$request->user()->role`; non teacher/admin receives 403 with error message. | Pass |
| QOG-03 | Submit invalid option-generation input. | Missing question or invalid provider. | Validation rejects request. | Validation rules reject invalid payload (`question` required, provider enum, etc.). | Pass |
| QOG-04 | AI returns answer letter format (for example `"B"`). | AI returns `answerIndex` as letter. | System should map it to numeric index if supported. | Parser converts `A/B/C/D` to `0/1/2/3` and continues validation. | Pass |
| QOG-05 | Enforce requested answer placement. | `answer_placement=A/B/C/D`. | Correct option appears at requested position. | Code reorders options and updates `answerIndex` to requested slot when needed. | Pass |

### Material Quiz Generation

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| MQG-01 | Generate material quiz with valid payload. | `POST /ai-material-quiz` with title/content/provider. | Valid quiz question set is returned. | Route parses and filters questions, requires valid shape, and returns first valid question in `quiz.questions`. | Pass |
| MQG-02 | Submit invalid material quiz payload. | Missing title/content or invalid provider. | Validation rejects request. | Validation rules enforce required fields and provider enum; invalid input is rejected. | Pass |
| MQG-03 | Request multiple questions. | `question_count` > 1. | Multiple questions should be returned if feature supports it. | Validation rule currently enforces `question_count max:1`, and route hard-sets `$questionCount=1`; only one question is returned. | Failed |
| MQG-04 | AI returns malformed/insufficient question structure. | Missing options/invalid index/empty question. | System rejects unsafe output. | Invalid entries are filtered; if none valid remain, route throws and returns 502 with error. | Pass |

### Best Answer Explanation

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| BAE-01 | Generate best-answer explanation. | `POST /ai-best-answer` with valid post/answer content. | Explanation result is returned in JSON. | Route returns `result` with `explanation`, `key_points[]`, and `summary` when explanation exists. | Pass |
| BAE-02 | Submit invalid payload. | Missing `post_title` or `answer_content`. | Request is rejected by validation. | Validation enforces required fields and provider enum; invalid input is rejected. | Pass |
| BAE-03 | AI response omits explanation. | JSON has no usable explanation text. | System should fail safely. | Route throws `AI returned missing explanation` and returns 502 JSON error. | Pass |

### Answer Feedback

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| AFB-01 | Generate formative answer feedback. | `POST /ai-answer-feedback` valid payload. | Feedback structure is returned. | Route returns `feedback` object containing status, feedback text, strengths/improvements, next step, confidence. | Pass |
| AFB-02 | AI returns unknown status/confidence. | Status not in `good|incomplete|wrong` or invalid confidence. | Unsafe values are normalized. | Code defaults invalid status to `incomplete` and invalid confidence to `medium`. | Pass |
| AFB-03 | AI omits main feedback text. | `feedback` field empty/missing. | System should reject response. | Route throws `AI returned missing feedback` and returns 502 error payload. | Pass |

### Learning Objectives Generation

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| LOG-01 | Generate learning objectives. | `POST /ai-learning-objectives` with valid payload. | Objectives and metadata are returned. | Route returns `result` with `objectives[]`, `difficulty`, and `estimated_time`. | Pass |
| LOG-02 | Submit invalid post type/provider. | `post_type` not in allowed list or invalid provider. | Request is rejected by validation. | Validation enforces `post_type in material,question,quiz,sharing` and provider enum. | Pass |
| LOG-03 | AI returns invalid difficulty value. | Difficulty outside allowed values. | Difficulty should be normalized if possible. | Code defaults difficulty to `intermediate` when invalid. | Pass |
| LOG-04 | AI returns empty objectives list. | No valid objective strings returned. | System should reject output. | Route throws `AI returned no learning objectives` and returns 502 JSON error. | Pass |

### Doubt Clarification

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| DCL-01 | Request doubt clarification. | `POST /ai-doubt-clarify` with post title/answer/provider. | Clarification result is returned. | Route returns `result` with `explanation` and `guidance`. | Pass |
| DCL-02 | Submit invalid payload. | Missing `post_title` or `answer_content`. | Request is rejected by validation. | Validation rejects missing required fields. | Pass |
| DCL-03 | Verify context scope used in prompt. | `post_title`, optional `post_content`, `answer_content`. | Prompt should use only these fields if implemented that way. | Prompt is built only from these three fields; no unrelated data source is used. | Pass |
| DCL-04 | AI omits explanation text. | Missing or empty explanation in AI JSON. | System should reject response. | Route throws `AI returned missing explanation` and returns 502 JSON error. | Pass |

### Wrong Answer Validation

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| WAV-01 | Validate wrong-answer claim with sufficient reasoning. | `POST /ai-validate-wrong` valid payload and `user_reasoning >= 10 chars`. | Result with boolean validity and feedback is returned. | Route returns `result` with `is_valid` and `feedback` when AI JSON is valid. | Pass |
| WAV-02 | Submit short/empty reasoning. | `user_reasoning` below minimum length. | Validation rejects request. | Validation enforces `required|string|min:10|max:1000`; short reasoning is rejected. | Pass |
| WAV-03 | AI omits feedback field. | `feedback` empty/missing in decoded JSON. | System should reject response safely. | Route throws `AI returned missing feedback` and returns 502 JSON error. | Pass |
| WAV-04 | Require reasoning quality beyond length at backend level. | Generic but >=10 char reasoning (for example weak reasoning text). | Backend should reject weak reasoning before AI call if enforced. | Backend only enforces length/format; semantic quality is delegated to AI and not pre-validated in code. | Failed |

### AI API Error Handling

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| API-01 | Upstream DeepSeek call fails. | Non-2xx DeepSeek response. | Endpoint returns clear error payload. | Routes throw `DeepSeek error: <status>` (or detailed message in translation) and return JSON error, typically HTTP 502. | Pass |
| API-02 | Upstream Gemini call fails. | Non-2xx Gemini response. | Endpoint returns clear error payload. | Routes throw `Gemini error: <status>` and return JSON error, typically HTTP 502. | Pass |
| API-03 | Gemini API key is missing (translation helper). | Empty `services.gemini.key` in config. | Error is surfaced cleanly. | Shared Gemini helper throws `Gemini API key is missing...`; route catches and returns 502 error JSON. | Pass |
| API-04 | Frontend fallback when DeepSeek fails. | DeepSeek request fails in client AI utilities. | Client retries with Gemini if implemented. | `ai-explain`, `ai-quiz-options`, `ai-material-quiz`, `ai-best-answer`, `ai-comment-feedback`, `ai-learning-objectives`, and translate button all implement DeepSeek->Gemini fallback. | Pass |

### Structured JSON Response Validation

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| JSV-01 | Parse strict JSON responses from AI. | AI returns valid JSON object in expected shape. | Output is parsed and mapped safely. | Each endpoint decodes JSON, validates critical fields, and normalizes optional fields before returning. | Pass |
| JSV-02 | Parse JSON wrapped in code fences or prose. | AI wraps JSON with markdown or extra text. | Parser should recover if JSON is extractable. | Multiple endpoints try raw text, fence-stripped text, and extracted `{...}` block before failing. | Pass |
| JSV-03 | Reject malformed JSON safely. | Invalid JSON from provider. | No unsafe output should pass through. | Endpoints throw explicit invalid JSON exceptions and return error payloads (502). | Pass |
| JSV-04 | Enforce exact objective count (3-5) for learning objectives. | AI returns 1 objective. | Response should be rejected if strict 3-5 is enforced. | Code requires only at least 1 objective; strict 3-5 count is not enforced in backend validation. | Failed |

### Authorization and Access Control

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| AAC-01 | Access AI routes as authenticated user. | Logged-in user calls AI endpoints. | Access allowed for supported endpoints. | AI routes use `web` + throttle; authenticated users can call them. | Pass |
| AAC-02 | Access AI routes as guest when auth should be required. | Guest calls endpoints like `/ai-explain`, `/ai-best-answer`, `/ai-learning-objectives`. | Guest should be blocked if auth-protected. | Most AI routes are not under `auth` middleware; guest blocking is not enforced at route level for these endpoints. | Failed |
| AAC-03 | Access role-restricted quiz-option AI as guest. | Guest calls `/ai-quiz-options`. | Access denied. | Explicit role check returns 403 for non teacher/admin, including guests. | Pass |


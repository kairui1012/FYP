# AI Features Documentation

This document describes all AI-powered features in the application, how they work, and how to configure them.

---

## Configuration

Two AI providers are supported. Both keys must be set in `.env`:

```env
DEEPSEEK_API_KEY=sk-...   # DeepSeek API key (primary provider)
GEMINI_API_KEY=AIza...    # Google Gemini API key (fallback provider)
```

Configured in `config/services.php`:
```php
'deepseek' => ['key' => env('DEEPSEEK_API_KEY')],
'gemini'   => ['key' => env('GEMINI_API_KEY')],
```

---

## Provider Strategy

**Primary → Fallback:** Every AI feature tries **DeepSeek** first. If DeepSeek fails (expired key, rate limit, network error), it automatically retries with **Gemini**. Both failing produces a user-visible error.

| Provider | Model | Role |
|----------|-------|------|
| DeepSeek | `deepseek-chat` | Primary |
| Google Gemini | `gemini-2.0-flash` | Fallback |

---

## Known Issue: DeepSeek Key Expiry

**Symptom:** AI buttons appear to work but always use Gemini (visible in the translate button label after translation).

**Cause:** The `DEEPSEEK_API_KEY` in `.env` is expired or invalid. The system silently falls back to Gemini.

**Fix:**
1. Replace `DEEPSEEK_API_KEY` in `.env` with a valid key from [platform.deepseek.com](https://platform.deepseek.com).
2. Ensure `GEMINI_API_KEY` is also set — it is empty in the current `.env`, which means **if DeepSeek also fails, all AI features break entirely**.

---

## AI Features

### 1. Quiz Answer Explanation

**Endpoint:** `POST /ai-explain`  
**Rate limit:** 20 requests/minute  
**Frontend lib:** [resources/js/lib/ai-explain.ts](resources/js/lib/ai-explain.ts)  
**UI component:** [resources/js/components/ui/btn-ai-ans.tsx](resources/js/components/ui/btn-ai-ans.tsx)

**What it does:** After a student selects an answer to a multiple-choice quiz question, they can click the "AI Answer" button (✦ sparkle icon, pink gradient). The AI:
- Determines the correct answer independently
- Tells the student whether their answer is correct
- Compares the AI's answer against the quiz creator's answer
- If they disagree, explains the discrepancy and possible ambiguity
- Shows confidence level: `high`, `medium`, or `low`

**Button enabled when:** A quiz option has been selected (disabled if `selected === ''`).

**Response shape:**
```json
{
  "analysis": {
    "aiAnswer": "string",
    "isUserCorrect": true,
    "matchesCreator": true,
    "explanation": "string",
    "discrepancyAnalysis": "string",
    "creatorReasoning": "string",
    "ambiguityNote": "string",
    "confidence": "high|medium|low",
    "userAnswer": "string",
    "creatorAnswer": "string"
  },
  "provider": "deepseek|gemini"
}
```

---

### 2. Quiz Question Translation

**Endpoint:** `POST /translate`  
**Rate limit:** 30 requests/minute  
**Frontend:** Inside [btn-ai-ans.tsx](resources/js/components/ui/btn-ai-ans.tsx) and [btn-ai-translate.tsx](resources/js/components/ui/btn-ai-translate.tsx)

**What it does:** Translates quiz question text and answer options into the user's current locale. The target language is determined by `app()->getLocale()`:

| Locale | Target Language |
|--------|----------------|
| `en` | English |
| `zh` | Chinese (Simplified) |
| `my` | Malay |

**Button enabled when:** Not yet translated. After translation it becomes disabled and shows the provider used (e.g., `中文 · DeepSeek`).

---

### 3. Post / Content Translation

**Endpoint:** `POST /translate`  
**Rate limit:** 30 requests/minute  
**UI component:** [resources/js/components/ui/btn-ai-translate.tsx](resources/js/components/ui/btn-ai-translate.tsx)

**What it does:** Translates full post title and content (and optional extra text arrays) into the current locale. Supports batching — large text arrays are split into chunks of 180 strings per request.

**Note:** The button is hidden on mobile (`hidden md:inline-flex`). It only appears on screens ≥ `md` breakpoint (768px).

---

### 4. Best Answer Explanation

**Endpoint:** `POST /ai-best-answer`  
**Rate limit:** 20 requests/minute  
**Frontend lib:** [resources/js/lib/ai-best-answer.ts](resources/js/lib/ai-best-answer.ts)  
**UI component:** [resources/js/components/best-answer-ai-panel.tsx](resources/js/components/best-answer-ai-panel.tsx)

**What it does:** When a post has a marked "best answer", a green "AI Explain" button appears below it. Clicking it asks the AI to explain why this answer is correct, structured as an educational breakdown.

**Response shape:**
```json
{
  "result": {
    "explanation": "string",
    "key_points": ["string"],
    "summary": "string"
  },
  "provider": "deepseek|gemini"
}
```

**UI behaviour:** Result can be collapsed/expanded. A "Regenerate" button re-calls the API.

---

### 5. Doubt Clarification

**Endpoint:** `POST /ai-doubt-clarify`  
**Rate limit:** 20 requests/minute  
**Frontend lib:** [resources/js/lib/ai-comment-feedback.ts](resources/js/lib/ai-comment-feedback.ts)  
**UI component:** [resources/js/components/comment-ai-doubt-panel.tsx](resources/js/components/comment-ai-doubt-panel.tsx)

**What it does:** When a student marks a comment as "I doubt this answer", the AI doubt panel **auto-loads on mount** (no button click required). It generates:
- A short explanation of why the answer makes sense
- Guidance to address the student's likely confusion

**Response shape:**
```json
{
  "result": {
    "explanation": "string",
    "guidance": "string"
  },
  "provider": "deepseek|gemini"
}
```

---

### 6. Wrong Answer Validation

**Endpoint:** `POST /ai-validate-wrong`  
**Rate limit:** 15 requests/minute  
**Frontend lib:** [resources/js/lib/ai-comment-feedback.ts](resources/js/lib/ai-comment-feedback.ts)  
**UI component:** [resources/js/components/comment-ai-wrong-panel.tsx](resources/js/components/comment-ai-wrong-panel.tsx)

**What it does:** When a student wants to flag an answer as "Wrong", they must provide a reasoning (minimum 10 characters). The AI evaluates whether the reasoning is genuinely valid:

- **Valid:** The student identified a factual error, logical flaw, or credible counter-argument → they can proceed to flag it
- **Invalid:** The reasoning is vague, dismissive, or off-topic → the student is guided to improve it

**Submit button enabled when:** `reasoning.trim().length >= 10`

**Response shape:**
```json
{
  "result": {
    "is_valid": true,
    "feedback": "string"
  },
  "provider": "deepseek|gemini"
}
```

---

### 7. Learning Objectives Generator

**Endpoint:** `POST /ai-learning-objectives`  
**Rate limit:** 15 requests/minute  
**Frontend lib:** [resources/js/lib/ai-learning-objectives.ts](resources/js/lib/ai-learning-objectives.ts)

**What it does:** Given a post title and content, generates 3–5 structured learning objectives that describe what a student will understand after reading the post. Also estimates difficulty and reading time.

**Post types supported:** `material`, `question`, `quiz`, `sharing`

**Response shape:**
```json
{
  "result": {
    "objectives": ["string"],
    "difficulty": "beginner|intermediate|advanced",
    "estimated_time": "string"
  },
  "provider": "deepseek|gemini"
}
```

---

### 8. Material Quiz Generator

**Endpoint:** `POST /ai-material-quiz`  
**Rate limit:** 12 requests/minute  
**Frontend lib:** [resources/js/lib/ai-material-quiz.ts](resources/js/lib/ai-material-quiz.ts)

**What it does:** Given a study material's title and content, the AI generates 1 multiple-choice question (4 options, 1 correct) that tests understanding of the material — not general knowledge. Includes an explanation for the correct answer.

**Response shape:**
```json
{
  "quiz": {
    "questions": [
      {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "answerIndex": 0,
        "explanation": "string"
      }
    ]
  },
  "provider": "deepseek|gemini"
}
```

---

### 9. Quiz Options Generator (Teacher / Admin Only)

**Endpoint:** `POST /ai-quiz-options`  
**Rate limit:** 20 requests/minute  
**Frontend lib:** [resources/js/lib/ai-quiz-options.ts](resources/js/lib/ai-quiz-options.ts)

**What it does:** Teachers and admins can type a quiz question and have the AI generate 4 answer options (1 correct + 3 plausible distractors). Supports:
- **Answer placement preference:** Force the correct answer to option A, B, C, or D, or leave it random
- **Subject awareness:** Provides context for math and subject-specific questions
- **Locale-aware:** Generates options in the user's current language
- **Existing options:** Pass current draft options; the AI may improve or replace them

**Access control:** Returns `403` if the authenticated user is not a `teacher` or `admin`.

**Response shape:**
```json
{
  "quiz_options": {
    "options": ["string", "string", "string", "string"],
    "answerIndex": 0,
    "explanation": "string"
  },
  "provider": "deepseek|gemini"
}
```

---

## Rate Limits Summary

| Endpoint | Limit |
|----------|-------|
| `/translate` | 30 req/min |
| `/ai-explain` | 20 req/min |
| `/ai-quiz-options` | 20 req/min |
| `/ai-best-answer` | 20 req/min |
| `/ai-answer-feedback` | 20 req/min |
| `/ai-doubt-clarify` | 20 req/min |
| `/ai-validate-wrong` | 15 req/min |
| `/ai-learning-objectives` | 15 req/min |
| `/ai-material-quiz` | 12 req/min |

---

## All Routes File

All AI routes are defined in [`routes/callAI.php`](routes/callAI.php) and included in the application via the main route service provider.

---

## Error Handling

All endpoints return `502` on failure:
```json
{ "error": "DeepSeek error: 401", "provider": "deepseek" }
```

Frontend libs catch these and retry with the fallback provider before surfacing the error to the user. If both providers fail, the error message is shown in the UI alongside a retry button (where applicable).

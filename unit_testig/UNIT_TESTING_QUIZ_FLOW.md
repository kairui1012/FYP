## 5.1.1.8 Quiz Flow Unit Testing

System area: Quiz flow

Notes: tests below are based on the actual code paths in `routes/web.php`, `App\Http\Controllers\PostController::completeQuiz`, `getQuizAttemptsForPost`, `recordMaterialQuizAttempt`, `App\Services\ProgressService`, `App\Services\AchievementService`, `App\Models\QuizMistake`, `App\Models\QuizCompletion`, `App\Models\MaterialQuizAttempt`, and the Inertia/React components (`PostContent`, `usePostContentController`, `PostQuizPanel`, `quiz-data.ts`). Where the code guards behavior on database schema (e.g. `Schema::hasTable` / `hasColumn`), the table existence determines runtime behavior — the tables and models exist in the codebase, but creation is environment-dependent.

### Quiz Loading

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| QL-01 | Open quiz post page | Authenticated user opens `/posts/{post}` where `post_type === 'quiz'` and `quiz_data.questions` exists | Questions and options are displayed, normalized for client use | `PostController::show` serializes the post; `buildQuizData()` normalizes `quiz_data`; `PostQuizPanel` renders questions/options | Pass |
| QL-02 | Open quiz post page | Guest (not authenticated) tries to open `/posts/{post}` | Guest is blocked/redirected to login | Routes are inside `auth` middleware group; guest cannot access the page (route requires auth) | Pass |
| QL-03 | Load previous attempts | Authenticated user with existing `quiz_mistakes` rows for this post | Previous selected answers and result states are loaded into the UI | `getQuizAttemptsForPost()` returns `QuizMistake` rows (if `quiz_mistakes` table exists); client maps `post.quiz_attempts` into `selectedAnswers` and `resultStates` | Pass |

### Quiz Answer Submission

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| QAS-01 | Submit answer as guest | Guest POST to `/posts/{post}/complete-quiz` | Request rejected / redirect to login | Route protected by `auth` middleware; guest cannot reach controller endpoint | Pass |
| QAS-02 | Submit valid multi-question answer | Authenticated POST with JSON `{ question_index, answer_index }` for an existing question | Server validates, returns `incorrect` or `completed`/`already_completed` for correct answers; client updates UI | `PostController::completeQuiz` validates inputs, checks option exists, sets `isCorrect`, responds `incorrect` or `completed`/`already_completed` and client updates `resultStates` | Pass |
| QAS-03 | Submit invalid question index | `question_index` points outside `quiz_data['questions']` | 422 with `Invalid question index.` | Controller checks `$quizData['questions'][$qIndex] ?? null` and returns 422 with message | Pass |
| QAS-04 | Submit invalid answer index | `answer_index` is not present in question options | 422 with `Invalid answer index.` | Controller checks `isset(($question['options'] ?? [])[$selectedIndex])` and returns 422 | Pass |
| QAS-05 | Submit legacy single-question answer | `quiz_data` uses legacy `{ options, answer_index }` format | Same behavior: validation, create completion (firstOrCreate), progress update, and JSON response | Controller has separate branch for legacy format; validates `answer_index` and follows same flow for completion/progress/achievements | Pass |

### Quiz Attempt Recording

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| QAR-01 | Record material quiz attempt | Quiz post has `parent_material_id` and `material_quiz_attempts` table exists | A `material_quiz_attempts` row is created with `score` 1/0 and `total_questions` = 1 | `recordMaterialQuizAttempt()` checks schema/column/parent_material_id then creates `MaterialQuizAttempt` per attempt with `score` 1 or 0 and `total_questions` = 1 | Pass |
| QAR-02 | No material attempt recorded when conditions missing | `parent_material_id` missing or `material_quiz_attempts` table missing | No `MaterialQuizAttempt` row is created | `recordMaterialQuizAttempt()` returns early when schema/column/post parent missing | Pass |

### Mistake Saving

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| MS-01 | Save only incorrect answers as mistakes | User answers question (correct or incorrect); expectation: only incorrect are saved to `quiz_mistakes` | Only incorrect answers saved | Actual: `ProgressService::syncMistakeReview()` calls `updateOrCreate()` for every attempt and stores `is_correct` = true/false; correct answers are also persisted/updated in `quiz_mistakes` | Fail — code saves both correct and incorrect attempts (creates/updates row per question_index regardless of correctness) |
| MS-02 | Mistakes listing format | `getQuizAttemptsForPost()` called | Returns array of `{ question_index, selected_answer_index, is_correct }` ordered by question_index | Controller queries `quiz_mistakes` and maps fields as expected | Pass |

### Quiz Completion State

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| QCS-01 | Complete quiz (last question) | Answer submitted for last question and correct | `quiz_completions` record created (first-time) and response status `completed` | Controller uses `QuizCompletion::firstOrCreate(...)`, sets `$isFirstCompletion = $completion->wasRecentlyCreated`; returns `completed` (if correct & first time) | Pass |
| QCS-02 | Repeat completion | User re-submits correct answers after first completion | No duplicate completion record; response `already_completed` | `firstOrCreate` ensures only one row; `wasRecentlyCreated` false results in `already_completed` response | Pass |
| QCS-03 | Last-question incorrect attempt | Last question answered incorrectly | No completion created; response `incorrect` | Controller records attempt, calls `recordQuizAttempt` and returns `incorrect` | Pass |

### Progress and Achievement Updates

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| PAA-01 | Progress counters update per attempt | Any authenticated attempt (correct or incorrect) | `UserProgress.total_questions_answered` increments; `correct_answers_count` increments only for correct answers | `ProgressService::recordQuizAttempt()` increments `total_questions_answered` always and `correct_answers_count` when `$isCorrect` | Pass |
| PAA-02 | `quizzes_completed` counter behavior | Correct completion on last question and it's first time | `quizzes_completed` increments by 1 only when `isCorrect && isFirstCompletion` | `recordQuizAttempt()` increments `quizzes_completed` only when both conditions met | Pass |
| PAA-03 | Achievements evaluated and returned | `recordQuizAttempt()` may unlock achievements | `recordQuizAttempt()` calls `AchievementService::evaluateAchievements` and returns newly unlocked keys; `PostController` returns `newly_earned` in JSON | Controller stores returned `$newlyEarned` and includes in response under `newly_earned` | Pass |

### Mistake Review (Client)

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| MR-01 | Client shows prior correctness | `post.quiz_attempts` populated from server | UI pre-fills selected radio and shows `correct` / `wrong` state per question | `usePostContentController` useEffect maps `post.quiz_attempts` into `selectedAnswers` and `resultStates`; `PostQuizPanel` shows result messages | Pass |
| MR-02 | Client saves latest attempt | User checks an answer in UI | Client sets result state and POSTs `{ question_index, answer_index }` to `/posts/{post}/complete-quiz` (JSON) | `handleCheckAnswer()` sets local `resultStates` and sends JSON POST to endpoint; server records attempt/mistake/progress/achievements | Pass |

### Validation and Authentication Control

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| VAC-01 | Non-JSON request to complete-quiz | POST to `/posts/{post}/complete-quiz` without `expectsJson()` | Controller aborts with 404 | `completeQuiz()` tests `if (! $request->expectsJson()) { abort(404); }` — request rejected unless JSON header present | Pass |
| VAC-02 | Multi-question payload validation | Missing `question_index` or `answer_index` | Validation error (422) | Controller runs `$request->validate([... 'question_index' => ['required','integer','min:0'], 'answer_index' => ['required','integer','min:0'] ...])` and returns validation errors | Pass |
| VAC-03 | Bounds validation for options | `answer_index` outside available options | 422 with `Invalid answer index.` (multi-question) or validation fails (legacy branch uses max bound) | For multi-question controller enforces option existence with `isset(($question['options'] ?? [])[$selectedIndex])` and returns 422; legacy branch uses `max` in validator and will fail validation if out-of-range | Pass |

Summary observations (code-derived)
- The quiz flow supports both multi-question and legacy single-question formats (`PostController::completeQuiz` and `buildQuizData()`).
- Routes are protected by `auth` middleware (`routes/web.php`), so guests cannot submit or view protected quiz endpoints/pages.
- Mistake tracking: `ProgressService::syncMistakeReview()` uses `updateOrCreate()` and therefore records/updates a `quiz_mistakes` row for every attempt (including correct answers). If the desired behavior is to store only incorrect attempts, the implementation would need to conditionally create/update only when `is_correct === false`. Current code stores correctness as a boolean per question index.
- Material quiz attempt recording is per-question and conditional on `material_quiz_attempts` table and `posts.parent_material_id`. The code writes one `MaterialQuizAttempt` row per submitted question with `score` 1/0 and `total_questions` = 1.
- Completion handling uses `firstOrCreate()` to avoid duplicate `quiz_completions` rows and returns `completed` (first-time correct), `already_completed` (correct but previously completed), or `incorrect`.
- Progress counters and achievement evaluation are executed for each attempt (`recordQuizAttempt` and `AchievementService::evaluateAchievements`) and newly earned achievement keys are returned in the controller response under `newly_earned`.
- The client UI (`usePostContentController` + `PostQuizPanel`) normalizes incoming `quiz_data`, manages selected answers and result states, and sends JSON POSTs to `/posts/{post}/complete-quiz` when the user checks an answer.

If you want, I can:
- Convert these test cases into runnable Pest/PHPUnit tests that target the controller and services (requires DB fixtures), or
- Add these tables into `finalyearproject/UNIT_TESTING_PLAN.md` as a new subsection and commit. Which would you prefer?

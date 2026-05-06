# Activity Diagram Documentation

This document contains activity diagrams and code-accurate explanations for implemented workflows. Each workflow lists the exact related routes, controllers/methods, models, services, validation rules, database actions, external API calls, and all conditional branches as implemented in code. If anything is not determinable from the code, the text states "unclear from code".

---

**Workflow Name**: Attempt Quiz
- Related route: `POST /posts/{post}/complete-quiz` (route name: `posts.completeQuiz`)
- Related controller / method: `App\Http\Controllers\PostController::completeQuiz`
- Related models / services: `Post` model; `QuizCompletion` model; `QuizMistake` model; `MaterialQuizAttempt` model; `App\Services\ProgressService` (`syncMistakeReview`, `recordQuizAttempt`); `App\Services\AchievementService` (`syncUser`)
- Validation rules (exact):
  - For JSON multi-question branch: `question_index` => `required|integer|min:0`, `answer_index` => `required|integer|min:0`
  - For legacy single-question branch: `answer_index` => `required|integer|min:0,max:{optionCount-1}` (validated using `'max:'.max(0, $optionCount - 1)` in code)
- Database actions (exact):
  - `QuizCompletion::query()->firstOrCreate([...], [...])` when last question is answered correctly (multi-question) or when single-question answered correctly (legacy); checks `wasRecentlyCreated` to detect first completion.
  - `MaterialQuizAttempt::query()->create([...])` inside `recordMaterialQuizAttempt()` only when `Schema::hasTable('material_quiz_attempts')`, `Schema::hasColumn('posts', 'parent_material_id')`, and `$quizPost->parent_material_id` are truthy.
  - `QuizMistake` reads/writes are used elsewhere; here `progressService->syncMistakeReview()` is called.

Mermaid activity diagram:
```mermaid
flowchart TD
  A[Request: POST /posts/{post}/complete-quiz]
  A --> B{Request expects JSON?}
  B -- No --> B1[abort(404)]
  B -- Yes --> C{Is post.post_type === 'quiz'?}
  C -- No --> C1[return 422 {status: 'invalid', message: 'This post is not a quiz.'}]
  C -- Yes --> D[Load $quizData = $post->quiz_data]
  D --> E{isset($quizData['questions']) && is_array(...)?}

  %% Multi-question branch
  E -- Yes --> F[Validate: question_index required|integer|min:0; answer_index required|integer|min:0]
  F --> G{Question exists at index ?}
  G -- No --> G1[return 422 {status: 'invalid', message: 'Invalid question index.'}]
  G -- Yes --> H[Determine $correctIndex and $selectedIndex]
  H --> I{selectedIndex exists in question.options?}
  I -- No --> I1[return 422 {status: 'invalid', message: 'Invalid answer index.'}]
  I -- Yes --> J[Compute isCorrect = selectedIndex === correctIndex]
  J --> K{isLastQuestion && isCorrect?}
  K -- Yes --> L[QuizCompletion::firstOrCreate(user_id, post_id, subject_id, completed_at)]
  K -- No --> M[skip QuizCompletion creation]
  L --> N[set isFirstCompletion = $completion->wasRecentlyCreated]
  M --> N[set isFirstCompletion = false]
  N --> O[Call recordMaterialQuizAttempt($user,$post,$isCorrect)]
  O --> P[Call progressService->syncMistakeReview($user,$post,$qIndex,$selectedIndex,$isCorrect)]
  P --> Q[$newlyEarned = progressService->recordQuizAttempt($user,$isCorrect,$isFirstCompletion)]
  Q --> R[achievementService->syncUser($user)]
  R --> S{isCorrect?}
  S -- No --> S1[return JSON {status: 'incorrect', newly_earned: $newlyEarned}]
  S -- Yes --> S2[return JSON {status: isFirstCompletion ? 'completed' : 'already_completed', newly_earned: $newlyEarned}]

  %% Legacy single-question branch
  E -- No --> T[Legacy branch: read answer_index and options]
  T --> U[Compute $optionCount and validate: answer_index required|integer|min:0|max:optionCount-1]
  U --> V{answerIndex present in quiz data?}
  V -- No --> V1[return 422 {status: 'invalid', message: 'Quiz answer data is missing.'}]
  V -- Yes --> W[isCorrect = selectedIndex === answerIndex]
  W --> X{isCorrect?}
  X -- Yes --> Y[QuizCompletion::firstOrCreate(...); isFirstCompletion = wasRecentlyCreated]
  X -- No --> Z[isFirstCompletion = false]
  Y --> O
  Z --> O

  %% end
  S2 --> END[End]
  S1 --> END
  B1 --> END
  C1 --> END
  G1 --> END
  I1 --> END
  V1 --> END
```

Brief code-based explanation:
- The route `POST /posts/{post}/complete-quiz` maps to `PostController::completeQuiz`.
- The handler requires an AJAX/JSON request (`$request->expectsJson()`), otherwise aborts with 404.
- It rejects posts that are not quizzes with a 422 JSON response.
- If the quiz uses `quiz_data.questions` (multi-question), it validates `question_index` and `answer_index`, verifies indices exist, computes correctness, and on final-question correct completion creates a `QuizCompletion` record via `QuizCompletion::firstOrCreate(...)` and uses `wasRecentlyCreated` to determine first completion.
- It records material quiz attempts via `recordMaterialQuizAttempt()` only when the `material_quiz_attempts` table exists and `posts.parent_material_id` exists (see code checks using `Schema`).
- It calls `ProgressService::syncMistakeReview`, `ProgressService::recordQuizAttempt` and `AchievementService::syncUser` and returns precise JSON statuses `incorrect`, `completed`, or `already_completed` with `newly_earned` as returned by `recordQuizAttempt()`.

---

**Workflow Name**: Create Post
- Related route: `POST /posts` (route name: `posts.store`)
- Related controller / method: `App\Http\Controllers\PostCreateController::store`
- Related models / services: `Post` model; `Subject` model; `Language` model; `BookmarkItem` rarely; `App\Services\AchievementService`; `App\Services\MaterialVersionService`; `App\Services\PointsService`; `App\Services\ProgressService`.
- Validation rules (exact):
  - `title` => `required|string|max:150`
  - `content` => `nullable|string|max:2000`
  - `post_type` => `required|string|in:material,question,quiz` (the code uses `Rule::in(self::POST_TYPES)` where `POST_TYPES = ['material','question','quiz']`)
  - `parent_material_id` => `nullable|integer|exists:posts,id` where the exists has `where post_type = material` (exact code: `Rule::exists('posts', 'id')->where(fn ($query) => $query->where('post_type', 'material'))`)
  - `subject_id` => `required|integer|exists:subjects,id`
  - `language_code` => `required|string|exists:languages,code`
  - `is_anonymous` => `nullable|boolean`
  - `quiz_questions` => `nullable|array|min:1|required_if:post_type,quiz` and nested rules for `quiz_questions.*`:
    - `quiz_questions.*.question` => `required|string|max:500`
    - `quiz_questions.*.options` => `required|array|min:2|max:8`
    - `quiz_questions.*.options.*` => `required|string|max:255`
    - `quiz_questions.*.answer_index` => `required|integer|min:0`
    - `quiz_questions.*.explanation` => `nullable|string|max:700`
  - `material_blocks` rules for study material, including file mimes and sizes as specified in code (exact strings used in validation). See code for exact `mimes` and `max` values.
- Database / storage actions (exact):
  - Files: uploaded `attachments` stored using `$file->store('posts', 'public')`
  - Material blocks file uploads stored using `$file->store('posts/materials', 'public')`
  - `DB::transaction` creates `Post::query()->create($attributes)` with attributes: `user_id`, `is_anonymous`, `title`, `content`, `content_blocks`, `post_type`, `quiz_data`, `subject_id`, `language_id`, `image` (attachments array or null), `video_url`, and `parent_material_id` if `Schema::hasColumn('posts','parent_material_id')`.
  - If created post is `material` and `parent_material_id` column exists and `linked_quiz_ids` provided, the code finds matching quizzes and `update(['parent_material_id' => $post->id])` on them, with a restriction that non-admin users only update their own quizzes.
  - If material, `MaterialVersionService::createSnapshot($post)` is called.
  - Points are awarded via `PointsService::award($user, 'resource_uploaded'|'question_asked', $post)`.
  - If not anonymous, `AchievementService::syncUser($user)` and `ProgressService::recordPostCreated($user, $validated['post_type'])` are called.
  - Final response: redirect to `route('homePage')` with flash `success` message "Post created successfully.".

Mermaid activity diagram:
```mermaid
flowchart TD
  A[Request: POST /posts] --> B[Validate input (title, content, post_type, subject_id, language_code, etc.)]
  B --> C{post_type === 'material'?}
  C -- Yes --> D{user->canPublishStudyMaterials()?}
  D -- No --> D1[throw ValidationException with message 'Only admins and teachers can publish Study Materials.']
  D -- Yes --> E[Force parent_material_id = null; is_anonymous = false]
  C -- No --> F{trim(content) === ''?}
  F -- Yes --> F1[throw ValidationException 'Please add content before publishing.']
  F -- No --> G[If quiz: build $quizData from quiz_questions; validate each question options and answer_index; on invalid throw ValidationException 'Each quiz question must have all options filled and a valid correct answer.']
  G --> H[Find Subject::find(subject_id) else throw ValidationException]
  H --> I[Find Language by code else throw ValidationException]
  I --> J[Store attachments via $file->store('posts','public')]
  J --> K{isStudyMaterial?}
  K -- Yes --> L[normalizeMaterialBlocks(); if none -> throw ValidationException 'Add at least one complete content block.']
  L --> M[Set content = buildMaterialPlainText(title, materialBlocks)]
  M --> N[Begin DB::transaction -> Post::create(attributes)]
  N --> O{post.post_type === 'material' && Schema has parent_material_id && linked_quiz_ids not empty?}
  O -- Yes --> P[Post::query()->where(post_type='quiz')->whereIn(id, linked_quiz_ids)->(if not admin) where(user_id, user.id)->update(['parent_material_id' => $post->id])]
  O -- No --> Q[skip quiz linking]
  P --> R[If material: materialVersionService->createSnapshot($post)]
  R --> S[pointsService->award(user, resource_uploaded|question_asked, $post)]
  S --> T{isAnonymous?}
  T -- No --> U[achievementService->syncUser(user); progressService->recordPostCreated(user, post_type)]
  T -- Yes --> V[skip achievements/progress sync]
  U --> W[Redirect -> route('homePage') with success 'Post created successfully.']

  %% error/end nodes
  D1 --> END[End]
  F1 --> END
  (other thrown ValidationException) --> END
```

Brief code-based explanation:
- `PostCreateController::store` performs strict validation as implemented above and throws `ValidationException` for policy or input violations.
- Files are stored via Laravel filesystem `store()` calls with the paths shown in code.
- Post creation is wrapped in `DB::transaction()` and uses `Post::query()->create($attributes)` with exact attribute keys present in code.
- Linking quizzes to a created material is implemented using `Post::query()->where('post_type','quiz')->whereIn('id', $linkedQuizIds)->update(['parent_material_id' => $post->id])` and restricted to the creating user unless the user is `admin`.
- After creation the code awards points, optionally syncs achievements and progress, and redirects with a success flash.

---

**Workflow Name**: Save Post / Bookmark Post
- Related route: `POST /posts/{post}/save` (route name: `posts.save.toggle`)
- Related controller / method: `App\Http\Controllers\PostSaveController::toggle`
- Related models / services: `BookmarkFolder::defaultFor($user)`; `BookmarkItem` model; `Post` model; `App\Services\PointsService` (award/revoke)
- Behavior and branches (exact):
  - The controller obtains the authenticated user and the default bookmark folder via `BookmarkFolder::defaultFor($user)`.
  - It queries `BookmarkItem::query()->where('user_id',$user->id)->where('post_id',$post->id)->first()`.
  - If an existing `BookmarkItem` exists:
    - If `$post->user` exists then `PointsService->revoke($post->user, 'resource_bookmarked', $existingSave)` is called.
    - The existing bookmark item is deleted (`$existingSave->delete()`).
    - `$isSaved` is false.
  - If no existing save exists:
    - `BookmarkItem::query()->create(['user_id' => $user->id, 'bookmark_folder_id' => $defaultFolder->id, 'post_id' => $post->id])` is created.
    - `$isSaved` is true.
    - If `$post->user` exists then `PointsService->award($post->user, 'resource_bookmarked', $bookmarkItem, $user)` is called.
  - Returns JSON: `['saved' => $isSaved, 'saves_count' => $post->bookmarkItems()->count()]`

Mermaid activity diagram:
```mermaid
flowchart TD
  A[Request: POST /posts/{post}/save] --> B[user = $request->user(); defaultFolder = BookmarkFolder::defaultFor($user)]
  B --> C[existingSave = BookmarkItem::where(user_id,user.id)->where(post_id,post.id)->first()]
  C --> D{existingSave?}
  D -- Yes --> E{post->user exists?}
  E -- Yes --> E1[pointsService->revoke(post->user, 'resource_bookmarked', existingSave)]
  E -- No --> E2[skip revoke]
  E1 --> F[existingSave->delete(); isSaved = false]
  E2 --> F
  D -- No --> G[bookmarkItem = BookmarkItem::create(user_id, bookmark_folder_id, post_id); isSaved = true]
  G --> H{post->user exists?}
  H -- Yes --> H1[pointsService->award(post->user, 'resource_bookmarked', bookmarkItem, user)]
  H -- No --> H2[skip award]
  H1 --> I[Return JSON {saved: isSaved, saves_count: $post->bookmarkItems()->count()}]
  H2 --> I
  F --> I
```

Brief code-based explanation:
- The toggle action performs either creation or deletion of a `BookmarkItem` and updates points for the owner of the post using `PointsService` exactly as shown. The JSON response returns the boolean `saved` and the current `saves_count` computed by `$post->bookmarkItems()->count()`.

---

**Workflow Name**: AI Explanation / AI Learning Tool (route: `/ai-explain`)
- Related route: `POST /ai-explain` (declared in `finalyearproject/routes/callAI.php`)
- Related controller / method: route closure in `finalyearproject/routes/callAI.php` (anonymous function)
- Related external calls / services: `Http::withToken(config('services.deepseek.key'))->post('https://api.deepseek.com/v1/chat/completions', ...)` (DeepSeek API)
- Validation rules (exact):
  - `question` => `required|string|max:500`
  - `options` => `required|array|min:2|max:8`
  - `options.*` => `required|string|max:300`
  - `user_answer` => `required|string|max:300`
  - `creator_answer` => `required|string|max:300`
- Request processing and branches (exact):
  - Build `$prompt` with localized language and an `options` block created from `options[]`.
  - Call DeepSeek API via `Http::withToken(...)->timeout(20)->post('https://api.deepseek.com/v1/chat/completions', [...])` with `model` = `deepseek-chat` and `temperature` 0.4.
  - If the HTTP response is not successful (`!$res->successful()`), throw `Exception('DeepSeek error: ' . $res->status())` and return 502 JSON `{error: ..., provider: 'deepseek'}`.
  - Extract `$text = $res->json('choices.0.message.content')`. If not string or empty, throw `Exception('DeepSeek returned empty analysis')`.
  - Decode JSON using local helper `$decodeAnalysis()` which attempts to strip code fences and extract text between braces; if it cannot decode valid JSON it throws `Exception('AI returned invalid JSON analysis')`.
  - Extract fields from decoded array using helper functions: `aiAnswer`, `isUserCorrect`, `matchesCreator`, `explanation`, `discrepancyAnalysis`, `creatorReasoning`, `ambiguityNote`, `confidence` (the code accepts alternate keys like `ai_answer`, `is_user_correct`, etc.).
  - Require `aiAnswer` and `explanation` non-empty else throw exceptions `AI returned missing ai answer` or `AI returned missing explanation`.
  - Derive `isUserCorrect` and `matchesCreator` by normalizing and comparing answers if missing.
  - Normalize `confidence` to one of `high|medium|low`, default `medium`.
  - If `matchesCreator` is false and `discrepancyAnalysis` or `creatorReasoning` or `ambiguityNote` are empty, fill with default explanatory strings as implemented.
  - On success return JSON: `['analysis' => [...], 'provider' => 'deepseek']` with exact keys used by code.
  - On exceptions return 502 JSON `{ 'error' => $e->getMessage(), 'provider' => 'deepseek' }`.

Mermaid activity diagram:
```mermaid
flowchart TD
  A[Request: POST /ai-explain] --> B[Validate question, options, user_answer, creator_answer]
  B --> C[Build prompt and optionLines]
  C --> D[Call DeepSeek via Http::withToken(...)->post('https://api.deepseek.com/v1/chat/completions')]
  D --> E{HTTP response successful?}
  E -- No --> E1[throw Exception('DeepSeek error: ' . $res->status()) -> return 502 JSON {error, provider:'deepseek'}]
  E -- Yes --> F[text = $res->json('choices.0.message.content')]
  F --> G{is_string(text) && text not empty?}
  G -- No --> G1[throw Exception('DeepSeek returned empty analysis') -> return 502 JSON {...}]
  G -- Yes --> H[decoded = decodeAnalysis(text) or throw 'AI returned invalid JSON analysis']
  H --> I[extract aiAnswer, isUserCorrect, matchesCreator, explanation, discrepancyAnalysis, creatorReasoning, ambiguityNote, confidence]
  I --> J{aiAnswer and explanation non-empty?}
  J -- No --> J1[throw Exception('AI returned missing ai answer' or 'AI returned missing explanation') -> return 502 JSON {...}]
  J -- Yes --> K[Derive isUserCorrect/matchesCreator if null; normalize confidence]
  K --> L[Fill default discrepancy/creatorReasoning/ambiguityNote if matchesCreator=false and fields empty]
  L --> M[return JSON {analysis: {...}, provider: 'deepseek'}]

  %% error end nodes
  E1 --> END
  G1 --> END
  J1 --> END
```

Brief code-based explanation:
- The logic is implemented as an anonymous route handler in `routes/callAI.php` and performs strict input validation, constructs a prompt, posts to DeepSeek's chat completions endpoint, validates the HTTP response, parses the model output (robustly attempting to extract JSON), performs field-level checks, derives missing boolean fields by comparing normalized strings, applies defaults for `confidence` and discrepancy messages, and returns a JSON `analysis` structure or a 502 error containing the exception message and `provider: 'deepseek'`.

---

**Workflow Name**: Submit Teacher Application
- Related route: `POST /teacher-applications` (route name: `teacher-applications.store`)
- Related controller / method: route closure in `finalyearproject/routes/web.php` (anonymous function)
- Related models / services: `TeacherApplication` model
- Validation rules (exact): `qualification` => `required|string|max:255`, `bio` => `nullable|string|max:2000`
- Database actions (exact): `
  TeacherApplication::create(['user_id' => $request->user()->id, 'qualification' => $request->qualification, 'bio' => $request->bio])`
- Final response: `return back()->with('success', 'Application submitted.')`

Mermaid activity diagram:
```mermaid
flowchart TD
  A[Request: POST /teacher-applications] --> B[Validate qualification required|string|max:255; bio nullable|string|max:2000]
  B --> C[TeacherApplication::create(user_id, qualification, bio)]
  C --> D[return back()->with('success', 'Application submitted.')]
```

Brief code-based explanation:
- Any authenticated & verified user (route is in middleware `auth`, `verified`) can submit an application. The route uses the `TeacherApplication` model's `create()` with `user_id`, `qualification`, and `bio`, then redirects back with a success flash message.

---

**Workflow Name**: Admin Review Teacher Application
- Related routes (admin prefix):
  - `GET /admin/teacher-applications` -> `App\Http\Controllers\AdminController::teacherApplications` (route name: `admin.teacher-applications`)
  - `PATCH /admin/teacher-applications/{application}/approve` -> `App\Http\Controllers\AdminController::approveApplication` (route name: `admin.teacher-applications.approve`)
  - `PATCH /admin/teacher-applications/{application}/reject` -> `App\Http\Controllers\AdminController::rejectApplication` (route name: `admin.teacher-applications.reject`)
  - `PATCH /admin/teacher-applications/{application}/toggle-verification` -> `App\Http\Controllers\AdminController::toggleVerification` (route name: `admin.teacher-applications.toggle-verification`)
  - `GET /admin/verification-documents/{document}/download` -> `App\Http\Controllers\AdminController::downloadVerificationDocument` (route name: `admin.verification-document.download`)
- Related models / services: `TeacherApplication` model; `TeacherVerificationDocument` model; `User` model; `Storage` facade
- Exact behaviors and branches (from code):
  - `teacherApplications()` loads `TeacherApplication::with(['user', 'documents'])->orderBy('created_at','desc')->get()` and maps fields for Inertia rendering. It maps each `TeacherVerificationDocument` to a `download_url` created with `route('admin.verification-document.download', $doc->id)`.
  - `approveApplication(TeacherApplication $application)` does `$application->update(['status' => 'approved']); $application->user?->update(['role' => 'teacher']); return back();`
  - `rejectApplication(Request $request, TeacherApplication $application)` does `$application->update(['status' => 'rejected', 'admin_note' => $request->input('note')]); return back();`
  - `toggleVerification(TeacherApplication $application)`:
    - `$user = $application->user;`
    - If no `$user` or `$user->role !== 'teacher'` then `return back()->with('error', 'User must be an approved teacher to toggle verification.')`.
    - Otherwise `$user->update(['is_verified' => ! $user->is_verified]); return back();`
  - `downloadVerificationDocument(TeacherVerificationDocument $document)`:
    - If `Storage::disk('local')->exists($document->path)` is false then `abort(404)`.
    - Determine `$mimeType` and `$fullPath` and `return response()->file($fullPath, ['Content-Type' => $mimeType, 'Content-Disposition' => 'inline; filename="' . $document->original_name . '"'])`.

Mermaid activity diagram:
```mermaid
flowchart TD
  A[Admin: GET /admin/teacher-applications] --> B[AdminController::teacherApplications loads TeacherApplication::with(user,documents) and renders Inertia]

  subgraph ReviewActions
    R1[PATCH approve -> AdminController::approveApplication]
    R2[PATCH reject -> AdminController::rejectApplication]
    R3[PATCH toggle-verification -> AdminController::toggleVerification]
    R4[GET download document -> AdminController::downloadVerificationDocument]
  end

  R1 --> RA1[application->update(['status' => 'approved']); application->user?->update(['role'=>'teacher']); return back()]
  R2 --> RA2[application->update(['status'=>'rejected','admin_note' => $request->input('note')]); return back()]
  R3 --> RB1{application->user exists && user->role === 'teacher' ?}
  RB1 -- No --> RB2[return back()->with('error','User must be an approved teacher to toggle verification.')]
  RB1 -- Yes --> RB3[user->update(['is_verified' => ! user->is_verified]); return back()]
  R4 --> RC1{Storage::disk('local')->exists(document->path)?}
  RC1 -- No --> RC2[abort(404)]
  RC1 -- Yes --> RC3[return response()->file(fullPath, Content-Type mime, inline disposition with original_name)]

```

Brief code-based explanation:
- Admin routes are protected by `auth` and `admin` middleware in `routes/web.php` and call `AdminController` methods that perform the database updates shown above and return `back()`.
- The download action checks local storage for the file before returning it with inline disposition and the original filename.

---

Notes / Unknowns:
- Where code refers to some database tables/columns (for example presence of `material_quiz_attempts` table or `posts.parent_material_id`) the controller checks `Schema::hasTable()` and `Schema::hasColumn()` as shown; diagrams include those conditional checks. If any additional business rules or UI flows exist outside these controllers/routes, they are unclear from code and therefore not represented.

If you want, I can (a) add links to the exact code locations for each route/method, or (b) generate separate per-method reference snippets. Which would you prefer?

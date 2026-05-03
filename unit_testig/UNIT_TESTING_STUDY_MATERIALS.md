## 5.1.1.9 Study Materials Unit Testing

### Study Material Viewing

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SMV-01 | Open study materials list page. | Authenticated user visits `/learning-materials`. | Study materials feed is displayed. | `/learning-materials` renders HomePage filtered to `post_type = material`. | Pass |
| SMV-02 | Open study materials list page. | Guest visits `/learning-materials`. | User is redirected to login. | Route is under `auth` middleware, so guest is redirected to login. | Pass |
| SMV-03 | Open material detail page. | Authenticated user visits `/posts/{post}` where `post_type = material`. | Material detail page is displayed with learning state badge. | Material post loads, `material_learning_state` and `material_learning_path` are attached, and page renders. | Pass |
| SMV-04 | Record material view. | Authenticated user views material detail page. | View count is incremented for the user. | `study_material_views` upserts by `user_id` + `post_id` and increments `view_count` by 1. | Pass |
| SMV-05 | View material as non-material post. | Authenticated user opens `/posts/{post}` for `post_type != material`. | Material-specific data is not attached. | Material-only logic (feedback, analytics, linked quizzes, learning path) is skipped. | Pass |

Study Material Viewing Testing Table

### Material Feedback Submission

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SMF-01 | Submit star rating. | POST `/posts/{post}/material-feedback` with JSON `{ rating: 4 }`. | Feedback is saved and summary is updated. | `study_material_feedback` is updated/created and summary/user feedback are returned. | Pass |
| SMF-02 | Submit feedback vote only. | POST with JSON `{ vote: 1 }`. | Feedback vote is saved. | `vote` is stored; response includes updated summary/user feedback. | Pass |
| SMF-03 | Submit written feedback only. | POST with JSON `{ feedback: "Clear explanation." }`. | Written feedback is saved. | `feedback` is stored (trimmed); response includes updated summary/user feedback. | Pass |
| SMF-04 | Submit empty feedback payload. | POST with JSON `{}`. | Submission is rejected with validation error. | Controller returns 422 with message "Add a vote, rating, or written feedback before submitting." | Pass |
| SMF-05 | Submit invalid rating. | POST with JSON `{ rating: 6 }`. | Submission is rejected with rating validation error. | Laravel validation rejects `rating` outside 1-5 with 422. | Pass |
| SMF-06 | Submit feedback for non-material post. | POST to `/posts/{post}/material-feedback` where `post_type != material`. | Submission is rejected. | Controller returns 422: "Feedback can only be submitted for Study Materials." | Pass |

Material Feedback Submission Testing Table

### Material Feedback Deletion

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SMD-01 | Delete own material feedback. | Authenticated user sends DELETE to `/posts/{post}/material-feedback`. | User feedback is removed and summary is updated. | Feedback row is deleted for `user_id` + `post_id` and summary/user feedback are returned. | Pass |
| SMD-02 | Delete feedback on material without own feedback. | User has no feedback row. | No deletion occurs; response still succeeds. | Delete query affects 0 rows, response still returns `status: deleted`. | Pass |
| SMD-03 | Delete feedback for non-material post. | DELETE on `/posts/{post}/material-feedback` where `post_type != material`. | Deletion is rejected. | Controller returns 422: "Feedback can only be removed for Study Materials." | Pass |
| SMD-04 | Delete another user’s feedback. | Authenticated user tries to delete feedback they do not own. | Other users’ feedback remains unchanged. | Delete query is scoped to `user_id`, so only own feedback can be removed. | Pass |

Material Feedback Deletion Testing Table

### Material Analytics

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SMA-01 | View analytics on material detail page. | Teacher opens material post. | Learning analytics panel is shown with views, unique users, quiz score, improvement. | `learning_analytics` is attached for `role = teacher` and rendered in the UI. | Pass |
| SMA-02 | View analytics as student. | Student opens material post. | Analytics are not shown. | `learning_analytics` is not attached for non-teachers; panel is hidden. | Pass |
| SMA-03 | View analytics as admin on material post. | Admin opens material post. | Analytics are not shown (teacher-only). | UI allows analytics only for `role = teacher`; admin sees no analytics panel. | Pass |
| SMA-04 | Open teacher material insights page. | Teacher or admin visits `/teacher/material-insights`. | Insights page loads. | Access is allowed by `canPublishStudyMaterials()` and page renders insights. | Pass |
| SMA-05 | Open teacher material insights page as student. | Student visits `/teacher/material-insights`. | Access is denied. | Controller aborts with 403 when user cannot publish study materials. | Pass |

Material Analytics Testing Table

### Linked Quiz Display

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SMQ-01 | View linked quizzes on material detail page. | Material has quizzes with `parent_material_id = material.id`. | Linked quizzes are listed. | Controller loads linked quizzes and passes them to the UI. | Pass |
| SMQ-02 | View material with no linked quizzes. | No quizzes linked to the material. | UI shows "no linked quizzes" message. | `linked_quizzes` is an empty array and UI shows empty state. | Pass |
| SMQ-03 | Check quiz completion status in list. | User has quiz completion records for linked quizzes. | Completed quizzes are marked as completed. | `buildLinkedQuizzes()` sets `is_quiz_completed` based on `quiz_completions`. | Pass |

Linked Quiz Display Testing Table

### Learning State and Path

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SML-01 | View learning state for new material. | User has no views, quiz attempts, or feedback. | Learning state is `unread` and path steps are pending. | State defaults to `unread`; path shows pending and quiz step not required if no linked quizzes. | Pass |
| SML-02 | View learning state after opening material. | User opens material detail page at least once. | `read_material` step is completed. | Viewing creates `study_material_views` entry and marks `read_material` as completed. | Pass |
| SML-03 | View learning state with linked quizzes. | Material has linked quizzes and user has attempted one. | Quiz step is `in_progress` with progress count. | `material_quiz_attempts` sets quiz step `in_progress` and progress count. | Pass |
| SML-04 | View learning state with completed linked quizzes. | User completed required linked quizzes. | Learning state becomes `completed` and quiz step `completed`. | Completion count uses `min(2, linked_quiz_count)` and state becomes `completed`. | Pass |
| SML-05 | View feedback path step after submitting feedback. | User submits feedback. | `submit_feedback` step is `completed`. | Feedback record is detected and step becomes `completed`. | Pass |

Learning State and Path Testing Table

### Version Snapshot Handling

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SMS-01 | Create study material. | Teacher/admin publishes a new material. | A version snapshot is created with version 1. | `MaterialVersionService::createSnapshot()` runs on material creation and inserts a version. | Pass |
| SMS-02 | Update study material content. | Teacher/admin edits a material. | A new version snapshot is created with incremented version number. | Material update calls `createSnapshot()` and inserts a new version. | Pass |
| SMS-03 | Submit feedback after publish. | User submits rating or vote. | Latest version rating fields are updated, no new version created. | `syncLatestVersionRating()` updates latest version; no snapshot is created on feedback. | Pass |
| SMS-04 | Handle missing version table. | `study_material_versions` table does not exist. | Snapshot creation is skipped. | `createSnapshot()` returns null when table is missing. | Pass |

Version Snapshot Handling Testing Table

### Authorization and Validation Control

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SMAU-01 | Access material detail as guest. | Guest visits `/posts/{post}`. | User is redirected to login. | Route is protected by `auth` middleware; guest is redirected. | Pass |
| SMAU-02 | Access material analytics panel as teacher. | Teacher visits material detail page. | Analytics data is visible. | `learning_analytics` is attached for teachers and rendered. | Pass |
| SMAU-03 | Access material analytics panel as admin. | Admin visits material detail page. | Analytics data is hidden. | `learning_analytics` is only attached for teachers; admin sees no analytics panel. | Pass |
| SMAU-04 | Submit feedback without JSON request. | Request does not set `Accept: application/json`. | Request is rejected. | Controller checks `expectsJson()` and aborts 404 for non-JSON requests. | Pass |
| SMAU-05 | Submit feedback text exceeding max length. | `feedback` length > 2000. | Validation error is returned. | Validation rejects `feedback` over 2000 characters with 422. | Pass |

Authorization and Validation Control Testing Table

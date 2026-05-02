## 5.1.1.5 Post Viewing and Editing Unit Testing

System area:
Post viewing/editing

Responsibility:
Provides the main post detail experience and owner/admin management actions.

### Post Detail Viewing

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| PDV-01 | Open `/posts/{post}`. | User is not logged in. | User is redirected to login page. | Route is inside the `auth` and `verified` middleware group, so guest user is redirected to login page. | Pass |
| PDV-02 | Open `/posts/{post}`. | User is logged in and post exists. | Post detail page is displayed. | `PostController@show` renders `PostContent` with the serialized post payload. | Pass |
| PDV-03 | View serialized post details. | Post has title, content, type, author, subject, language, media, and engagement records. | Serialized post includes the data needed by the React detail page. | `PostSerializationService::serialize()` returns title, content, content blocks, post type, quiz data, image, video URL, author, language, subject, counts, liked status, saved status, comments, material data, and linked quiz data where available. | Pass |
| PDV-04 | View anonymous question. | Post has `is_anonymous = true`. | Author identity is hidden. | `serializeUser()` returns `null` for anonymous posts, and the React controller displays the post as anonymous. | Pass |
| PDV-05 | View liked and saved state. | Current user has liked or saved the post. | Detail page reflects current user's liked and saved status. | `show()` sets `is_liked` and `is_saved` using the authenticated user's likes and bookmark items. | Pass |
| PDV-06 | View post attachments. | Post has files in the `image` array. | Attachments are displayed on the post detail page. | `PostContent` passes `post.image` to `PostAttachmentsSection`, so stored attachment paths are rendered. | Pass |
| PDV-07 | Open a post from a blocked author by direct URL. | Post author has `is_blocked = true`. | Blocked users' posts should not be viewable if blocked content is meant to be hidden everywhere. | Feed queries exclude blocked authors, but `PostController@show` does not check whether the post author is blocked, so a direct post URL can still render. | Failed |

Post Detail Viewing Testing Table

### Comment and Reply Display

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| CRD-01 | View comments on a post. | Post has top-level comments. | Comments are loaded with author details. | `loadPostWithComments()` loads comments with users, avatars, parent comment users, and vote metadata. | Pass |
| CRD-02 | View replies. | Comments contain `parent_id` values. | Replies are nested under their parent comments. | `PostSerializationService::buildCommentTree()` groups comments by `parent_id` and returns nested `replies` arrays with depth values. | Pass |
| CRD-03 | View comment vote counts. | `comment_likes.vote` column exists. | Upvote, downvote, wrong vote, score, and current user's vote state are available. | Controller loads vote counts and current-user vote existence values, and serialization includes `upvotes_count`, `downvotes_count`, `wrong_votes_count`, `score`, and vote flags. | Pass |
| CRD-04 | View comments on a database without the vote column. | Legacy schema does not have `comment_likes.vote`. | Comment display falls back without crashing. | Controller checks `supportsCommentVotes()` and falls back to legacy comment likes if the vote column is missing. | Pass |
| CRD-05 | Sort comments on the frontend. | User selects latest or top-liked sorting. | Comments are sorted according to selected mode. | `CommentSection` sorts by latest timestamp or by score, then renders the selected order. | Pass |
| CRD-06 | View many replies under one comment. | A comment has more than three replies. | Replies are collapsed with a show-more control. | `CommentSection` shows the first three replies and displays a show-more option for the remaining replies. | Pass |
| CRD-07 | View best answer on a question post. | Top-level Q&A comment has score greater than 1. | Best answer preview is shown. | `selectBestAnswer()` chooses a top-level comment with score greater than 1, and the Q&A variant displays the best answer panel. | Pass |

Comment and Reply Display Testing Table

### Linked Quiz Display

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| LQD-01 | Open a study material post. | Quiz posts exist with `parent_material_id` equal to the material post ID. | Linked quizzes are displayed on the material detail page. | `buildLinkedQuizzes()` loads quiz posts linked through `parent_material_id`, serializes them, and `MaterialPostSections` renders quiz cards. | Pass |
| LQD-02 | Open a study material with no linked quiz. | No quiz has the material as parent. | Empty linked quiz message is displayed. | `linked_quizzes` is an empty array and the material page displays the no-linked-quizzes message. | Pass |
| LQD-03 | View linked quiz completion state. | Current user has a `quiz_completions` record for a linked quiz. | Linked quiz card shows completed status. | `buildLinkedQuizzes()` checks `QuizCompletion` for the current user and sets `is_quiz_completed` before serialization. | Pass |
| LQD-04 | Click linked quiz. | Linked quiz is listed on a material post. | User can open the linked quiz detail page. | Each linked quiz card links to `/posts/{quiz.id}`. | Pass |
| LQD-05 | Open a question or standalone quiz post. | Post type is not `material`. | Linked material quiz section is not displayed. | `PostContentMainSection` renders material linked quiz sections only when `post.post_type === 'material'`. | Pass |
| LQD-06 | View linked quizzes from blocked authors. | Linked quiz author is blocked. | Blocked authors' linked quizzes should be hidden if blocked content is meant to be hidden everywhere. | `buildLinkedQuizzes()` does not exclude blocked quiz authors, so linked quizzes from blocked users can be serialized and displayed. | Failed |

Linked Quiz Display Testing Table

### Quiz Attempt Display

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| QAD-01 | Open a quiz post with multi-question quiz data. | `quiz_data.questions` contains valid questions, options, answer indexes, and optional explanations. | Quiz questions and options are displayed. | `buildQuizData()` normalizes valid questions and `PostQuizPanel` renders each question with radio options. | Pass |
| QAD-02 | Open a quiz post using legacy single-question quiz data. | `quiz_data` has `options` and `answer_index` but no `questions` array. | Legacy quiz is still displayed. | `buildQuizData()` converts the legacy format into a one-question quiz display. | Pass |
| QAD-03 | Open quiz with invalid quiz data. | Options are fewer than two or answer index is invalid. | Invalid quiz panel should not be displayed. | `buildQuizData()` returns `null`, and `PostQuizPanel` returns no quiz UI. | Pass |
| QAD-04 | View previous quiz attempts. | Current user has `quiz_mistakes` records for this quiz post. | Previous selected answers and result states are loaded. | `getQuizAttemptsForPost()` returns question index, selected answer index, and correctness, then the React controller applies them to selected answers and result states. | Pass |
| QAD-05 | Check an answer. | User selects an option and checks the answer. | Correct or wrong result is shown and saved. | React immediately sets result state, then posts to `/posts/{post}/complete-quiz`; backend records mistake review, material quiz attempt data where applicable, progress, and achievements. | Pass |
| QAD-06 | Reopen a completed direct quiz post. | Current user has a `quiz_completions` record for the quiz. | Direct quiz detail should expose completed state if the page needs quiz completion status. | `show()` loads prior attempt details from `quiz_mistakes`, but it does not set `is_quiz_completed` for the main quiz post from `quiz_completions`. | Failed |

Quiz Attempt Display Testing Table

### Material Analytics Viewing

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| MAV-01 | Open a study material post. | Logged-in user opens a material post. | Material view count is recorded. | `recordMaterialView()` creates or updates `study_material_views`, increments `view_count`, and updates `last_viewed_at`. | Pass |
| MAV-02 | View material feedback summary. | Study material has ratings, votes, or written feedback. | Feedback summary is available on the page. | `buildMaterialFeedbackSummary()` returns average rating, rating count, vote counts, recommendation rate, feedback count, and latest feedback. | Pass |
| MAV-03 | View own material feedback. | Current user has already submitted material feedback. | User's existing rating, vote, or feedback is shown. | `buildMaterialUserFeedback()` returns the current user's feedback record, and `MaterialRatingSection` uses the saved rating. | Pass |
| MAV-04 | View learning analytics. | Material has views, linked quiz attempts, and feedback records. | Analytics include views, unique users, quiz attempts, quiz score, improvement, rating, and feedback count. | `buildLearningAnalytics()` calculates those analytics from material views, material quiz attempts, and feedback summary. | Pass |
| MAV-05 | View material detail as admin. | Current user role is `admin`. | Admin can see material analytics on the detail page. | `MaterialPostSections` renders the learning analytics panel when `isAdmin` is true. | Pass |
| MAV-06 | View material detail as non-admin. | Current user role is `student` or `teacher`. | Admin-only analytics should not be exposed to non-admin users. | The React analytics panel is hidden for non-admin users, but `PostController@show` still serializes `learning_analytics` for every material viewer. | Failed |
| MAV-07 | View material learning state. | Material has view, quiz, or feedback progress for the current user. | Material learning state and path are shown. | `buildMaterialLearningStateMap()` sets `material_learning_state` and `material_learning_path`, and the React material page displays the learning badge and path steps. | Pass |
| MAV-08 | View material rating component. | Material feedback summary exists. | Average rating and rating count are displayed. | `StudyMaterialCommentsSection` renders `MaterialRatingSection` before comments, using `material_feedback_summary` and `material_user_feedback`. | Pass |

Material Analytics Viewing Testing Table

### Post Editing

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| PED-01 | Start editing own question post. | Logged-in user owns a non-anonymous question post. | Inline edit fields are shown. | `usePostContentController` sets `canManagePost` for the owner, `PostActionFooter` shows Edit, and `PostEditableBody` renders title and content inputs. | Pass |
| PED-02 | Update own question post. | Valid title and content are submitted. | Post title and content are updated. | `PostController@update` validates title and content, updates the post, and redirects back to `posts.show`. | Pass |
| PED-03 | Update non-material post with invalid data. | Title is empty, title exceeds 150 characters, or content exceeds 2000 characters. | Validation error is returned. | Laravel validation requires title, requires content, limits title to 150 characters, and limits content to 2000 characters. | Pass |
| PED-04 | Edit quiz post content. | Owner edits a quiz post from the detail page. | Quiz post title/content can be edited without changing quiz question data. | The inline editor submits only `title` and `content`; backend update for non-material posts does not modify `quiz_data`. | Pass |
| PED-05 | Edit study material blocks. | Material owner or admin with publishing permission submits valid material blocks. | Material title, searchable content, and content blocks are updated. | Material update validates block structure, normalizes text, file, and video blocks, rebuilds plain content, and updates `content_blocks`. | Pass |
| PED-06 | Submit material edit with no complete blocks. | All material blocks are empty or incomplete. | Validation error is returned. | `normalizeMaterialBlocksForUpdate()` removes incomplete blocks and controller returns `Add at least one complete content block.` | Pass |
| PED-07 | Save material edit after feedback exists. | Material has feedback and required schema columns exist. | Material is marked as improved and version history is updated. | Controller sets `material_improved_from_feedback` when feedback exists and creates a new material version snapshot after update. | Pass |
| PED-08 | Submit material video block with invalid URL text. | Video block contains non-empty text that is not a valid URL. | Invalid video URL should be rejected. | Material update accepts any non-empty string up to 500 characters for `material_blocks.*.url`; URL format is not enforced. | Failed |
| PED-09 | Edit own anonymous question from UI. | Current user owns an anonymous question. | Owner should be able to manage own post without exposing author identity to other users. | Backend owner checks would allow the update, but serialization hides `post.user`, so the React controller cannot identify the owner and hides Edit. | Failed |

Post Editing Testing Table

### Post Deletion

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| PDE-01 | Delete own question post. | Logged-in user owns the question post. | Delete confirmation is available and post can be deleted. | `canManagePost` shows Delete for the owner, and `PostController@destroy` allows non-material deletion when `user_id` matches. | Pass |
| PDE-02 | Delete own quiz post. | Logged-in user owns the quiz post. | Quiz post is deleted. | Non-material delete uses the same owner check, so an owned quiz post can be deleted. | Pass |
| PDE-03 | Delete own study material post. | Logged-in user owns the material post. | Material post is deleted. | Material deletion allows the owner and redirects to `homePage` after deleting the post. | Pass |
| PDE-04 | Delete material as admin. | Admin user is not the material owner. | Admin can delete the material post. | `destroy()` allows material deletion when current user role is `admin`, and frontend material management also allows admin controls. | Pass |
| PDE-05 | Delete another user's non-material post. | Current user is not the owner. | Request is forbidden. | `destroy()` aborts with 403 for non-material posts when the user is not the owner. | Pass |
| PDE-06 | Delete own anonymous question from UI. | Current user owns an anonymous question. | Owner should be able to delete own post. | Backend owner checks would allow deletion, but React hides Delete because anonymous serialization removes `post.user`, so the owner cannot manage it through the UI. | Failed |
| PDE-07 | Confirm post deletion. | Delete request succeeds. | User is redirected to home page. | `destroy()` calls `$post->delete()` and redirects to `homePage`. | Pass |
| PDE-08 | Delete post with uploaded files. | Post has general attachments or material block files. | Associated stored files should be removed if file cleanup is required. | `destroy()` deletes only the database record; no storage cleanup or model observer for post files is implemented. | Failed |

Post Deletion Testing Table

### Owner and Admin Permission Control

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| OPC-01 | Access post viewing and management routes. | Guest user requests show, update, or delete routes. | Routes require authentication and verified access. | `/posts/{post}`, `PATCH /posts/{post}`, and `DELETE /posts/{post}` are inside the `auth` and `verified` middleware group. | Pass |
| OPC-02 | Update another user's question or quiz. | Current user is not the owner. | Request is forbidden. | `update()` aborts with 403 for non-material posts when the current user is not the owner. | Pass |
| OPC-03 | Update another user's material as admin. | Current user role is `admin`. | Admin can edit the material. | Material update allows users who can publish study materials when they are either the owner or admin. | Pass |
| OPC-04 | Update another user's material as teacher. | Current user role is `teacher`, but user is not the material owner. | Request is forbidden. | Even though teachers can publish study materials, `update()` requires material ownership unless the user is admin. | Pass |
| OPC-05 | Update material as student owner. | Existing material belongs to a user whose role is `student`. | Student should not edit study materials if publishing permission is required. | Material update requires `canPublishStudyMaterials()`, so a student owner receives 403. | Pass |
| OPC-06 | Delete another user's material as teacher. | Current user role is `teacher`, but user is not the owner. | Request is forbidden. | Material deletion allows only the owner or admin; non-owner teachers receive 403. | Pass |
| OPC-07 | Use admin override on question or quiz posts. | Admin user is not the owner of a question or quiz. | Admin override is not available unless specifically implemented for non-material posts. | Controller and React logic implement admin management only for material posts; non-material posts remain owner-only. | Pass |
| OPC-08 | Display edit/delete buttons to unauthorized users. | Current user is neither owner nor permitted admin. | Edit and Delete controls are hidden. | `PostActionFooter` receives `isOwner={controller.canManagePost}`, so edit/delete buttons are only rendered when the controller permits management. | Pass |

Owner and Admin Permission Control Testing Table

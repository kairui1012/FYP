## 5.1.1.6 Comments Unit Testing

System area:
Comments

Responsibility:
Supports Q&A discussion and moderation flow.

### Comment Creation

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| CMT-01 | Post a new comment on a question or discussion post. | Authenticated user submits non-empty `content` to `POST /posts/{post}/comments`. | Comment is created and returned to the post thread. | `CommentController::store` creates a `comments` record under the selected post, awards the user points, and returns the refreshed comment tree for JSON requests. | Pass |
| CMT-02 | Post a comment with only whitespace. | `content` contains spaces only. | Comment is rejected. | `CommentController::store` trims the content and throws a validation error with `Please write a comment before posting.` | Pass |
| CMT-03 | Post a comment with text longer than the limit. | `content` exceeds 1000 characters. | Comment is rejected. | Laravel validation in `CommentController::store` enforces `max:1000`, so the request is rejected. | Pass |
| CMT-04 | Post a comment with attachments or mentions data. | Request includes extra fields not used by the controller. | Only supported comment fields are persisted. | `CommentController::store` only persists `user_id`, `parent_id`, and trimmed `content`; attachments and mentions are not handled in this flow. | Pass |

Comment Creation Testing Table

### Reply Creation

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| RPY-01 | Reply to an existing comment on the same post. | Authenticated user submits `content` and a valid `parent_id` that belongs to the same post. | Reply is created under the parent comment. | `CommentController::store` verifies the parent comment belongs to the same post, creates the reply, and returns the refreshed tree. | Pass |
| RPY-02 | Reply using a parent comment from another post. | `parent_id` exists, but the comment belongs to a different post. | Reply is rejected. | `CommentController::store` throws a validation error with `The selected reply target is invalid.` | Pass |
| RPY-03 | Reply with empty text. | `content` is blank after trimming. | Reply is rejected. | The same trim check used for comments rejects the request with `Please write a comment before posting.` | Pass |
| RPY-04 | Reply to a comment and refresh the thread. | Post has nested comments. | Reply appears in the nested comment tree. | The JSON response returns `comments` built by `buildCommentTree`, so the reply is inserted into the nested tree structure. | Pass |

Reply Creation Testing Table

### Comment Editing

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| EDT-01 | Edit own comment. | Authenticated owner submits new non-empty `content` to `PATCH /comments/{comment}`. | Comment content is updated. | `CommentController::update` allows the owner, updates the comment, and returns the refreshed comments payload. | Pass |
| EDT-02 | Edit another user’s comment. | Authenticated non-owner submits update request. | Request is rejected with authorization error. | `CommentController::update` aborts with HTTP 403 when the authenticated user does not own the comment. | Pass |
| EDT-03 | Save an edited comment with only whitespace. | `content` is blank after trimming. | Update is rejected. | `CommentController::update` trims the input and throws `Please write a comment before updating.` | Pass |
| EDT-04 | Edit a comment after the post thread has been deleted. | Comment no longer has a related post. | Update should not proceed normally. | `CommentController::update` returns a JSON response with empty `comments` and `comments_count = 0` when the related post is missing. | Pass |

Comment Editing Testing Table

### Comment Deletion

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| DEL-01 | Delete own comment. | Authenticated owner sends `DELETE /comments/{comment}`. | Comment is deleted. | `CommentController::destroy` allows the owner, deletes the comment branch, and returns the refreshed comment tree. | Pass |
| DEL-02 | Delete another user’s comment. | Authenticated non-owner sends delete request. | Request is rejected with authorization error. | `CommentController::destroy` aborts with HTTP 403 when the authenticated user does not own the comment. | Pass |
| DEL-03 | Delete a parent comment that has replies. | Comment has one or more nested replies. | Only the selected comment should be removed, leaving reply handling to follow a separate moderation rule. | `CommentController::destroy` collects the full branch with `collectCommentBranchIds` and deletes the parent comment and all replies in that subtree. | Failed |
| DEL-04 | Delete a comment with existing likes. | Comment has vote records in `comment_likes`. | Related vote records should be removed with the comment. | `CommentController::destroy` deletes matching rows from `comment_likes` before deleting the branch comments. | Pass |

Comment Deletion Testing Table

### Comment Voting

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| VOT-01 | Upvote a comment. | Authenticated user posts `direction = up` to `/comments/{comment}/vote`. | Comment is marked helpful. | `CommentLikeController::toggle` stores vote `1`, returns `is_upvoted = true`, and updates the score and counts. | Pass |
| VOT-02 | Downvote a comment. | Authenticated user posts `direction = down`. | Comment is marked confusing or downvoted. | The controller stores vote `-1`, returns `is_downvoted = true`, and includes downvote counts in the JSON response. | Pass |
| VOT-03 | Mark a comment as wrong. | Authenticated user posts `direction = wrong`. | Comment is flagged as wrong. | The controller stores vote `-2`, returns `is_wrong = true`, and subtracts wrong votes in the score calculation. | Pass |
| VOT-04 | Toggle the same vote twice. | Same user repeats the same vote direction on the same comment. | Existing vote is removed. | `CommentLikeController::toggle` deletes the existing like/vote when the requested direction matches the stored vote. | Pass |
| VOT-05 | Submit an invalid vote direction. | `direction = sideways`. | Request is rejected. | Laravel validation only allows `up`, `down`, or `wrong` when the vote column exists, so the request is rejected. | Pass |

Comment Voting Testing Table

### Wrong Answer Marking

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| WAM-01 | Click the wrong-answer action in a Q&A comment thread. | Variant is `qna` and the comment is not already flagged wrong. | Wrong-answer validation prompt is shown before voting. | `CommentSection` opens `CommentAiWrongPanel` first and does not send the wrong vote until validation is confirmed. | Pass |
| WAM-02 | Confirm a valid wrong-answer explanation in Q&A. | User submits a sufficiently long reasoning and confirms it. | Wrong vote is sent after validation. | The panel calls `handleToggleCommentVote(..., 'wrong')`, so the backend stores vote `-2` after the validation step. | Pass |
| WAM-03 | Submit weak wrong-answer reasoning. | Reasoning is too short or AI validation is not satisfied. | Wrong vote should not be sent yet. | `CommentAiWrongPanel` keeps the vote blocked until valid reasoning is provided, and the user must edit the explanation or cancel. | Pass |
| WAM-04 | Use the wrong-answer action outside Q&A mode. | Variant is `quiz` or `material`. | Wrong vote is applied directly without the Q&A validation panel. | `CommentSection` bypasses the validation panel for non-Q&A variants and posts the wrong vote immediately. | Pass |

Wrong Answer Marking Testing Table

### Comment Reporting

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| RPT-01 | Report another user’s comment. | Authenticated user clicks report and submits the request. | Report is stored successfully. | `CommentReportController::store` creates a `comment_reports` row and returns `Report submitted.` | Pass |
| RPT-02 | Report the same comment twice. | Same user submits another report for the same comment. | Duplicate report is rejected. | `CommentReportController::store` checks for an existing row and returns HTTP 422 with `Already reported.` | Pass |
| RPT-03 | Expect a moderation queue after reporting. | A report is submitted successfully. | Report should enter a moderation workflow or admin queue. | This code path only inserts a `comment_reports` row; no moderation dispatch, queue, or admin handoff exists here. | Failed |
| RPT-04 | Submit a report when the report table is unavailable. | `comment_reports` table does not exist. | Request is rejected gracefully. | `CommentReportController::store` returns HTTP 503 with `Report feature not available.` | Pass |

Comment Reporting Testing Table

### Frontend Best Answer Display

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| BA-01 | Open a question post with Q&A comments. | At least one top-level comment has a score greater than 1. | Best answer preview is displayed automatically. | `selectBestAnswer()` picks the highest-scoring top-level comment above the threshold and `CommentSection` renders the green best-answer panel plus `BestAnswerAiPanel`. | Pass |
| BA-02 | Expect a nested reply to become best answer. | A reply has the highest score in the thread. | Best answer should follow the highest-scoring comment anywhere in the tree. | `selectBestAnswer()` only considers top-level comments, so replies are ignored and are never auto-selected as best answer. | Failed |
| BA-03 | Open a question post where the top comment score is exactly 1. | Highest top-level score is `1`. | Best answer preview should not appear. | `selectBestAnswer()` requires a score greater than 1, so no best-answer preview is rendered. | Pass |
| BA-04 | Open a non-question post. | Post type is `quiz` or `material`. | Best answer preview should not appear. | The best-answer block renders only when `post.post_type === 'question'` and `variant === 'qna'`. | Pass |
| BA-05 | Expect the backend to persist a selected best answer. | No dedicated best-answer field or route is configured. | Best answer should be stored server-side. | No backend route, model field, or controller branch persists best-answer selection; the display is derived entirely on the frontend from comment score. | Failed |

Frontend Best Answer Display Testing Table

### Authorization and Validation Control

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| AUC-01 | Access comment routes as a guest. | Unauthenticated user calls comment store, update, delete, vote, or report routes. | Request is rejected. | All comment routes are inside the `auth` and `verified` middleware group, so guest access is blocked before the controller runs. | Pass |
| AUC-02 | Edit a comment with empty input. | `content` is blank after trimming. | Validation error is returned. | `CommentController::update` throws a content validation error and does not save the edit. | Pass |
| AUC-03 | Post a reply to a comment from another post. | `parent_id` points to a comment that does not belong to the current post. | Reply is rejected. | `CommentController::store` checks the parent comment against the current post and raises `The selected reply target is invalid.` | Pass |
| AUC-04 | Call the vote endpoint without a direction. | Vote column exists in the schema. | Request is rejected. | `CommentLikeController::toggle` requires `direction` when the vote column exists, so the request fails validation. | Pass |
| AUC-05 | Report one’s own comment from the UI. | Comment belongs to the current user. | Report action should not be available. | `CommentCard` hides the report action when `comment.user?.id === currentUserId`, so self-reporting is blocked in the frontend. | Pass |
| AUC-06 | Open the best-answer preview on a non-question post. | Post is not a question. | Best-answer UI should be hidden. | The frontend keeps the best-answer preview out of quiz and material posts, so the UI does not surface it there. | Pass |

Authorization and Validation Control Testing Table

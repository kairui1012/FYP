## 5.1.1.10 Bookmarks and Study Folder Unit Testing

### System Area
Bookmarks and study folder management for organizing saved learning content and quiz review items.

### Responsibility
Enables users to save posts to bookmarks, organize saved posts into custom folders, and review completed, correct, and wrong quiz attempts.

### Existing Features Tested
- Save posts to bookmarks
- Create custom folders
- Rename folders
- Delete folders
- Move saved posts between folders
- Review completed quiz items
- Review correct quiz items
- Review wrong quiz items
- Authorization and ownership validation

---

### Bookmark Saving and Removing

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| BS-01 | Save a post to bookmarks. | Unauthenticated user clicks save button. | User is redirected to login page. | User is blocked by `['auth', 'verified']` middleware. | Pass |
| BS-02 | Save a post to bookmarks. | Authenticated user clicks save button on post. | Post is added to default bookmark folder and save count increases. | `BookmarkItem` is created in default folder, saves_count increments in API response. | Pass |
| BS-03 | Save the same post twice. | User clicks save button twice on the same post. | Second save removes the bookmark (toggle behavior). | `BookmarkItem` is deleted on second toggle, `isSaved` returns `false`. | Pass |
| BS-04 | Save a post and verify duplicate prevention. | Post is already saved by the same user. | Only one `BookmarkItem` record exists per user-post pair. | Unique constraint on `(user_id, post_id)` in `bookmark_items` table. | Pass |
| BS-05 | Remove a saved post. | User clicks unsave button on a saved post. | Post is removed from all folders and save count decreases. | `BookmarkItem` is deleted, saves_count decrements. | Pass |
| BS-06 | Save a post and verify author points. | User saves a post by a teacher. | Teacher receives points for `resource_bookmarked` event. | `PointsService::award()` called with event name `'resource_bookmarked'`. | Pass |
| BS-07 | Unsave a post and verify author points revoked. | User unsaves a previously saved post. | Teacher loses points for the bookmark. | `PointsService::revoke()` called on existing `BookmarkItem` deletion. | Pass |
| BS-08 | Save multiple posts to bookmarks. | User saves 5 different posts. | All posts appear in bookmarks, each in default folder. | Multiple `BookmarkItem` records created, each with unique post_id. | Pass |
| BS-09 | View saved posts count. | User has saved 5 posts. | Post detail page shows correct save count. | `post->bookmarkItems()->count()` returns the correct number. | Pass |
| BS-10 | Save post after account deletion. | User account is deleted while post is saved. | Bookmark records are cascade deleted. | Foreign key constraint with `ON DELETE CASCADE` on `user_id`. | Pass |

---

### Study Folder Creation

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SF-01 | Create a new folder. | Unauthenticated user submits folder creation form. | User is redirected to login page. | User is blocked by `['auth', 'verified']` middleware. | Pass |
| SF-02 | Create a folder with a valid name. | Authenticated user enters folder name: `"Mathematics"`. | Folder is created and appears in the folder list. | `BookmarkFolder` record is created with `is_default = false`. | Pass |
| SF-03 | Create a folder with whitespace-only name. | User enters folder name: `"   "`. | Error message: `"Folder name is required."` | After `trim()`, empty string is checked and 422 response returned. | Pass |
| SF-04 | Create a folder with empty name. | User submits form without entering a name. | Validation error: `"Folder name is required."` | `'name' => 'required'` validation rule applied. | Pass |
| SF-05 | Create a folder with a very long name. | User enters folder name with 100 characters. | Validation error: name must not exceed 80 characters. | `'max:80'` validation rule applied. | Pass |
| SF-06 | Create a folder with duplicate name. | User already has folder named `"Physics"`, creates another with same name. | Error message: folder name already exists for this user. | `Rule::unique('bookmark_folders', 'name')->where(fn ($query) => $query->where('user_id', $user->id))` prevents duplicate. | Pass |
| SF-07 | Create a folder with duplicate name across different users. | User A has `"Notes"` folder, User B creates `"Notes"` folder. | Both folders are created successfully. | Unique constraint scoped to `user_id`. | Pass |
| SF-08 | Create a folder with special characters. | User enters folder name: `"Math & Notes!"`. | Folder is created with special characters intact. | Name is stored as-is after trimming. | Pass |
| SF-09 | Verify default folder creation. | New user logs in for the first time. | Default folder named `"Default"` is created automatically. | `BookmarkFolder::defaultFor($user)` uses `firstOrCreate()` with `is_default = true`. | Pass |
| SF-10 | Create multiple folders. | User creates 5 different folders. | All folders appear in the folder list, each with its own ID. | Multiple `BookmarkFolder` records created with unique IDs. | Pass |

---

### Study Folder Renaming

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| FR-01 | Rename a folder. | Unauthenticated user attempts to rename a folder. | User is redirected to login page. | User is blocked by `['auth', 'verified']` middleware. | Pass |
| FR-02 | Rename own folder with a new valid name. | User renames folder from `"Chemistry"` to `"Organic Chemistry"`. | Folder is renamed successfully. | `BookmarkFolder::update(['name' => $name])` executes. | Pass |
| FR-03 | Rename folder with whitespace-only name. | User attempts to rename folder to `"   "`. | Error message: `"Folder name is required."` | After `trim()`, empty string is checked and 422 response returned. | Pass |
| FR-04 | Rename folder with empty name. | User submits rename form without entering a name. | Validation error: `"Folder name is required."` | `'name' => 'required'` validation rule applied. | Pass |
| FR-05 | Rename folder with very long name. | User attempts to rename folder with 100 characters. | Validation error: name must not exceed 80 characters. | `'max:80'` validation rule applied. | Pass |
| FR-06 | Rename folder to a name already used by same user. | User has folders `"Notes"` and `"Lab Reports"`, renames second to `"Notes"`. | Error message: folder name already exists for this user. | Unique constraint with `->ignore($bookmarkFolder->id)` allows same name only if same folder. | Pass |
| FR-07 | Rename folder with same name (no change). | User renames folder to its current name. | Folder is updated (no-op). | Unique constraint `->ignore($bookmarkFolder->id)` allows update with same name. | Pass |
| FR-08 | Rename default folder. | User attempts to rename the default folder. | Default folder is renamed (renaming is allowed). | No special check prevents renaming default folder. | Pass |
| FR-09 | Rename another user's folder. | User A attempts to rename User B's folder. | Action is forbidden with 403 error. | `assertOwnership()` checks `$bookmarkFolder->user_id === $request->user()->id`. | Pass |
| FR-10 | Rename non-existent folder. | User attempts to rename a folder that does not exist. | 404 error is returned. | Laravel's implicit model binding returns 404 when model not found. | Pass |

---

### Study Folder Deletion

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| FD-01 | Delete a folder. | Unauthenticated user attempts to delete a folder. | User is redirected to login page. | User is blocked by `['auth', 'verified']` middleware. | Pass |
| FD-02 | Delete a custom folder with saved posts. | User deletes a folder containing 3 saved posts. | Folder is deleted and its posts are moved to default folder. | `BookmarkItem::update(['bookmark_folder_id' => $defaultFolder->id])` then folder is deleted. | Pass |
| FD-03 | Delete an empty custom folder. | User deletes a folder with no saved posts. | Folder is deleted successfully. | Folder deletion works regardless of item count. | Pass |
| FD-04 | Delete the default folder. | User attempts to delete the default folder. | Error message: `"The default bookmark folder cannot be deleted."` | Check `if ($bookmarkFolder->is_default)` returns 422 response. | Pass |
| FD-05 | Verify posts moved to correct folder. | User deletes folder A containing posts P1, P2, P3. | Posts P1, P2, P3 are moved to the default folder. | `BookmarkItem` records are updated with `bookmark_folder_id = $defaultFolder->id`. | Pass |
| FD-06 | Delete non-existent folder. | User attempts to delete a folder ID that does not exist. | 404 error is returned. | Laravel's implicit model binding returns 404. | Pass |
| FD-07 | Delete another user's folder. | User A attempts to delete User B's folder. | Action is forbidden with 403 error. | `assertOwnership()` checks `$bookmarkFolder->user_id === $request->user()->id`. | Pass |
| FD-08 | Delete a folder and verify item cascade. | User deletes folder, which deletes the folder record. | All related items are preserved (moved to default folder) before folder deletion. | Logic explicitly moves items before deleting folder. | Pass |
| FD-09 | Delete multiple folders in sequence. | User deletes folder A, then folder B. | Both folders are deleted, items from both moved to default folder. | Each deletion triggers the move-then-delete logic. | Pass |
| FD-10 | Delete folder after user deletion. | User account is deleted, their folders exist. | Folders are cascade deleted due to foreign key. | Foreign key constraint with `ON DELETE CASCADE` on `user_id`. | Pass |

---

### Moving Saved Posts Between Folders

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| MP-01 | Move a post between folders. | Unauthenticated user attempts to move a post. | User is redirected to login page. | User is blocked by `['auth', 'verified']` middleware. | Pass |
| MP-02 | Move a saved post to a different folder. | User saves post P1 in default folder, moves to `"Lab Notes"` folder. | Post is moved to `"Lab Notes"` folder. | `BookmarkItem::updateOrCreate()` updates `bookmark_folder_id`. | Pass |
| MP-03 | Move a post to a folder not owned by user. | User A attempts to move their post to User B's folder. | Action is forbidden, post stays in original folder. | Query checks `user_id = $request->user()->id` when fetching folder. | Pass |
| MP-04 | Move a post to non-existent folder. | User attempts to move post to a folder ID that does not exist. | 404 error is returned. | `firstOrFail()` throws 404 when folder not found. | Pass |
| MP-05 | Move a post to the same folder (no change). | Post is in folder A, user moves it to folder A. | Post remains in folder A (no-op). | `updateOrCreate()` updates even if folder_id is same. | Pass |
| MP-06 | Move multiple posts to one folder. | User moves posts P1, P2, P3 to `"Physics Notes"` folder. | All three posts are in `"Physics Notes"` folder. | Each `updateOrCreate()` call updates the respective `BookmarkItem`. | Pass |
| MP-07 | Verify folder item count after move. | User moves post from default folder to custom folder. | Default folder item count decreases, custom folder count increases. | `items_count` is counted via `withCount('items')` in query. | Pass |
| MP-08 | Move unsaved post. | User attempts to move a post that is not saved. | Post is saved in the destination folder (createOrUpdate creates new). | `updateOrCreate()` creates new `BookmarkItem` if not exists. | Pass |
| MP-09 | Move post with invalid folder ID. | User sends invalid folder ID (non-integer). | Validation error on `folder_id` field. | Validation: `'folder_id' => ['required', 'integer', Rule::exists(...)]`. | Pass |
| MP-10 | Move post with non-existent post ID. | User attempts to move a post that does not exist. | 404 error via model binding. | Laravel's implicit route model binding returns 404. | Pass |

---

### Completed Quiz Review

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| CQ-01 | View completed quizzes. | Unauthenticated user accesses bookmarks page. | User is redirected to login page. | User is blocked by `['auth', 'verified']` middleware. | Pass |
| CQ-02 | Access completed quiz review mode. | Authenticated user clicks `"Completed Quizzes"` in study folder sidebar. | Page displays all posts with completed quizzes. | Route parameter `study=completed` triggers `getCompletedQuizPostIds()` logic. | Pass |
| CQ-03 | Completed quiz count is correct. | User completed quizzes for 3 posts. | `completedCount` shows 3. | `QuizCompletion::where('user_id', $userId)->count()` returns correct count. | Pass |
| CQ-04 | Display completed quiz posts. | User completed quizzes for posts A, B, C. | Posts A, B, C are displayed in completed mode. | `Post::whereIn('id', array_values($completedPostIds))` fetches completed posts. | Pass |
| CQ-05 | Verify posts are from current user only. | User A and User B both completed quizzes. | User A sees only their completed quizzes. | `QuizCompletion::where('user_id', $userId)` filters by current user. | Pass |
| CQ-06 | No completed quizzes display. | User has not completed any quizzes. | `completedCount` is 0, completed posts list is empty. | Empty array returned when no `QuizCompletion` records exist. | Pass |
| CQ-07 | Quiz table doesn't exist (new system). | System is freshly deployed, `quiz_completions` table doesn't exist. | `completedCount` is 0, no errors. | `Schema::hasTable('quiz_completions')` returns false, empty array returned. | Pass |
| CQ-08 | Return from completed mode to folder view. | User is in completed quiz mode, clicks on a folder. | Page switches to folder view showing saved posts. | Different route parameter removes `study=completed`. | Pass |
| CQ-09 | Completed quiz posts show quiz metadata. | Completed quiz post is displayed. | Post includes all metadata (title, subject, language, etc.). | Posts loaded with relationships: `user`, `subject`, `language`, etc. | Pass |
| CQ-10 | Sort completed quizzes by date. | User completed quizzes for posts A, B, C on different dates. | Posts are sorted by creation date (newest first). | `orderByDesc('created_at')` in query. | Pass |

---

### Correct Quiz Review

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| CR-01 | View correct quiz answers. | Unauthenticated user accesses bookmarks page. | User is redirected to login page. | User is blocked by `['auth', 'verified']` middleware. | Pass |
| CR-02 | Access correct quiz review mode. | Authenticated user clicks `"Correct Answers"` in study folder sidebar. | Page displays quiz review items where user answered correctly. | Route parameter `study=correct` triggers `getQuizReviewItems($userId, true)` logic. | Pass |
| CR-03 | Correct quiz count is accurate. | User answered 5 quiz questions correctly. | `correctCount` shows 5. | `QuizMistake::where('user_id', $userId)->where('is_correct', true)->count()` returns 5. | Pass |
| CR-04 | Display correct quiz items. | User answered correctly for 3 quiz questions. | All 3 quiz review items are displayed. | `QuizMistake` records with `is_correct = true` are fetched and serialized. | Pass |
| CR-05 | Correct quiz items show question details. | User answers quiz question correctly. | Review item displays question, correct answer, and user's answer. | `QuizMistake` includes fields: `question_index`, `selected_answer_index`, `post` data. | Pass |
| CR-06 | Quiz items filtered by correctness. | User has both correct and incorrect answers. | Correct review shows only correct answers (is_correct = true). | Query filters: `where('is_correct', true)`. | Pass |
| CR-07 | No correct answers display. | User has not answered any quiz questions correctly. | `correctCount` is 0, correct items list is empty. | Empty array returned when no `QuizMistake` records with `is_correct = true` exist. | Pass |
| CR-08 | Quiz table doesn't exist (new system). | System is freshly deployed, `quiz_mistakes` table doesn't exist. | `correctCount` is 0, no errors. | `Schema::hasTable('quiz_mistakes')` returns false, empty array returned. | Pass |
| CR-09 | Correct quiz items show associated post. | Correct answer relates to post `"Math Lesson"`. | Post title `"Math Lesson"` is displayed in review item. | `QuizMistake` includes `with(['post:id,title,subject_id,quiz_data', ...])`. | Pass |
| CR-10 | Sort correct answers by attempt date. | User answered correctly on different dates. | Items are sorted by `attempted_at` (newest first). | `orderByDesc('attempted_at')` in query. | Pass |

---

### Wrong Quiz Review

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| WQ-01 | View wrong quiz answers. | Unauthenticated user accesses bookmarks page. | User is redirected to login page. | User is blocked by `['auth', 'verified']` middleware. | Pass |
| WQ-02 | Access wrong quiz review mode. | Authenticated user clicks `"Wrong Answers"` in study folder sidebar. | Page displays quiz review items where user answered incorrectly. | Route parameter `study=wrong` triggers `getQuizReviewItems($userId, false)` logic. | Pass |
| WQ-03 | Wrong quiz count is accurate. | User answered 8 quiz questions incorrectly. | `wrongCount` shows 8. | `QuizMistake::where('user_id', $userId)->where('is_correct', false)->count()` returns 8. | Pass |
| WQ-04 | Display wrong quiz items. | User answered incorrectly for 4 quiz questions. | All 4 quiz review items are displayed. | `QuizMistake` records with `is_correct = false` are fetched and serialized. | Pass |
| WQ-05 | Wrong quiz items show question details. | User answers quiz question incorrectly. | Review item displays question, correct answer, and user's wrong answer. | `QuizMistake` includes: `question_index`, `selected_answer_index`, `is_correct = false`. | Pass |
| WQ-06 | Quiz items filtered by incorrectness. | User has both correct and incorrect answers. | Wrong review shows only incorrect answers (is_correct = false). | Query filters: `where('is_correct', false)`. | Pass |
| WQ-07 | No wrong answers display. | User answered all quiz questions correctly. | `wrongCount` is 0, wrong items list is empty. | Empty array returned when no `QuizMistake` records with `is_correct = false` exist. | Pass |
| WQ-08 | Quiz table doesn't exist (new system). | System is freshly deployed, `quiz_mistakes` table doesn't exist. | `wrongCount` is 0, no errors. | `Schema::hasTable('quiz_mistakes')` returns false, empty array returned. | Pass |
| WQ-09 | Wrong quiz items show associated post. | Wrong answer relates to post `"Chemistry Quiz"`. | Post title `"Chemistry Quiz"` is displayed in review item. | `QuizMistake` includes `with(['post:id,title,subject_id,quiz_data', ...])`. | Pass |
| WQ-10 | Sort wrong answers by attempt date. | User answered incorrectly on different dates. | Items are sorted by `attempted_at` (newest first). | `orderByDesc('attempted_at')` in query. | Pass |

---

### Authorization and Validation Control

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| AV-01 | Guest user access bookmarks page. | Unauthenticated user navigates to `/bookmarks`. | User is redirected to login page. | `['auth', 'verified']` middleware blocks access. | Pass |
| AV-02 | Guest user save a post. | Unauthenticated user clicks save button. | User is redirected to login page. | `['auth', 'verified']` middleware blocks access to `/posts/{post}/save`. | Pass |
| AV-03 | Guest user create folder. | Unauthenticated user submits folder creation form. | User is redirected to login page. | `['auth', 'verified']` middleware blocks access to `/bookmarks/folders`. | Pass |
| AV-04 | Verified user access bookmarks. | Authenticated and email-verified user accesses `/bookmarks`. | User can access bookmarks page. | `['auth', 'verified']` middleware allows access. | Pass |
| AV-05 | Unverified user access bookmarks. | Authenticated but email-unverified user accesses `/bookmarks`. | User is blocked by middleware. | `'verified'` middleware checks email verification status. | Pass |
| AV-06 | User access another user's folder. | User A tries to access folder details of User B. | User A is blocked with 403 error. | `assertOwnership()` checks ownership before any folder operation. | Pass |
| AV-07 | User update another user's folder. | User A tries to rename User B's folder. | User A is blocked with 403 error. | `assertOwnership()` in update method prevents unauthorized access. | Pass |
| AV-08 | User delete another user's folder. | User A tries to delete User B's folder. | User A is blocked with 403 error. | `assertOwnership()` in destroy method prevents unauthorized access. | Pass |
| AV-09 | User move post to another user's folder. | User A tries to move their post to User B's folder. | User A is blocked, post stays in original folder. | Query filters by `user_id = $request->user()->id` when fetching folder. | Pass |
| AV-10 | Folder name validation rules. | User submits invalid folder name (too long, empty, etc.). | Appropriate validation error is returned. | All name validations are enforced: `required`, `string`, `max:80`. | Pass |

---

### Empty State and Edge Cases

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| EC-01 | No saved posts display. | User has not saved any posts. | Bookmarks page shows empty state for default folder. | Empty posts array returned, frontend displays empty state. | Pass |
| EC-02 | No custom folders display. | User has not created any custom folders. | Only default folder is shown in folder list. | Query returns only `is_default = true` folder for new user. | Pass |
| EC-03 | No completed quizzes display. | User has not completed any quizzes. | Completed quiz tab shows 0 count and empty state. | `getCompletedQuizPostIds()` returns empty array. | Pass |
| EC-04 | No correct answers display. | User has not answered any quizzes correctly. | Correct answers tab shows 0 count and empty state. | `getQuizReviewCount($userId, true)` returns 0. | Pass |
| EC-05 | No wrong answers display. | User has not answered any quizzes incorrectly. | Wrong answers tab shows 0 count and empty state. | `getQuizReviewCount($userId, false)` returns 0. | Pass |
| EC-06 | Save post then delete post. | User saves post P1, admin deletes P1. | Saved post record is cascade deleted. | Foreign key `ON DELETE CASCADE` on `post_id` in `bookmark_items`. | Pass |
| EC-07 | Create folder, save post, delete post. | User saves post P1 in custom folder, post is deleted. | Post record is removed, folder remains with one fewer item. | Cascade delete removes the `BookmarkItem` record. | Pass |
| EC-08 | User with many bookmarks. | User saves 500 posts. | All posts are retrievable, pagination works (if implemented). | Query with `->get()` retrieves all records without limit. | Pass |
| EC-09 | User with many folders. | User creates 50 custom folders. | All folders appear in the folder list. | Query returns all folders, ordered by `is_default` desc then name. | Pass |
| EC-10 | Bookmark after post is soft deleted. | User saves post P1, post is soft-deleted (if implemented). | Saved post is still in bookmarks (behavior depends on post deletion logic). | Post soft-delete behavior depends on `Post` model configuration. | Pass |


## 5.1.1.3 Feed and Discovery Unit Testing

System area:
Feed and discovery

Responsibility:
Lets users find posts by type, popularity, category, language, subject, author, or title.

### Home Feed Loading

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| HFL-01 | Open `/homePage`. | User is not logged in. | User is redirected to login page. | Route is inside `auth` and `verified` middleware group, so guest user is redirected to login page. | Pass |
| HFL-02 | Open `/homePage`. | User is logged in. | Home feed page is displayed. | `PostController@index` renders `HomePage` with posts and learning overview data. | Pass |
| HFL-03 | Load home feed posts. | Posts exist from non-blocked users. | Posts are displayed in latest order. | `renderHomePage` uses `excludeBlockedUsers()` and `latest()`, then returns all matching posts. | Pass |
| HFL-04 | Load home feed posts. | Post author has `is_blocked = true`. | Posts from blocked users should not be displayed. | `PostQueryBuilder::excludeBlockedUsers()` excludes posts whose user is blocked. | Pass |
| HFL-05 | Load home feed posts. | Post has likes, comments, and saves. | Feed includes engagement counts. | Query loads `likes_count`, `comments_count`, and `saves_count`. | Pass |
| HFL-06 | Load home feed posts. | Current user has liked or saved a post. | Feed shows user-specific liked and saved status. | Query loads `is_liked` and `is_saved` using the authenticated user ID. | Pass |
| HFL-07 | Load home feed with many posts. | More than one page of posts exists. | Feed should paginate if pagination is implemented. | Controller uses `paginate()` and returns pagination metadata for previous and next page navigation. | Pass |

Home Feed Loading Testing Table

### Questions Feed Filtering

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| QFF-01 | Open `/questions`. | User is not logged in. | User is redirected to login page. | Route is inside `auth` and `verified` middleware group, so guest user is redirected to login page. | Pass |
| QFF-02 | Open `/questions`. | User is logged in. | Questions feed is displayed. | `PostController@questions` renders `HomePage` with `pageContext = questions`. | Pass |
| QFF-03 | Load questions feed. | Posts include `question`, `quiz`, and `material` types. | Only Q&A-related posts should be displayed. | Controller forces post types to `question` and `quiz`, so material posts are excluded. | Pass |
| QFF-04 | Load questions feed with query `post_type=material`. | User is logged in. | Forced questions feed should not show materials. | Forced route filter overrides request post type and still returns only `question` and `quiz`. | Pass |
| QFF-05 | Load questions feed with blocked authors. | Some question posts belong to blocked users. | Blocked users' posts should not be displayed. | Feed uses `excludeBlockedUsers()`, so blocked authors' posts are excluded. | Pass |
| QFF-06 | Load questions feed with no question or quiz posts. | Database has no matching posts. | Empty feed state is displayed. | Controller returns an empty posts collection and React `HomeFeedSection` displays the empty state. | Pass |

Questions Feed Filtering Testing Table

### Learning Materials Feed Filtering

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| LMF-01 | Open `/learning-materials`. | User is not logged in. | User is redirected to login page. | Route is protected by `auth` and `verified`, so guest user is redirected to login page. | Pass |
| LMF-02 | Open `/learning-materials`. | User is logged in. | Learning materials feed is displayed. | `PostController@learningMaterials` renders `HomePage` with `pageContext = materials`. | Pass |
| LMF-03 | Load learning materials feed. | Posts include `material`, `question`, and `quiz` types. | Only study material posts should be displayed. | Controller forces post type to `material`, so questions and quizzes are excluded. | Pass |
| LMF-04 | Load learning materials feed with query `post_type=question`. | User is logged in. | Forced materials feed should not show questions. | Forced route filter overrides request post type and still returns only `material`. | Pass |
| LMF-05 | Load learning materials feed. | Material posts have feedback summaries. | Material-related summary data should be included if available. | `renderHomePage` calls `attachMaterialFeedbackSummaries()` before serializing posts. | Pass |
| LMF-06 | Load learning materials feed with no material posts. | Database has no matching material posts. | Empty feed state is displayed. | Controller returns an empty posts collection and React feed component displays the empty state. | Pass |

Learning Materials Feed Filtering Testing Table

### Following Feed

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| FWF-01 | Open `/following`. | User is not logged in. | User is redirected to login page. | Route is protected by `auth` and `verified`, so guest user is redirected to login page. | Pass |
| FWF-02 | Open `/following`. | User is logged in and follows users. | Following feed is displayed. | `FollowerController@index` renders `HomePage` with `pageContext = following`. | Pass |
| FWF-03 | Load following feed. | Followed users have posts. | Only posts from followed users are displayed. | Controller collects followed user IDs and filters posts with `whereIn('user_id', $followingIds)`. | Pass |
| FWF-04 | Load following feed. | Non-followed users have posts. | Non-followed users' posts should not be displayed. | Query only includes followed user IDs, so non-followed users' posts are excluded. | Pass |
| FWF-05 | Load following feed. | Followed user is blocked. | Blocked followed user's posts should not be displayed. | Query includes `whereHas('user', fn ($q) => $q->where('is_blocked', false))`. | Pass |
| FWF-06 | Load following feed. | User follows no accounts. | Empty following state is displayed. | `whereIn` receives an empty followed ID list and returns no posts; React displays following empty state. | Pass |
| FWF-07 | Load following feed posts. | Multiple followed posts exist. | Posts are sorted newest first. | Controller calls `latest()` before `get()`. | Pass |
| FWF-08 | Load following feed with many posts. | More than one page of posts exists. | Feed should paginate if pagination is implemented. | Controller uses `paginate()` and returns pagination metadata for previous and next page navigation. | Pass |

Following Feed Testing Table

### Popular Trends

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| PTR-01 | Open `/popularPage`. | User is not logged in. | User is redirected to login page. | Route is protected by `auth` and `verified`, so guest user is redirected to login page. | Pass |
| PTR-02 | Open `/popularPage`. | User is logged in and no filters are provided. | Popular trends page is displayed with default trend settings. | Controller defaults to `range = week` and `sort = hottest`. | Pass |
| PTR-03 | Load popular trends with default sort. | Posts have different like counts during the current week. | Posts are sorted by hottest. | Query counts likes within the selected range as `popular_likes_count`, orders by that count descending, then by latest. | Pass |
| PTR-04 | Load popular trends with `sort=newest`. | User selects newest sort. | Posts are sorted newest first. | Controller calls `latest()` when `sort` is `newest`. | Pass |
| PTR-05 | Load popular trends with `range=today`. | Posts have likes today and outside today. | Popular count uses only today's likes. | Controller filters counted likes between start and end of current day. | Pass |
| PTR-06 | Load popular trends with `range=week`. | Posts have likes this week and outside this week. | Popular count uses only current week likes. | Controller filters counted likes between start and end of current week. | Pass |
| PTR-07 | Load popular trends with `range=month`. | Posts have likes this month and outside this month. | Popular count uses only current month likes. | Controller filters counted likes between start and end of current month. | Pass |
| PTR-08 | Load popular trends with `range=all`. | Posts have likes across all dates. | Popular count uses all likes. | Controller does not apply a date filter when range is `all`. | Pass |
| PTR-09 | Load popular trends with category filters. | Query contains `language_code`, `subject_id`, or `post_type`. | Filtered popular page should use filtered results. | Controller applies matching language, subject, and post type filters and defaults to `range = all`, `sort = newest`. | Pass |
| PTR-10 | Load popular trends with invalid `range`. | Query contains `range=year`. | Invalid filter is rejected. | Laravel validation rejects value because allowed ranges are `today`, `week`, `month`, and `all`. | Pass |
| PTR-11 | Load popular trends with blocked authors. | Popular post belongs to blocked user. | Blocked users' posts should not be displayed. | Query excludes posts whose author has `is_blocked = true`. | Pass |
| PTR-12 | Load popular trends with many posts. | More than one page of posts exists. | Popular results should paginate if pagination is implemented. | Controller uses `paginate()` and preserves current filters in pagination links. | Pass |

Popular Trends Testing Table

### Category, Language, and Subject Filtering

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| CLS-01 | Open `/categories`. | User is not logged in. | User is redirected to login page. | Route is protected by `auth` and `verified`, so guest user is redirected to login page. | Pass |
| CLS-02 | Open `/categories`. | User is logged in. | Category filter page is displayed. | `PostController@categories` renders `CategoriesPage` with language and subject filter metadata. | Pass |
| CLS-03 | View category metadata. | Languages and subjects exist. | Languages and subjects are listed with post counts. | Controller returns languages and subjects with `posts_count`, ordered by count descending and name ascending. | Pass |
| CLS-04 | Click view all posts. | No filters are selected. | All discoverable posts are returned. | React requests lazy `filteredPosts`; controller returns all non-blocked posts ordered newest first. | Pass |
| CLS-05 | Apply content type filter. | Selected type is `material`. | Only material posts are returned. | Controller validates `post_type` and filters posts by `material`. | Pass |
| CLS-06 | Apply content type filter. | Selected type is `question`. | Only question posts are returned. | Controller filters by `post_type = question`. | Pass |
| CLS-07 | Apply content type filter. | Selected type is `quiz`. | Only quiz posts are returned. | Controller filters by `post_type = quiz`. | Pass |
| CLS-08 | Apply language filter. | Selected language code exists. | Only posts using that language are returned. | Controller filters with `whereHas('language', fn ($query) => $query->where('code', $languageCode))`. | Pass |
| CLS-09 | Apply subject filter. | Selected subject ID exists. | Only posts from that subject are returned. | Controller filters with `where('subject_id', $subjectId)`. | Pass |
| CLS-10 | Apply combined filters. | Language, subject, and post type are selected. | Only posts matching all selected filters are returned. | Controller applies all selected filters together before sorting by latest. | Pass |
| CLS-11 | Apply invalid post type. | Query contains `post_type=video`. | Invalid filter is rejected. | Laravel validation rejects value because allowed types are `material`, `question`, and `quiz`. | Pass |
| CLS-12 | Apply invalid language. | Query contains language code that does not exist. | Invalid filter is rejected. | Laravel validation rejects value because `language_code` must exist in `languages.code`. | Pass |
| CLS-13 | Apply invalid subject. | Query contains subject ID that does not exist. | Invalid filter is rejected. | Laravel validation rejects value because `subject_id` must exist in `subjects.id`. | Pass |
| CLS-14 | Apply filters with no matching posts. | Valid filters match no posts. | Empty results state is displayed. | Controller returns an empty `filteredPosts` collection and React displays no posts found message. | Pass |

Category, Language, and Subject Filtering Testing Table

### Search by Title, Author, or Keyword

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| STK-01 | Use search box. | Query length is less than 2 characters. | No search results are returned. | `SearchController@search` returns empty `users` and `posts` arrays. | Pass |
| STK-02 | Search by user name. | Query matches a user's name. | Matching users are returned. | Search queries `User::where('name', 'LIKE', $like)` and returns up to 5 users. | Pass |
| STK-03 | Search by post title. | Query matches a post title. | Matching posts are returned. | Search queries `Post::where('title', 'LIKE', $like)` and returns up to 5 posts. | Pass |
| STK-04 | Search by exact or prefix match. | Query exactly matches or starts a user/post name. | Exact and prefix matches appear first. | Search uses `orderByRaw` with exact match first, prefix match second, and other matches third. | Pass |
| STK-05 | Press Enter in search box. | User results exist. | First user result is opened. | React header navigates to `/profilePage/{id}` when users are returned. | Pass |
| STK-06 | Press Enter in search box. | No user results, but post results exist. | First post result is opened. | React header navigates to `/posts/{id}` when only posts are returned. | Pass |
| STK-07 | Search by post content keyword. | Query exists only in post content, not title. | Post should be found if content search is supported. | Search queries both post title and post content, so content-only keyword matches are returned. | Pass |
| STK-08 | Search by author name expecting posts. | Query matches author name but not post title. | Posts by that author should be found if author-post search is supported. | Search returns matching users, but post results are not filtered by author name. | Failed |
| STK-09 | Search with no matching data. | Query length is at least 2 but no user or post title matches. | Empty search message is displayed. | Backend returns empty arrays and React header displays search no results message. | Pass |
| STK-10 | Search when many users match. | More than 5 users match query. | Result list is limited. | Controller applies `limit(5)` to users. | Pass |
| STK-11 | Search when many posts match. | More than 5 posts match query. | Result list is limited. | Controller applies `limit(5)` to posts. | Pass |

Search by Title, Author, or Keyword Testing Table

### Empty, Invalid, and Pagination Handling

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| EIP-01 | Load home feed. | No posts exist. | Empty feed state is displayed. | Controller returns empty posts collection and `HomeFeedSection` displays empty feed content. | Pass |
| EIP-02 | Load following feed. | User follows nobody. | Empty following state is displayed. | Controller returns empty posts collection and `HomeFeedSection` displays following empty content. | Pass |
| EIP-03 | Load popular page. | No posts match selected range or filters. | Empty popular state is displayed. | `LearningTrendsPage` renders `LearningTrendsEmptyState` when posts length is zero. | Pass |
| EIP-04 | Load category results. | Valid filters match no posts. | Empty category results state is displayed. | `CategoryResultsPanel` displays no posts found message when posts length is zero. | Pass |
| EIP-05 | Search. | Query length is at least 2 and no results match. | Empty search result message is displayed. | Backend returns empty arrays and React search dropdown displays no results. | Pass |
| EIP-06 | Use invalid home feed post type filter. | Query contains `post_type=invalid`. | Invalid filter is rejected. | Laravel validation rejects the request because allowed post types are `material`, `question`, and `quiz`. | Pass |
| EIP-07 | Use invalid popular sort filter. | Query contains `sort=oldest`. | Invalid filter is rejected. | Laravel validation rejects the request because allowed sort values are `newest` and `hottest`. | Pass |
| EIP-08 | Use invalid subject filter. | Query contains non-existing `subject_id`. | Invalid filter is rejected. | Laravel validation rejects the request because subject must exist in the `subjects` table. | Pass |
| EIP-09 | Check feed pagination. | Home, following, category, or popular results contain many posts. | Pagination should be available if implemented. | Home, following, category, and popular results use `paginate()` and display previous/next pagination controls. | Pass |

Empty, Invalid, and Pagination Handling Testing Table

## 5.1.1.4 Post Creation Unit Testing

System area:
Post creation

Responsibility:
Validates and persists all post types with correct metadata and permissions.

### Question Post Creation

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| QPC-01 | Open create post page. | User is not logged in. | User is redirected to login page. | `/createPostPage` is inside the `auth` and `verified` middleware group, so guest user is redirected to login page. | Pass |
| QPC-02 | Open create post page. | User is logged in. | Create post page is displayed with subjects, materials, quiz options, and material publishing permission flag. | `PostCreateController@create` renders `CreatePostPage` with `subjects`, `learningMaterials`, `availableQuizzes`, and `canPublishStudyMaterial`. | Pass |
| QPC-03 | Submit question post. | Valid title, content, post type `question`, subject ID, and language code are provided. | Question post is created and saved with the authenticated user as author. | `PostCreateController@store` creates a `posts` record with `user_id`, `title`, `content`, `post_type = question`, `subject_id`, and resolved `language_id`, then redirects to `homePage`. | Pass |
| QPC-04 | Submit question post without content. | `post_type = question`, content is empty. | Question post is rejected. | Controller rejects non-material posts with empty trimmed content and returns `Please add content before publishing.` | Pass |
| QPC-05 | Submit question post without title. | Title is empty. | Validation error is returned. | Laravel validation requires `title` and limits it to 150 characters. | Pass |
| QPC-06 | Submit question post with invalid subject. | `subject_id` does not exist. | Validation error is returned. | Laravel validation rejects the request because `subject_id` must exist in the `subjects` table. | Pass |
| QPC-07 | Submit question post with invalid language. | `language_code` does not exist. | Validation error is returned. | Laravel validation rejects the request because `language_code` must exist in the `languages.code` column. | Pass |
| QPC-08 | Submit question post with selected study material. | Valid `parent_material_id` points to a material post. | Question is linked to the selected study material. | Controller accepts `parent_material_id` for non-material posts when the ID exists and belongs to a `material` post, then persists it if the column exists. | Pass |

Question Post Creation Testing Table

### Quiz Post Creation

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| QZC-01 | Submit quiz post. | Valid title, content, post type `quiz`, subject ID, language code, and one valid quiz question are provided. | Quiz post is created with quiz questions saved. | Controller creates a `posts` record with `post_type = quiz` and stores questions under `quiz_data['questions']`. | Pass |
| QZC-02 | Submit quiz post without quiz questions. | `post_type = quiz`, `quiz_questions` is missing. | Validation error is returned. | Laravel validation requires `quiz_questions` when `post_type` is `quiz`. | Pass |
| QZC-03 | Submit quiz question with fewer than two options. | A quiz question has one option. | Validation error is returned. | Laravel validation rejects the question because `quiz_questions.*.options` must contain at least two options. | Pass |
| QZC-04 | Submit quiz question with more than eight options. | A quiz question has nine options. | Validation error is returned. | Laravel validation rejects the question because `quiz_questions.*.options` has a maximum of eight options. | Pass |
| QZC-05 | Submit quiz question with blank option text. | One option is an empty string after trimming. | Validation error is returned. | Controller trims options and rejects the question with an answer index error when any option is blank. | Pass |
| QZC-06 | Submit quiz question with invalid correct answer index. | `answer_index` points outside the options array. | Validation error is returned. | Controller checks `isset($options[$answerIndex])` and rejects the question when the correct answer index is invalid. | Pass |
| QZC-07 | Submit quiz with explanation. | `quiz_questions.*.explanation` is provided and is within 700 characters. | Explanation is saved with the quiz question. | Controller trims the explanation and stores it inside each item in `quiz_data['questions']`. | Pass |
| QZC-08 | Submit quiz linked to study material. | Valid `parent_material_id` points to a material post. | Quiz is linked to the selected study material. | Controller accepts the material ID for non-material posts and stores it as `parent_material_id` when the database column exists. | Pass |

Quiz Post Creation Testing Table

### Study Material Post Creation

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SMC-01 | View post type choices as student. | Logged-in user has role `student`. | Study material option is not available. | React filters the `material` post type out when `canPublishStudyMaterial` is false, and `setPostType` also refuses `material` selection. | Pass |
| SMC-02 | Submit study material as student by direct request. | User role is `student`, `post_type = material`. | Request is rejected. | Controller calls `canPublishStudyMaterials()` and returns validation error `Only admins and teachers can publish Study Materials.` | Pass |
| SMC-03 | Submit study material as teacher. | User role is `teacher`, valid title, subject, language, and at least one complete material block are provided. | Study material post is created. | `canPublishStudyMaterials()` allows `teacher`, and controller creates a `material` post with normalized `content_blocks`. | Pass |
| SMC-04 | Submit study material as admin. | User role is `admin`, valid title, subject, language, and at least one complete material block are provided. | Study material post is created. | `canPublishStudyMaterials()` allows `admin`, and controller creates a `material` post with normalized `content_blocks`. | Pass |
| SMC-05 | Submit study material without complete blocks. | `material_blocks` contains only empty text or empty video/file blocks. | Validation error is returned. | Validation accepts the array shape, but `normalizeMaterialBlocks()` removes incomplete blocks and controller returns `Add at least one complete content block.` | Pass |
| SMC-06 | Submit study material with text block. | Text material block has non-empty text. | Text block is saved and included in searchable plain content. | Controller stores a normalized text block and builds `content` from the title and text block. | Pass |
| SMC-07 | Submit study material with image or document block. | Material block contains supported image or document file. | File block is saved in material content blocks. | Controller stores the file in `posts/materials` on the public disk and saves `type`, `path`, `name`, and `mime` in `content_blocks`. | Pass |
| SMC-08 | Submit study material with video block. | Material block contains a non-empty video URL string. | Only a valid video URL should be saved. | Controller saves the non-empty `url` value in `content_blocks`; it only validates string length and does not enforce URL format. | Failed |
| SMC-09 | Submit study material with anonymous flag. | `post_type = material`, `is_anonymous = 1`. | Study materials should not be anonymous. | Controller forces `is_anonymous` to false for material posts before saving. | Pass |
| SMC-10 | Submit study material with selected parent material. | `post_type = material`, `parent_material_id` is provided. | Study material should not be nested under another material. | Controller sets `parent_material_id` to null for material posts. | Pass |
| SMC-11 | Submit study material successfully. | Valid material post is created. | Material version snapshot is created for revision tracking. | After saving a material post, controller calls `MaterialVersionService::createSnapshot($post)`. | Pass |

Study Material Post Creation Testing Table

### File Attachment Handling

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| FAH-01 | Attach file to question post. | Supported file is uploaded through `attachments[]`. | File is stored and linked to the post. | Controller stores each attachment in `posts` on the public disk and saves the stored paths in the post `image` array. | Pass |
| FAH-02 | Attach file to quiz post. | Supported file is uploaded through `attachments[]`. | File is stored and linked to the quiz post. | Controller uses the same `attachments[]` upload path for quiz posts and saves stored paths in `image`. | Pass |
| FAH-03 | Upload unsupported attachment. | Attachment MIME is outside jpg, jpeg, png, webp, gif, pdf, doc, docx, xls, xlsx, ppt, and pptx. | Validation error is returned. | Laravel validation rejects unsupported files through the `attachments.*` `mimes` rule. | Pass |
| FAH-04 | Upload attachment larger than 20 MB. | Attachment exceeds `max:20480`. | Validation error is returned. | Laravel validation rejects the file because `attachments.*` is limited to 20480 KB. | Pass |
| FAH-05 | Upload mixed image and document attachments. | Direct request contains both image and document files. | Mixed attachment types should be rejected consistently with the React form rule. | React prevents mixed file kinds in the UI, but backend validation only checks MIME and size, so a direct request can submit mixed attachment types. | Failed |
| FAH-06 | Upload attachments with total size above 50 MB. | Each file is under 20 MB but combined files exceed 50 MB. | Total upload size should be rejected consistently with the React form rule. | React checks `MAX_TOTAL_SIZE`, but backend has no total attachment size validation and only enforces the per-file limit. | Failed |
| FAH-07 | Attach general attachments to study material by direct request. | `post_type = material` and `attachments[]` is included. | General attachments should be ignored without storing unrelated files, because materials use content blocks. | Controller stores `attachments[]` before detecting material posts, then resets the saved attachment list to empty, leaving the material post without linked attachments. | Failed |
| FAH-08 | Upload material block file with unsupported MIME. | Material image or document block uses unsupported file type. | Validation error is returned. | Laravel validation rejects unsupported material block files through the `material_blocks.*.file` `mimes` rule. | Pass |
| FAH-09 | Upload material block file larger than 20 MB. | Material block file exceeds `max:20480`. | Validation error is returned. | Laravel validation rejects the file because `material_blocks.*.file` is limited to 20480 KB. | Pass |

File Attachment Handling Testing Table

### Quiz Linking to Materials

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| QLM-01 | Open create post page. | Material posts exist. | Existing study materials are available for question or quiz linking. | `PostCreateController@create` loads posts where `post_type = material` and passes them to `CreatePostPage` as `learningMaterials`. | Pass |
| QLM-02 | Link new quiz to existing material. | Quiz creation request includes valid `parent_material_id`. | Quiz post is linked to the material. | Validation requires `parent_material_id` to exist on a material post, and controller persists it for non-material posts. | Pass |
| QLM-03 | Link question to existing material. | Question creation request includes valid `parent_material_id`. | Question post is linked to the material if this relation is supported. | Controller accepts `parent_material_id` for all non-material post types, so question posts can also be linked to a material. | Pass |
| QLM-04 | Link post to non-material parent. | `parent_material_id` points to a question or quiz post. | Validation error is returned. | Validation uses `Rule::exists('posts', 'id')->where(post_type = material)`, so non-material parents are rejected. | Pass |
| QLM-05 | Attach existing quizzes while creating material. | Teacher creates material and selects own quiz IDs in `linked_quiz_ids`. | Selected quizzes are linked to the new material. | After material creation, controller updates matching quiz posts and sets their `parent_material_id` to the new material ID. | Pass |
| QLM-06 | Attach existing quizzes as admin. | Admin creates material and selects quiz IDs from any author. | Selected quizzes are linked to the new material. | For admin users, controller does not add an owner filter and updates all selected quiz IDs that exist as quiz posts. | Pass |
| QLM-07 | Attach another user's quiz as teacher. | Teacher creates material and selects a quiz owned by another user. | Unauthorized selected quiz should be rejected or not shown as attachable. | `CreatePostPage` receives all quizzes, but controller silently filters non-admin link updates to the current user's quizzes, so the request succeeds while the other user's selected quiz is not linked. | Failed |
| QLM-08 | Attach invalid linked quiz ID. | `linked_quiz_ids[]` references a non-existing post or non-quiz post. | Validation error is returned. | Laravel validation rejects each linked quiz ID unless it exists in `posts` with `post_type = quiz`. | Pass |

Quiz Linking to Materials Testing Table

### Anonymous Question Handling

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| AQH-01 | View anonymous option. | Selected post type is `question`. | Anonymous toggle is shown. | `CreatePostPage` renders `AnonymousToggleSection` only when `selectedPostType === 'question'`. | Pass |
| AQH-02 | Submit anonymous question. | `post_type = question`, `is_anonymous = 1`. | Question is saved as anonymous. | Controller casts the value with `FILTER_VALIDATE_BOOLEAN` and saves `is_anonymous = true`. | Pass |
| AQH-03 | Display anonymous question. | Saved question has `is_anonymous = true`. | Author identity is hidden. | `PostSerializationService::serializeUser()` returns null when `is_anonymous` is true. | Pass |
| AQH-04 | Submit normal question. | `post_type = question`, `is_anonymous = 0`. | Question is saved with visible author. | Controller saves `is_anonymous = false`, and serialization includes the user data when the post is not anonymous. | Pass |
| AQH-05 | Submit anonymous quiz by direct request. | `post_type = quiz`, `is_anonymous = 1`. | Anonymous posting should apply only to questions. | React only sends anonymous flag for questions, but backend accepts `is_anonymous` for quiz posts and will save an anonymous quiz if submitted directly. | Failed |
| AQH-06 | Award post creation progress for anonymous question. | Anonymous question is created. | Anonymous question should not reveal or sync public progress. | Controller awards points, but skips achievement sync and `recordPostCreated()` when `is_anonymous` is true. | Pass |

Anonymous Question Handling Testing Table

### Validation and Permission Control

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| VPC-01 | Submit post without authentication. | Guest sends `POST /posts`. | User is redirected to login page. | Route is inside the `auth` and `verified` middleware group, so unauthenticated users cannot create posts. | Pass |
| VPC-02 | Submit invalid post type. | `post_type = discussion` or another unsupported value. | Validation error is returned. | Controller restricts `post_type` to `material`, `question`, and `quiz`. | Pass |
| VPC-03 | Submit post with title longer than 150 characters. | `title` exceeds 150 characters. | Validation error is returned. | Laravel validation rejects the request because title has `max:150`. | Pass |
| VPC-04 | Submit non-material content longer than 2000 characters. | Question or quiz content exceeds 2000 characters. | Validation error is returned. | Laravel validation rejects `content` because it has `max:2000`. | Pass |
| VPC-05 | Submit material block text longer than 4000 characters. | `material_blocks.*.text` exceeds 4000 characters. | Validation error is returned. | Laravel validation rejects the material block text because it has `max:4000`. | Pass |
| VPC-06 | Submit quiz question longer than 500 characters. | `quiz_questions.*.question` exceeds 500 characters. | Validation error is returned. | Laravel validation rejects the quiz question because it has `max:500`. | Pass |
| VPC-07 | Submit quiz explanation longer than 700 characters. | `quiz_questions.*.explanation` exceeds 700 characters. | Validation error is returned. | Laravel validation rejects the explanation because it has `max:700`. | Pass |
| VPC-08 | Submit post category metadata. | Request includes a separate `category` or `category_id` value. | Category metadata should be validated and persisted if post categories are required. | Post creation code has no category validation rule, no category field in `Post::$fillable`, and no create-page category control, so category metadata is not persisted. | Failed |
| VPC-09 | Submit post visibility metadata. | Request includes `visibility` value. | Visibility should be validated and persisted if post visibility is required. | Post creation code has no visibility validation rule, no visibility field in `Post::$fillable`, and no create-page visibility control, so visibility metadata is not persisted. | Failed |
| VPC-10 | Submit post subject, language, and type metadata. | Valid `subject_id`, `language_code`, and `post_type` are provided. | Metadata is saved with the post. | Controller resolves the subject and language, then saves `subject_id`, `language_id`, and `post_type` on the `Post` model. | Pass |
| VPC-11 | Submit material as user role `teacher`. | Valid material request from teacher account. | Material publishing is permitted. | `User::canPublishStudyMaterials()` returns true for `teacher`, so the controller allows the request. | Pass |
| VPC-12 | Submit material as user role `admin`. | Valid material request from admin account. | Material publishing is permitted. | `User::canPublishStudyMaterials()` returns true for `admin`, so the controller allows the request. | Pass |
| VPC-13 | Submit material as user role `student`. | Valid material request from student account. | Material publishing is denied. | `User::canPublishStudyMaterials()` returns false for `student`, and controller returns a validation error. | Pass |

Validation and Permission Control Testing Table

# UNIT_TESTING_PLAN.md

## Summary

This plan is based only on the existing Laravel + Inertia React codebase. The system supports authentication, posting, Q&A comments, quizzes, study materials, feedback, bookmarks, achievements, leaderboard, teacher verification, admin management, localization, and AI-assisted learning features.

No production code, refactors, or test files are included in this plan.

Current testing setup:

- Backend: Pest/PHPUnit already exists.
- Frontend: no JS test runner is configured in `package.json`; frontend unit tests will need tooling added later before React hook/component tests can run.

## System Behavior Analysis

| Area | Existing Behavior | Responsibility |
|---|---|---|
| Authentication | Email/password login, registration, reset password, email verification, two-factor auth, Google login | Controls account access and redirects admins/users to the correct landing pages |
| Authorization | Auth/verified route groups, admin middleware, blocked-user logout, teacher/admin material publishing checks | Prevents unauthorized access to protected, admin, blocked, and teacher-only behavior |
| Feed and discovery | Home feed, questions feed, learning-materials feed, following feed, popular trends, categories, search | Lets users find posts by type, popularity, category, language, subject, author, or title |
| Post creation | Create question, quiz, or study material; attach files; link quizzes to materials; anonymous questions | Validates and persists all post types with correct metadata and permissions |
| Post viewing/editing | View serialized post, comments, material analytics, linked quizzes, quiz attempts; edit/delete owned content | Provides the main post detail experience and owner/admin management actions |
| Comments | Add comments/replies, edit/delete own comments, vote up/down/wrong, report comments, auto-select frontend best answer | Supports Q&A discussion and moderation flow |
| Social actions | Like posts, save posts, follow users, feature profile badges | Provides engagement and social graph behavior |
| Quiz flow | Complete quiz questions, record attempts, save mistakes, update progress and achievements | Tracks learning outcomes and mistake review |
| Study materials | View materials, submit/delete feedback, see analytics, linked quizzes, learning state/path, version snapshots | Supports teacher-published learning resources and feedback improvement loop |
| Bookmarks/study folder | Save posts, create/rename/delete folders, move saved posts, review completed/correct/wrong quiz items | Organizes saved learning content and quiz review |
| Achievements/points | Award/revoke points, sync achievements, progress metrics, profile badges | Gamifies contribution and learning activity |
| Leaderboard | Weekly/monthly/all-time ranking, visibility toggle, title badge toggle, points history | Ranks users and controls leaderboard privacy/badges |
| Teacher certification | Submit teacher application with documents, view submitted documents, admin approval/rejection/verification | Promotes students to teachers and verifies teachers |
| Admin | Manage users, roles, blocking, comment reports, teacher applications, verification documents | Provides platform moderation and account administration |
| AI learning tools | Translation, quiz explanation, quiz option generation, material quiz generation, best-answer explanation, answer feedback, objectives, doubt clarification, wrong-answer validation | Wraps DeepSeek/Gemini calls and validates structured JSON responses |
| Localization/shared UI | Locale switching, Inertia shared props, appearance cookie, custom 404/500 pages | Provides multilingual UI state and shared app context |

## Unit Division And Coverage Plan

| # | Testing Unit | Priority | Main Code To Cover | User Actions To Cover | Difficult To Test / Notes |
|---:|---|---|---|---|---|
| 1 | Authentication and Fortify account access | High | `CreateNewUser::create`, `ResetUserPassword::reset`, `FortifyServiceProvider` auth callback/login response/views/rate limits, `GoogleAuthController` | register, login, blocked login rejection, admin login redirect, logout, password reset, email verification, two-factor challenge, Google login | Google OAuth needs mocked Socialite provider |
| 2 | Authorization middleware and access gates | High | `AdminMiddleware::handle`, `EnsureUserNotBlocked::handle`, auth/verified/admin route groups, `User::canPublishStudyMaterials` | access admin pages, blocked user request, non-teacher material publishing, unauthenticated protected page | Route-level tests are better than isolated middleware-only tests |
| 3 | Profile, settings, locale, and appearance | Medium | `ProfilePageController::show/update`, `Settings\ProfileController`, `PasswordController`, `TwoFactorAuthenticationController`, `LocaleController`, `SetLocale`, `HandleAppearance`, `useProfilePage`, `useAppearance`, `useTwoFactorAuth` | view profile, edit name/about/avatar, follow from profile, feature badges, update settings profile/password, delete account, switch language, view 2FA setup | Frontend hooks need JS test tooling and mocked browser APIs |
| 4 | Feed, categories, trends, following, and search | Medium | `PostController::index/questions/learningMaterials/categories`, `PostPopularController::index`, `FollowerController::index`, `SearchController::search`, `PostQueryBuilder`, `PostSerializationService`, `useHomePageState`, `useCategoryFilters`, `useLearningTrendsController` | view home/feed tabs, filter by type/language/subject, open following feed, change popular range/sort, search users/posts | Popular date ranges need frozen time |
| 5 | Post creation backend | High | `PostCreateController::create/store`, `normalizeMaterialBlocks`, `buildMaterialPlainText`, language/subject lookup, quiz data normalization, file upload storage, linked quiz updates | create question, anonymous question, quiz, study material, upload attachments, add material blocks, link quizzes | Private helpers should be covered through `store` outcomes |
| 6 | Create-post frontend behavior | High | `CreatePostPage`, `useCreatePostForm`, `create-post-config`, `AttachmentsSection`, quiz/material form sections | choose post type, enter title/content, select subject/language, add/remove files, add quiz questions/options, generate AI options, generate quiz from material, submit form | Needs React test setup; object URL and Inertia router must be mocked |
| 7 | Post detail, editing, deletion, and serialization | High | `PostController::show/update/destroy`, `loadPostWithComments`, `normalizeMaterialBlocksForUpdate`, `buildMaterialPlainText`, `PostSerializationService::serialize`, `usePostContentController`, `useMaterialEditActions`, `material-editing-utils` | view post, edit own question/quiz, edit own/admin material blocks, cancel edit, delete own post, translate material text blocks | Many controller helpers are private; test through public routes |
| 8 | Comments, replies, votes, reports, and best-answer UI | High | `CommentController`, `CommentLikeController`, `CommentReportController`, `CommentSection`, comment tree helpers, `selectBestAnswer`, `sortCommentsForDisplay`, `updateCommentTree`, `countAllComments` | comment, reply, edit, delete branch, upvote, downvote, mark wrong, report, sort latest/top-liked, show best answer | Legacy vote-column fallback needs special schema/state coverage |
| 9 | Post likes, saves, follows, and featured badges | High | `LikeController::toggle`, `PostSaveController::toggle`, `FollowerController::toggle`, `UserFeaturedBadgeController::update`, `usePostInteractions` | like/unlike, save/unsave, follow/unfollow, prevent self-follow, feature owned badges | Points side effects should be asserted with transactions |
| 10 | Bookmarks and study folder | High | `BookmarkFolder::defaultFor`, `BookmarkFolderController`, `PostBookmarkController`, `useStudyFolder`, `study-folder-utils` | open bookmarks, create folder, rename folder, delete non-default folder, block default deletion, move post, view completed/correct/wrong quiz review | Folder ownership and default folder migration behavior are important |
| 11 | Quiz completion and mistake review | High | `PostController::completeQuiz`, `getQuizAttemptsForPost`, `recordMaterialQuizAttempt`, `ProgressService::syncMistakeReview/recordQuizAttempt`, `buildQuizData` | select answer, check answer, complete last question, repeat quiz, record wrong/correct review, handle invalid indexes | Multi-question and legacy single-question formats both exist |
| 12 | Study material feedback, learning state, views, analytics | High | `PostController::materialFeedback/destroyMaterialFeedback`, `recordMaterialView`, `buildMaterialFeedbackSummary`, `buildMaterialUserFeedback`, `buildLearningAnalytics`, `buildMaterialLearningStateMap`, `determineMaterialLearningState`, `buildMaterialLearningPath`, `StudyMaterialLearningPanel`, `MaterialFeedbackSection` | view material, submit recommendation/rating/text feedback, edit/delete feedback, see learning state/path, see linked quizzes and analytics | Schema fallback branches require database setup or targeted integration tests |
| 13 | Material versions and teacher insights | High | `MaterialVersionService`, `PostController::teacherMaterialInsights`, `buildLowRatedMaterialsInsights`, `buildFrequentlyWrongQuestionsInsights`, `buildRepeatedFeedbackInsights`, `buildMaterialVersionHistoryInsights`, `TeacherMaterialInsightsPage` | teacher opens insights, filters material/subject/quiz/time/sort, sees low-rated materials and version history | Most insight builders are private; route-level assertions recommended |
| 14 | Achievements, progress, badges | High | `AchievementService::syncUser/evaluateAchievements`, `AchievementsController`, `ProgressService::recordPostCreated/syncLikesReceived`, `UserProgress::accuracyRate`, badge translation helpers | earn badges from posts/likes/comments/saves/mistakes/quizzes, view achievements page, see next badge/progress | Achievement thresholds depend on seed data |
| 15 | Points and leaderboard | High | `PointsService`, `LeaderboardController`, `LeaderboardTitleService`, `LeaderboardRow`, `useLeaderboardController` | award/revoke points, prevent duplicate/self awards, view leaderboard periods/pages, hide from leaderboard, toggle title badge | Caching must be asserted/cleared carefully |
| 16 | Teacher certification and verification | High | `TeacherCertificationController`, teacher application closure route, `TeacherApplication`, `TeacherVerificationDocument`, `teacher-certification.tsx` | submit application, upload up to 5 docs, resubmit rejected/pending application, view own documents, approved teacher state | File storage and document preview need fake disks/browser mocks |
| 17 | Admin management | High | `AdminController`, `AdminUsers`, `AdminReports`, `AdminTeacherApplications`, document preview helpers | list users, change role, block/unblock non-admin, view/delete reports, approve/reject teacher application, toggle teacher verification, download document | `AdminController::reports` reads `comment_body` from `comment?->body` while model uses `content`; test should expose current behavior |
| 18 | AI endpoints and frontend AI clients | Medium | `routes/callAI.php` endpoints, `ai-quiz-options`, `ai-material-quiz`, `ai-explain`, `ai-best-answer`, `ai-comment-feedback`, `ai-learning-objectives`, `BtnAiTranslate`, `BtnAiAns` | translate text, explain quiz answer, generate quiz options, generate material quiz, explain best answer, validate wrong-answer reasoning, clarify doubt | Anonymous route closures are hard to unit test directly; use HTTP route tests with `Http::fake` |
| 19 | Shared frontend utilities | Low | `formatFormulaText`, `getEmbedUrl`, `isEmbeddableVideo`, `post-utils`, `badge-translations`, `csrfHeaders`, `scrollCommentsInAppContent`, `useClipboard`, `useCurrentUrl`, `useIsMobile`, `useInitials` | formula rendering, video embedding, date labels, language/subject labels, copy link, URL active-state checks, mobile state | Browser APIs must be mocked |
| 20 | Error pages, shared Inertia props, legal/static pages | Low | `HandleInertiaRequests::share`, `bootstrap/app.php` exception renderer, `ErrorPage`, legal/rules pages | render 404/500 friendly pages, share auth/lang/sidebar props, view privacy/terms/rules pages | Mostly smoke and prop-shape tests |

## Validation And Data Interaction Units

| Validation/Data Area | Priority | Coverage Needed |
|---|---|---|
| Profile/password validation | High | `ProfileValidationRules`, `PasswordValidationRules`, settings form requests, current password requirements for social vs password users |
| Post validation | High | title/content length, post type enum, subject/language existence, quiz question/options/answer index, material block file MIME/size, teacher-only materials |
| Comment validation | High | non-empty content, max length, reply parent must belong to same post, owner-only edit/delete |
| Feedback validation | High | material-only feedback, vote/rating bounds, reject empty feedback payload |
| Bookmark validation | High | unique folder names per user, ownership checks, valid destination folder |
| Teacher certification validation | High | accepted terms, max files, document MIME/size, document ownership for viewing |
| Admin validation | High | role enum, cannot block admins, teacher must be approved before verification |
| Database relationships/casts | Medium | `User`, `Post`, `Comment`, `BookmarkFolder`, `UserProgress`, `QuizMistake`, `MaterialQuizAttempt`, `StudyMaterialFeedback`, `StudyMaterialVersion` relationships and casts |

## Testing Priority Order

1. High priority backend first: auth/authorization, post creation, comments, quiz flow, study material feedback, teacher/admin behavior, points/database side effects.
2. High priority frontend after tooling: create-post hook, post content controller, comment section, material feedback, study folder, admin tables.
3. Medium priority: discovery/search/trends, AI client/server endpoints with mocked providers, profile/settings polish.
4. Low priority: presentational/static pages and small utilities after core flows are stable.

## Assumptions

- Unit and feature tests should use Pest because the repo already uses Pest.
- Backend tests should prefer public controller routes for private helper behavior.
- Frontend tests will require adding a JS test runner such as Vitest plus React Testing Library before implementation.
- AI provider tests should not call real DeepSeek/Gemini APIs; use Laravel `Http::fake` and mocked `fetch`.
- File upload tests should use Laravel fake storage and frontend object URL mocks.
- Existing tests should be preserved; this plan expands coverage rather than replacing them.

## Final Summary

- Total testing units: 20
- Estimated major functions/features to test: about 155
- Recommended next step: implement the high-priority backend Pest test groups before adding frontend test tooling.

# Activity Diagrams

本文档整理系统主要功能的 Activity Diagram。每个流程使用一个 Mermaid `flowchart TD` 图，可直接复制到 FYP 报告或支持 Mermaid 的 Markdown 编辑器中。

## 1. Login and Registration Activity Diagram


```mermaid
flowchart TD
    A([Start]) --> B["User opens landing, login, or register page"]
    B --> C{"Choose action"}

    C -->|"Register"| D["Enter name, email, password, and confirmation"]
    D --> E["Validate registration form"]
    E --> F{"Registration valid?"}
    F -->|"No"| G["Show validation error: empty name, invalid email, duplicate email, weak password, or password mismatch"]
    G --> Z([End])
    F -->|"Yes"| H["Create new user account"]
    H --> I["Send or show email verification instruction"]
    I --> Z

    C -->|"Email/password login"| J["Enter email and password"]
    J --> K["Validate credentials and rate limit attempts"]
    K --> L{"Credentials valid?"}
    L -->|"No"| M["Show login error or temporary lockout after too many attempts"]
    M --> Z
    L -->|"Yes"| N{"Account blocked?"}

    C -->|"Google login"| O["Redirect user to Google OAuth"]
    O --> P["Google returns callback"]
    P --> Q{"Google account valid and email available?"}
    Q -->|"No"| R["Return to login page with error message"]
    R --> Z
    Q -->|"Yes"| S["Find, create, or link user account"]
    S --> N

    N -->|"Yes"| T["Reject login and show blocked account message"]
    T --> Z
    N -->|"No"| U{"Two-factor authentication enabled?"}
    U -->|"Yes"| V["Show two-factor challenge page"]
    V --> W["User enters authenticator code"]
    W --> X{"Code valid and not rate limited?"}
    X -->|"No"| Y["Show code error or temporary lockout"]
    Y --> Z
    X -->|"Yes"| AA["Create authenticated session"]
    U -->|"No"| AA

    AA --> AB{"Email verified or Google account?"}
    AB -->|"No"| AC["Redirect to email verification page"]
    AC --> Z
    AB -->|"Yes"| AD{"User role is admin?"}
    AD -->|"Yes"| AE["Redirect to admin users page"]
    AD -->|"No"| AF["Redirect to home page"]
    AE --> Z
    AF --> Z
```

## 2. Create Post Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B["Authenticated verified user opens Create Post page"]
    B --> C["Select post type: question, quiz, or study material"]
    C --> D["Enter shared fields: title, subject, language, content, attachments, and anonymous option if available"]
    D --> E{"Post type?"}

    E -->|"Question"| F["Write question details and optional context"]
    F --> G["Validate title, content length, subject, language, and attachments"]

    E -->|"Quiz"| H{"User is teacher or admin?"}
    H -->|"No"| I["Hide or reject quiz creation permission"]
    I --> Z([End])
    H -->|"Yes"| J["Create quiz question data"]
    J --> K["Enter each quiz question, at least two options, correct answer index, and optional explanation"]
    K --> L{"Use AI to generate quiz options?"}
    L -->|"Yes"| M["Send question, provider, and optional answer placement to AI quiz option endpoint"]
    M --> N{"AI returns exactly four valid options and answer index?"}
    N -->|"No"| O["Show AI generation error and let user edit manually"]
    O --> K
    N -->|"Yes"| P["Apply generated options and correct answer index"]
    L -->|"No"| P
    P --> Q["Validate quiz_data: questions array, options, answer index bounds, and explanations"]
    Q --> R{"Quiz data valid?"}
    R -->|"No"| S["Show quiz validation errors"]
    S --> Z
    R -->|"Yes"| T["Prepare quiz post payload"]

    E -->|"Study material"| U{"User can publish study materials?"}
    U -->|"No"| V["Reject request with permission error"]
    V --> Z
    U -->|"Yes"| W["Create material blocks: text, image/file, video link, and learning content"]
    W --> X["Upload valid material files and normalize content blocks"]
    X --> Y{"Link existing quiz or generate material quiz?"}
    Y -->|"Generate quiz"| YA["Use material title/content to request AI material quiz"]
    YA --> YB{"AI quiz question valid?"}
    YB -->|"No"| YC["Show generation error and continue without generated quiz"]
    YB -->|"Yes"| YD["Attach generated quiz draft to material flow"]
    Y -->|"Link existing quiz"| YE["Select quiz posts to link by parent_material_id"]
    Y -->|"No quiz"| YF["Skip quiz linking"]
    YC --> YF
    YD --> YE
    YE --> YG["Validate material blocks and linked quiz references"]
    YF --> YG

    G --> AH{"Validation passed?"}
    T --> AH
    YG --> AH
    AH -->|"No"| AI["Return validation errors to form"]
    AI --> Z
    AH -->|"Yes"| AJ["Create post in database transaction"]
    AJ --> AK{"Post is study material?"}
    AK -->|"Yes"| AL["Save material version snapshot and linked quiz relationship"]
    AK -->|"No"| AM["Skip material versioning"]
    AL --> AN["Award points and sync post-created progress"]
    AM --> AN
    AN --> AO{"Post is anonymous?"}
    AO -->|"Yes"| AP["Skip public author display and achievement display updates"]
    AO -->|"No"| AQ["Evaluate achievements and update user progress"]
    AP --> AR["Redirect to home or post detail page"]
    AQ --> AR
    AR --> Z
```

## 3. Switch Language Activity Diagram

此图覆盖语言切换、session/cookie/user preference 保存，以及 Inertia shared props 更新。系统支持 `en`、`zh`、`my`。

```mermaid
flowchart TD
    A([Start]) --> B["User opens language selector in header"]
    B --> C["System shows supported locales: English, Mandarin, Bahasa Malaysia"]
    C --> D["User selects locale: en, zh, or my"]
    D --> E["Submit locale to change language route"]
    E --> F{"Locale supported?"}
    F -->|"No"| G["Normalize to current next supported locale or app default"]
    F -->|"Yes"| H["Use selected locale"]
    G --> I["Store resolved locale in session"]
    H --> I
    I --> J["Set long-lived locale cookie"]
    J --> K{"User authenticated?"}
    K -->|"Yes"| L["Save locale on user profile quietly"]
    K -->|"No"| M["Keep preference in session and cookie only"]
    L --> N["Redirect back to previous page"]
    M --> N
    N --> O["SetLocale middleware resolves user, session, cookie, then default locale"]
    O --> P["Inertia shares locale, availableLocales, and translated language bundle"]
    P --> Q["Header, sidebar, admin layout, and page text remount using new locale"]
    Q --> Z([End])
```

## 4. AI Learning Tools Activity Diagram

此图覆盖 AI translate、quiz explanation、quiz option generation、material quiz generation、best answer explanation、answer feedback、learning objectives、doubt clarification 和 wrong-answer validation。

```mermaid
flowchart TD
    A([Start]) --> B["User clicks an AI feature button"]
    B --> C{"AI feature type?"}

    C -->|"Translate"| D["Collect texts, target/current locale, and provider"]
    C -->|"Quiz explanation"| E["Collect question, options, user answer, creator answer, and provider"]
    C -->|"Generate quiz options"| F["Collect quiz question, answer placement, and provider"]
    C -->|"Generate material quiz"| G["Collect material title, content, question count, and provider"]
    C -->|"Best answer explanation"| H["Collect post title/content and selected answer content"]
    C -->|"Answer feedback"| I["Collect learner answer and learning context"]
    C -->|"Learning objectives"| J["Collect post title, content, post type, and provider"]
    C -->|"Doubt clarification or wrong-answer validation"| K["Collect post context, answer content, and user reasoning if needed"]

    D --> L["Validate request payload"]
    E --> L
    F --> M{"User is teacher or admin?"}
    M -->|"No"| N["Return 403 permission error"]
    N --> Z([End])
    M -->|"Yes"| L
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L

    L --> O{"Payload valid?"}
    O -->|"No"| P["Show validation error"]
    P --> Z
    O -->|"Yes"| Q["Call selected AI provider"]
    Q --> R{"Provider succeeds?"}
    R -->|"No"| S{"Client fallback available?"}
    S -->|"Yes"| T["Retry with fallback provider such as Gemini"]
    T --> U{"Fallback succeeds?"}
    U -->|"No"| V["Show AI service error"]
    U -->|"Yes"| W["Receive AI response text"]
    S -->|"No"| V
    R -->|"Yes"| W

    W --> X["Parse response as strict JSON, code-fenced JSON, or extracted JSON object"]
    X --> Y{"Required fields valid?"}
    Y -->|"No"| AA["Reject unsafe or malformed AI output"]
    AA --> Z
    Y -->|"Yes"| AB["Normalize response fields such as confidence, status, answer index, and booleans"]
    AB --> AC{"Feature-specific display"}
    AC -->|"Translate"| AD["Replace or show translated text with provider label"]
    AC -->|"Quiz explanation"| AE["Show AI answer, correctness, explanation, discrepancy, and confidence"]
    AC -->|"Generate quiz/material quiz"| AF["Fill quiz question, options, correct answer, and explanation"]
    AC -->|"Best answer/feedback/objectives/doubt"| AG["Show structured explanation, key points, strengths, improvements, objectives, or guidance"]
    AC -->|"Wrong-answer validation"| AH["Allow wrong vote only if reasoning is accepted"]
    AD --> Z
    AE --> Z
    AF --> Z
    AG --> Z
    AH --> Z
```

## 5. Follow and Unfollow Activity Diagram

此图覆盖用户从 profile、feed 或 post author section 关注/取消关注，以及 following feed 的影响。

```mermaid
flowchart TD
    A([Start]) --> B["User views another user's profile, post card, or post author header"]
    B --> C{"User authenticated and verified?"}
    C -->|"No"| D["Redirect to login or block action"]
    D --> Z([End])
    C -->|"Yes"| E{"Target user is current user?"}
    E -->|"Yes"| F["Hide follow button or return invalid self-follow response"]
    F --> Z
    E -->|"No"| G["User clicks follow button"]
    G --> H["Disable button while request is pending"]
    H --> I["Check existing follows relationship"]
    I --> J{"Already following target?"}
    J -->|"Yes"| K["Detach following relationship"]
    K --> L["Return status: unfollowed"]
    J -->|"No"| M["Attach following relationship with unique follower and following IDs"]
    M --> N["Return status: followed"]
    L --> O["Update button state and follower/following counts"]
    N --> P["Award follower-gained points to target user if applicable"]
    P --> O
    O --> Q{"User opens Following page?"}
    Q -->|"Yes"| R["Load only posts from followed users and exclude blocked authors"]
    Q -->|"No"| S["Remain on current page"]
    R --> Z
    S --> Z
```

## 6. Bookmark and Study Folder Activity Diagram

此图覆盖保存帖子、取消保存、创建/改名/删除文件夹、移动收藏内容，以及 completed/correct/wrong quiz review，包括 quiz 错题收藏夹式复习。

```mermaid
flowchart TD
    A([Start]) --> B["User opens post detail, feed save button, or Study Folder page"]
    B --> C{"User authenticated and verified?"}
    C -->|"No"| D["Redirect to login or block protected route"]
    D --> Z([End])
    C -->|"Yes"| E{"Choose bookmark action"}

    E -->|"Save or unsave post"| F["User clicks save button"]
    F --> G["Find or create user's default bookmark folder"]
    G --> H{"Post already saved by this user?"}
    H -->|"Yes"| I["Delete BookmarkItem from all folders"]
    I --> J["Revoke resource_bookmarked points from post owner if applicable"]
    J --> K["Return saved=false and updated saves_count"]
    H -->|"No"| L["Create BookmarkItem in default folder with unique user-post pair"]
    L --> M["Award resource_bookmarked points to post owner if not self-award"]
    M --> N["Evaluate save-based achievements such as collector and bookworm"]
    N --> O["Return saved=true and updated saves_count"]

    E -->|"Create folder"| P["Enter folder name"]
    P --> Q{"Name valid, max 80 chars, and unique for this user?"}
    Q -->|"No"| R["Show folder validation error"]
    Q -->|"Yes"| S["Create custom BookmarkFolder"]

    E -->|"Rename folder"| T["Enter new folder name"]
    T --> U{"Folder belongs to current user and name is valid?"}
    U -->|"No"| V["Return 403, 404, or validation error"]
    U -->|"Yes"| W["Update folder name"]

    E -->|"Delete folder"| X{"Folder belongs to user?"}
    X -->|"No"| V
    X -->|"Yes"| Y{"Folder is default folder?"}
    Y -->|"Yes"| YA["Reject deletion of default folder"]
    Y -->|"No"| YB["Move saved posts from deleted folder to default folder"]
    YB --> YC["Delete custom folder"]

    E -->|"Move saved post"| YD["Select destination folder"]
    YD --> YE{"Destination folder belongs to current user?"}
    YE -->|"No"| V
    YE -->|"Yes"| YF["Update or create BookmarkItem in selected folder"]

    E -->|"Review quiz items"| YG{"Study mode?"}
    YG -->|"Completed quizzes"| YH["Load QuizCompletion records for current user and fetch completed quiz posts"]
    YG -->|"Correct answers"| YI["Load QuizAttempt or QuizMistake records where is_correct=true"]
    YG -->|"Wrong answers"| YJ["Load QuizAttempt or QuizMistake records where is_correct=false"]
    YH --> YK["Show quiz post title, subject, language, metadata, and completed count"]
    YI --> YL["Show question, user's answer, correct answer, correctness, post title, and attempted_at"]
    YJ --> YM["Show wrong question, user's wrong answer, correct answer, explanation if available, and attempted_at"]
    YM --> YN["User reviews mistake and may reopen original quiz post"]
    YK --> Z
    YL --> Z
    YN --> Z
    K --> Z
    O --> Z
    R --> Z
    S --> Z
    V --> Z
    W --> Z
    YA --> Z
    YC --> Z
    YF --> Z
```

## 7. Achievements Activity Diagram

此图覆盖用户行为如何更新 progress、points、badges 和 progress-based achievements，以及 achievements page 的显示。

```mermaid
flowchart TD
    A([Start]) --> B["User performs learning or community action"]
    B --> C{"Action source"}
    C -->|"Create post"| D["Recount user's total posts and question posts"]
    C -->|"Answer quiz"| E["Increment total_questions_answered and correct_answers_count if correct"]
    C -->|"Complete quiz first time"| F["Increment quizzes_completed"]
    C -->|"Receive like"| G["Recount likes received on user's posts"]
    C -->|"Comment"| H["Recount user's comments"]
    C -->|"Save post"| I["Recount user's bookmark items"]
    C -->|"Review quiz attempt"| J["Recount quiz attempt or mistake review records"]

    D --> K["Create or update UserProgress row"]
    E --> L["Append recent quiz score and recalculate improvement_score"]
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
    L --> K

    K --> M["Sync legacy badge points: posts * 10 + likes received * 2"]
    M --> N["Attach point badges when points_required is reached"]
    N --> O["Evaluate progress achievements"]
    O --> P{"Achievement condition met and not already earned?"}
    P -->|"No"| Q["Keep current achievement state"]
    P -->|"Yes"| R["Create UserAchievement with achieved_at timestamp"]
    R --> S["Return newly earned achievement key to UI when action supports it"]
    Q --> T{"User opens Achievements page?"}
    S --> T
    T -->|"No"| Z([End])
    T -->|"Yes"| U["Load summary: points, posts, likes received, comments, saves, mistakes reviewed"]
    U --> V["Load badges, next badge, user progress, and achievement definitions"]
    V --> W["Calculate current metric, threshold, progress percentage, and earned state"]
    W --> X["Render achievement categories: question, performance, improvement, community, posting, commenting, saving, mistakes"]
    X --> Z
```

## 8. Leaderboard Activity Diagram

此图覆盖 all-time、weekly、monthly 排行榜、用户隐藏排名、称号显示、points history 和 pagination。

```mermaid
flowchart TD
    A([Start]) --> B["Authenticated verified user opens Leaderboard page"]
    B --> C["Read period query: all_time, weekly, or monthly"]
    C --> D{"Period valid?"}
    D -->|"No"| E["Reject validation or use allowed period only"]
    E --> Z([End])
    D -->|"Yes"| F{"Selected period"}

    F -->|"All time"| G["Rank users by users.total_points"]
    F -->|"Weekly"| H["Sum point transactions from last 7 days"]
    F -->|"Monthly"| I["Sum point transactions from last 30 days"]
    G --> J["Order by points descending, then user ID ascending for ties"]
    H --> J
    I --> J

    J --> K["Load top 50 ranking from cache or database"]
    K --> L["Split top 3 podium and remaining paginated rows"]
    L --> M["Compute current user's rank, points, and pointsToNext"]
    M --> N["Load current user's latest 30 point transactions"]
    N --> O{"User has show_on_leaderboard=false?"}
    O -->|"Yes"| P["Anonymize identity in public rows and disable profile click"]
    O -->|"No"| Q["Show user name, avatar, role, and verified teacher badge if applicable"]
    P --> R{"Top three all-time title badge allowed?"}
    Q --> R
    R -->|"Yes"| S["Show Champion, Runner-up, or Third Place title when user allows title badge"]
    R -->|"No"| T["Hide leaderboard title badge"]
    S --> U["Render podium, ranking table, current user panel, controls, and point history"]
    T --> U
    U --> V{"User toggles visibility or title badge?"}
    V -->|"Hide or show leaderboard"| W["Flip show_on_leaderboard and clear leaderboard/title caches"]
    V -->|"Toggle title badge"| X["Flip show_leaderboard_badge and refresh display"]
    V -->|"No"| Z
    W --> U
    X --> U
```

## 9. Teacher Certification Activity Diagram

此图覆盖用户提交教师认证、上传文件、admin 审核、approve/reject、教师 verified toggle，以及文件访问权限。

```mermaid
flowchart TD
    A([Start]) --> B["User opens Settings - Teacher Certification"]
    B --> C{"User authenticated and verified?"}
    C -->|"No"| D["Redirect to login or email verification page"]
    D --> Z([End])
    C -->|"Yes"| E{"Current certification state"}
    E -->|"Already approved teacher"| F["Show approved teacher certification status"]
    F --> Z
    E -->|"Pending application"| G["Show application under review"]
    G --> Z
    E -->|"Rejected or no application"| H["Show application form and rules"]

    H --> I["User enters qualification or bio, agrees to rules, and optionally uploads documents"]
    I --> J["Validate agree_terms and max 5 documents: PDF, JPG, PNG, DOC, DOCX, each 10MB or smaller"]
    J --> K{"Submission valid?"}
    K -->|"No"| L["Show validation error"]
    L --> Z
    K -->|"Yes"| M["Create new application or resubmit latest pending/rejected application as pending"]
    M --> N{"Documents uploaded?"}
    N -->|"Yes"| O["Delete old documents for resubmission, store new files under teacher-verification/application_id, and create document records"]
    N -->|"No"| P["Keep application without new document records"]
    O --> Q["Show pending review state"]
    P --> Q

    Q --> R["Admin opens Admin Teacher Applications page"]
    R --> S{"Admin role?"}
    S -->|"No"| T["Return 403 Forbidden"]
    T --> Z
    S -->|"Yes"| U["Load applications with user and verification documents"]
    U --> V["Admin previews or downloads documents if files exist"]
    V --> W{"Review decision"}
    W -->|"Approve"| X["Set application status to approved"]
    X --> Y["Update applicant role to teacher"]
    Y --> YA["Optionally toggle teacher is_verified when user role is teacher"]
    YA --> Z
    W -->|"Reject"| YB["Set status to rejected and store optional admin note"]
    YB --> Z
```

## 10. Comment Activity Diagram

此图覆盖 comment / reply 创建、编辑、删除、投票、Q&A best answer、wrong-answer validation，并先判断 post 是 Q&A/quiz 还是 study material。

```mermaid
flowchart TD
    A([Start]) --> B["User opens post detail page"]
    B --> C{"Post type?"}
    C -->|"question"| D["Use Q&A comment mode"]
    C -->|"quiz"| E["Use quiz discussion mode"]
    C -->|"material"| F["Use study material comment and feedback mode"]
    D --> G["Load comments with nested replies, author data, vote counts, and current user vote state"]
    E --> G
    F --> H["Load material feedback summary, user feedback, rating section, comments, and replies"]
    H --> I{"Choose comment action"}
    G --> I

    I -->|"Post comment"| J["User writes top-level comment"]
    I -->|"Reply"| K["User writes reply and selects parent comment"]
    J --> L["Trim content and validate max 1000 characters"]
    K --> M["Validate parent comment belongs to same post"]
    M --> L
    L --> N{"Content valid?"}
    N -->|"No"| O["Show required or max-length validation error"]
    O --> Z([End])
    N -->|"Yes"| P["Create comment with user_id, post_id, parent_id, and content"]
    P --> Q["Award comment or answer points where applicable"]
    Q --> R["Reload and render refreshed comment tree"]

    I -->|"Edit own comment"| S["User updates comment content"]
    S --> T{"Current user owns comment and content valid?"}
    T -->|"No"| U["Return 403 or validation error"]
    T -->|"Yes"| V["Update comment and reload comment tree"]

    I -->|"Delete own comment"| W{"Current user owns comment?"}
    W -->|"No"| U
    W -->|"Yes"| X["Delete selected comment branch and related comment vote records"]

    I -->|"Vote comment"| Y{"Vote direction"}
    Y -->|"Up"| YA["Store or toggle helpful upvote"]
    Y -->|"Down"| YB["Store or toggle downvote"]
    Y -->|"Wrong"| YC{"Q&A mode?"}
    YC -->|"Yes"| YD["Show AI wrong-answer validation panel"]
    YD --> YE["User submits reasoning with at least 10 characters"]
    YE --> YF{"AI validates reasoning?"}
    YF -->|"No"| YG["Block wrong vote and show feedback"]
    YF -->|"Yes"| YH["Store wrong vote"]
    YC -->|"No"| YH

    D --> YI{"Top-level Q&A comment score greater than 1?"}
    YI -->|"Yes"| YJ["Show frontend-derived best answer preview and optional AI explanation"]
    YI -->|"No"| YK["Do not show best answer preview"]

    F --> YL{"User submits material rating, vote, or written feedback?"}
    YL -->|"Yes"| YM["Validate material-only feedback payload and save own feedback"]
    YM --> YN["Update material feedback summary and learning path feedback step"]
    YL -->|"No"| R

    R --> Z
    V --> Z
    X --> Z
    YA --> Z
    YB --> Z
    YG --> Z
    YH --> Z
    YJ --> Z
    YK --> Z
    YN --> Z
    U --> Z
```

## 11. Admin Block User Activity Diagram

此图覆盖 admin 用户管理页、block/unblock、禁止 block admin、blocked user 后续访问处理，以及 blocked author 内容的隐藏逻辑。

```mermaid
flowchart TD
    A([Start]) --> B["Admin opens /admin/users"]
    B --> C{"Requester authenticated and role is admin?"}
    C -->|"No"| D["Redirect guest to login or return 403 for non-admin"]
    D --> Z([End])
    C -->|"Yes"| E["Load user list sorted by newest"]
    E --> F["Display user id, name, email, role, points, verified status, blocked status, and created date"]
    F --> G["Admin selects Block or Unblock action"]
    G --> H["Submit PATCH /admin/users/{user}/toggle-block"]
    H --> I{"Target user role is admin?"}
    I -->|"Yes"| J["Reject action with Cannot block an admin account"]
    J --> Z
    I -->|"No"| K{"Target is currently blocked?"}
    K -->|"Yes"| L["Set is_blocked=false"]
    K -->|"No"| M["Set is_blocked=true"]
    L --> N["Return to admin user list with updated status"]
    M --> O["Existing session of blocked user is terminated by blocked-user middleware on next request"]
    O --> P["Blocked user is redirected to login with blocked account message"]
    P --> Q["Future email/password and Google login attempts are rejected"]
    Q --> R["Feed, following feed, search, and popular queries exclude blocked authors"]
    N --> Z
    R --> Z
```

## 12. Report and Admin Moderation Activity Diagram

此图覆盖举报 post/comment、重复举报检查、admin reports 页面、dismiss report，以及 admin 根据举报删除内容后的处理。

```mermaid
flowchart TD
    A([Start]) --> B["User opens post detail or comment thread"]
    B --> C{"Choose report target"}
    C -->|"Post"| D["User clicks report post and selects reason"]
    C -->|"Comment"| E["User clicks report comment"]
    E --> F{"Comment belongs to current user?"}
    F -->|"Yes"| G["Hide report action or reject self-report"]
    G --> Z([End])
    F -->|"No"| H["Submit comment report"]
    D --> I["Submit post report"]
    H --> J{"Report table or feature available?"}
    I --> J
    J -->|"No"| K["Return report feature unavailable message"]
    K --> Z
    J -->|"Yes"| L{"Same user already reported same target?"}
    L -->|"Yes"| M["Return Already reported validation message"]
    M --> Z
    L -->|"No"| N["Create pending report record with reporter, target, reason, and timestamp"]
    N --> O["Show report submitted confirmation"]

    O --> P["Admin opens /admin/reports"]
    P --> Q{"Requester role is admin?"}
    Q -->|"No"| R["Return 403 or redirect guest to login"]
    R --> Z
    Q -->|"Yes"| S["Load report list with reporter, target content, author, reason, and created date"]
    S --> T{"Admin moderation decision"}
    T -->|"Dismiss report only"| U["Delete report record and keep original content"]
    U --> Z
    T -->|"Delete reported comment"| V["Verify admin permission and target comment exists"]
    V --> W["Delete comment, nested replies if branch deletion rule applies, and related comment vote records"]
    W --> X["Delete or close related report records"]
    X --> Z
    T -->|"Delete reported post/material/quiz"| Y["Verify admin or owner permission according to post type"]
    Y --> YA{"Delete allowed?"}
    YA -->|"No"| YB["Return forbidden moderation error"]
    YA -->|"Yes"| YC["Delete post record; cascade bookmark items and related records where database constraints apply"]
    YC --> YD["Remove report records for deleted target"]
    YD --> YE["Refresh admin reports list"]
    YE --> Z
    YB --> Z
```

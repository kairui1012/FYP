# Core Activity and Sequence Diagrams

本文档整理本系统最重要的 6 个核心流程。每个流程都包含一个 Activity Diagram 和一个 Sequence Diagram，可直接用于 FYP 报告的系统设计章节。

## 1. User Authentication and Access Control

该流程覆盖用户登录、Google 登录回调、身份验证、邮箱验证，以及 blocked user / admin middleware 等访问控制。

### Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B[User opens landing or login page]
    B --> C{Choose login method}
    C -->|Email and password| D[Submit login credentials]
    C -->|Google login| E[Redirect to Google OAuth]
    E --> F[Google returns callback]
    D --> G[Validate credentials]
    F --> G
    G --> H{Authentication successful?}
    H -->|No| I[Show login error]
    I --> Z([End])
    H -->|Yes| J{Email verified?}
    J -->|No| K[Redirect to email verification page]
    K --> Z
    J -->|Yes| L{User blocked?}
    L -->|Yes| M[Deny access and show blocked message]
    M --> Z
    L -->|No| N[Create session]
    N --> O{User is admin?}
    O -->|Yes| P[Allow admin routes]
    O -->|No| Q[Allow student or teacher routes]
    P --> Z
    Q --> Z
```

### Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant AuthPage as Login/Register UI
    participant Fortify as Laravel Fortify/Auth
    participant Google as Google OAuth
    participant UserModel as User Model
    participant Session as Session/Middleware

    User->>AuthPage: Open login page
    alt Email/password login
        User->>AuthPage: Submit email and password
        AuthPage->>Fortify: POST login request
    else Google login
        User->>AuthPage: Click Google login
        AuthPage->>Google: Redirect to OAuth provider
        Google-->>Fortify: Return callback data
    end
    Fortify->>UserModel: Find or create authenticated user
    UserModel-->>Fortify: User record
    Fortify->>Session: Create authenticated session
    Session->>Session: Check verified, blocked, and role middleware
    alt Valid access
        Session-->>User: Redirect to home or admin page
    else Invalid access
        Session-->>User: Return error or verification page
    end
```

## 2. Browse, Filter, and View Learning Content

该流程覆盖主页 feed、questions page、learning materials page、categories/search，以及打开 post detail 后加载评论、收藏状态、点赞状态、学习材料浏览记录和教师 analytics。

### Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B[User opens home, questions, materials, categories, or search page]
    B --> C[System receives filters: post type, language, subject, keyword]
    C --> D[Build post query with standard relations and counts]
    D --> E[Exclude blocked users and apply filters]
    E --> F{Posts found?}
    F -->|No| G[Show empty state]
    G --> Z([End])
    F -->|Yes| H[Serialize posts with user flags]
    H --> I[Render post cards]
    I --> J[User opens a post detail page]
    J --> K[Load post, author, subject, language, likes, saves, and comments]
    K --> L{Post is study material?}
    L -->|No| M[Render normal post detail]
    L -->|Yes| N[Record material view]
    N --> O[Load feedback summary, linked quizzes, learning state, and analytics if teacher]
    O --> P[Render material detail page]
    M --> Z
    P --> Z
```

### Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Page as Feed/Search UI
    participant PostController as PostController
    participant QueryBuilder as PostQueryBuilder
    participant Serializer as PostSerializationService
    participant DB as Database
    participant Progress as LearningProgressService

    User->>Page: Open feed/search page with filters
    Page->>PostController: GET /homePage, /questions, /learning-materials, /categories, or /search
    PostController->>QueryBuilder: Build query with filters and user flags
    QueryBuilder->>DB: Query posts, relations, counts, likes, saves
    DB-->>QueryBuilder: Paginated posts
    QueryBuilder-->>PostController: Post collection
    PostController->>Progress: Build learning overview or material states
    Progress->>DB: Read user progress and material activity
    DB-->>Progress: Progress data
    PostController->>Serializer: Serialize posts for Inertia
    Serializer-->>PostController: Frontend-ready post data
    PostController-->>Page: Render Inertia page
    Page-->>User: Display content list
```

## 3. Create Question, Quiz, or Study Material

该流程覆盖 `POST /posts`，包括学生创建 question/quiz、教师或 admin 发布 study material、文件上传、材料 blocks、linked quizzes、积分、成就和 progress 更新。

### Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B[User opens create post page]
    B --> C[Select post type: question, quiz, or material]
    C --> D[Enter title, subject, language, content, files, quiz questions, or material blocks]
    D --> E[Submit form]
    E --> F[Validate request fields]
    F --> G{Validation passed?}
    G -->|No| H[Return validation errors]
    H --> Z([End])
    G -->|Yes| I{Post type is material?}
    I -->|Yes| J{User can publish study materials?}
    J -->|No| K[Reject with permission error]
    K --> Z
    J -->|Yes| L[Normalize material blocks and upload material files]
    I -->|No| M{Content or quiz data valid?}
    M -->|No| H
    M -->|Yes| N[Prepare normal post or quiz data]
    L --> O[Create post in database transaction]
    N --> O
    O --> P{Material has linked quizzes?}
    P -->|Yes| Q[Attach quizzes to material]
    P -->|No| R[Skip quiz linking]
    Q --> S[Create material version snapshot if material]
    R --> S
    S --> T[Award points]
    T --> U{Anonymous post?}
    U -->|Yes| V[Skip achievement and post progress sync]
    U -->|No| W[Sync achievements and record post-created progress]
    V --> X[Redirect to home page]
    W --> X
    X --> Z
```

### Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Form as CreatePostPage
    participant Controller as PostCreateController
    participant Storage as Laravel Storage
    participant PostModel as Post Model
    participant Version as MaterialVersionService
    participant Points as PointsService
    participant Progress as Progress/Achievement Services
    participant DB as Database

    User->>Form: Fill create post form
    Form->>Controller: POST /posts
    Controller->>Controller: Validate title, type, subject, language, files, quiz/material rules
    alt Study material
        Controller->>Controller: Check teacher/admin publishing permission
        Controller->>Storage: Store material image/document files
        Storage-->>Controller: Stored file paths
        Controller->>Controller: Build content_blocks and plain text content
    else Question or quiz
        Controller->>Controller: Validate content or quiz questions
        Controller->>Storage: Store optional attachments
    end
    Controller->>DB: Begin transaction
    Controller->>PostModel: Create post
    PostModel->>DB: Insert post record
    DB-->>PostModel: Created post
    Controller->>DB: Commit transaction
    alt Material with linked quizzes
        Controller->>PostModel: Update selected quizzes parent_material_id
        PostModel->>DB: Save quiz-material links
    end
    alt Material
        Controller->>Version: Create material version snapshot
    end
    Controller->>Points: Award resource_uploaded or question_asked points
    Controller->>Progress: Sync achievements and progress if not anonymous
    Controller-->>Form: Redirect to home page with success
```

## 4. Comment, Vote, Bookmark, and Report Content

该流程覆盖学习社区的核心互动：评论、回复、评论投票、收藏到 folder，以及举报 post/comment 进入管理员审核队列。

### Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B[User opens post detail]
    B --> C{Choose interaction}
    C -->|Comment or reply| D[Enter comment content]
    D --> E[Validate content and optional parent comment]
    E --> F{Valid?}
    F -->|No| G[Show validation error]
    F -->|Yes| H[Create comment and award answer points]
    H --> I[Refresh comment tree]
    C -->|Vote comment| J[Toggle comment vote]
    J --> K[Update vote record and points]
    C -->|Bookmark post| L[Find or create default bookmark folder]
    L --> M{Already bookmarked?}
    M -->|Yes| N[Remove bookmark and revoke bookmark points]
    M -->|No| O[Create bookmark and award bookmark points to post owner]
    C -->|Report content| P[Select report reason]
    P --> Q{Already reported?}
    Q -->|Yes| R[Return already reported message]
    Q -->|No| S[Create pending report and queue moderation job]
    G --> Z([End])
    I --> Z
    K --> Z
    N --> Z
    O --> Z
    R --> Z
    S --> Z
```

### Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant PostUI as PostContent UI
    participant CommentController as CommentController
    participant BookmarkController as PostBookmarkToggleController
    participant ReportController as PostReport/CommentReport Controller
    participant Points as PointsService
    participant Jobs as Moderation Queue Job
    participant DB as Database

    User->>PostUI: Interact with post
    alt Submit comment or reply
        PostUI->>CommentController: POST /posts/{post}/comments
        CommentController->>CommentController: Validate content and parent_id
        CommentController->>DB: Insert comment
        CommentController->>Points: Award answer_posted points
        CommentController->>DB: Reload comment tree
        CommentController-->>PostUI: Return comment tree JSON
    else Bookmark post
        PostUI->>BookmarkController: POST /posts/{post}/bookmark
        BookmarkController->>DB: Check existing BookmarkItem
        alt Existing bookmark
            BookmarkController->>DB: Delete bookmark
            BookmarkController->>Points: Revoke resource_bookmarked points
        else New bookmark
            BookmarkController->>DB: Create bookmark in default folder
            BookmarkController->>Points: Award resource_bookmarked points
        end
        BookmarkController-->>PostUI: Return saved state and saves_count
    else Report post or comment
        PostUI->>ReportController: POST report route with reason
        ReportController->>DB: Check duplicate report
        alt Not reported before
            ReportController->>DB: Create pending report
            ReportController->>Jobs: Dispatch moderation queue job
            ReportController-->>PostUI: Report submitted
        else Duplicate report
            ReportController-->>PostUI: Already reported error
        end
    end
```

## 5. Attempt Quiz and Update Learning Progress

该流程覆盖 `POST /posts/{post}/complete-quiz`，包括 multi-question quiz、legacy quiz、正确/错误判断、quiz completion、mistake review、material quiz attempt、成就同步。

### Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B[User opens quiz post or linked material quiz]
    B --> C[Select answer]
    C --> D[Submit answer as JSON request]
    D --> E{Post is quiz?}
    E -->|No| F[Return invalid quiz error]
    F --> Z([End])
    E -->|Yes| G{Quiz uses multi-question format?}
    G -->|Yes| H[Validate question_index and answer_index]
    G -->|No| I[Validate legacy answer_index]
    H --> J{Question and selected option exist?}
    I --> K{Answer data exists?}
    J -->|No| L[Return invalid index error]
    K -->|No| M[Return missing answer data error]
    L --> Z
    M --> Z
    J -->|Yes| N[Compare selected answer with correct answer]
    K -->|Yes| N
    N --> O{Answer correct?}
    O -->|No| P[Record attempt and mistake review]
    O -->|Yes| Q{First valid completion?}
    Q -->|Yes| R[Create quiz completion record]
    Q -->|No| S[Keep existing completion]
    R --> T[Record material quiz attempt if quiz is linked to material]
    S --> T
    P --> T
    T --> U[Update progress service]
    U --> V[Sync achievements]
    V --> W[Return status: incorrect, completed, or already_completed]
    W --> Z
```

### Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant QuizUI as Quiz UI
    participant PostController as PostController::completeQuiz
    participant Completion as QuizCompletion
    participant Attempt as QuizAttempt/MaterialQuizAttempt
    participant Progress as ProgressService
    participant Achievement as AchievementService
    participant DB as Database

    User->>QuizUI: Select answer
    QuizUI->>PostController: POST /posts/{post}/complete-quiz
    PostController->>PostController: Verify JSON request and post_type = quiz
    PostController->>PostController: Read quiz_data and validate indices
    PostController->>PostController: Compare selected answer with correct answer
    alt Correct final answer or legacy correct answer
        PostController->>Completion: firstOrCreate user quiz completion
        Completion->>DB: Insert or read completion
        DB-->>Completion: Completion record
        Completion-->>PostController: wasRecentlyCreated flag
    else Incorrect answer
        PostController->>PostController: Mark as incorrect
    end
    PostController->>Attempt: Record material quiz attempt if linked to material
    Attempt->>DB: Insert attempt data
    PostController->>Progress: syncMistakeReview and recordQuizAttempt
    Progress->>DB: Update quiz mistake and progress records
    PostController->>Achievement: syncUser
    Achievement->>DB: Update user achievements if unlocked
    PostController-->>QuizUI: Return result status and newly_earned data
    QuizUI-->>User: Display quiz result
```

## 6. Admin Governance: Teacher Approval and Content Moderation

该流程覆盖管理员最重要的治理能力：审核教师申请、授予 teacher role / verified status、处理 post/comment reports、删除违规内容或 dismiss report。

### Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B[Admin opens admin dashboard]
    B --> C{Choose admin task}
    C -->|Teacher applications| D[Load teacher applications and documents]
    D --> E[Review applicant information]
    E --> F{Approve application?}
    F -->|Yes| G[Set application status to approved]
    G --> H[Update user role to teacher]
    H --> I{Toggle verified teacher status?}
    I -->|Yes| J[Update user is_verified and clear leaderboard cache]
    I -->|No| K[Keep verification unchanged]
    F -->|No| L[Reject application with admin note]
    C -->|Reports| M[Load pending post and comment reports]
    M --> N[Review reporter, reason, target content, and author]
    N --> O{Admin decision}
    O -->|Dismiss report| P[Set report status to dismissed or delete report]
    O -->|Delete reported comment| Q[Delete comment content]
    O -->|Delete reported post| R[Delete post content]
    J --> Z([End])
    K --> Z
    L --> Z
    P --> Z
    Q --> Z
    R --> Z
```

### Sequence Diagram

```mermaid
sequenceDiagram
    actor Admin
    participant AdminUI as Admin Pages
    participant AdminController as AdminController
    participant Application as TeacherApplication
    participant Report as PostReport/CommentReport
    participant UserModel as User Model
    participant Storage as Local Storage
    participant DB as Database

    Admin->>AdminUI: Open admin teacher applications or reports page
    alt Review teacher application
        AdminUI->>AdminController: GET /admin/teacher-applications
        AdminController->>Application: Load applications with users and documents
        Application->>DB: Query application records
        DB-->>Application: Application list
        Application-->>AdminController: Application data
        AdminController-->>AdminUI: Render application table
        opt View document
            AdminUI->>AdminController: GET /admin/verification-documents/{document}/download
            AdminController->>Storage: Check and stream document
            Storage-->>AdminUI: Inline document response
        end
        alt Approve
            AdminUI->>AdminController: PATCH approve application
            AdminController->>Application: Update status = approved
            AdminController->>UserModel: Update role = teacher
        else Reject
            AdminUI->>AdminController: PATCH reject application
            AdminController->>Application: Update status = rejected and admin_note
        else Toggle verification
            AdminUI->>AdminController: PATCH toggle verification
            AdminController->>UserModel: Toggle is_verified
            AdminController->>DB: Clear leaderboard cache keys
        end
    else Moderate reports
        AdminUI->>AdminController: GET /admin/reports
        AdminController->>Report: Load pending post and comment reports
        Report->>DB: Query reports with reporter and target author
        DB-->>Report: Pending reports
        Report-->>AdminController: Report list
        AdminController-->>AdminUI: Render reports table
        alt Dismiss report
            AdminUI->>AdminController: DELETE report route
            AdminController->>Report: Set status dismissed or delete report
        else Delete reported content
            AdminUI->>AdminController: DELETE content route
            AdminController->>DB: Delete reported post or comment
        end
    end
    AdminController-->>AdminUI: Redirect back or refresh admin data
```


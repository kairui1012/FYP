# Simplified Sequence Diagrams

本文档将 12 个 sequence diagram 简化成 high-level 版本。每个图只保留主要参与者、核心请求、关键判断和最终结果，适合放入 FYP 报告的系统设计章节。

## 1. Login and Registration Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant UI as Login/Register UI
    participant Auth as Authentication Service
    participant OAuth as Google OAuth
    participant DB as Database
    participant Session as Session/Middleware

    User->>UI: Choose register, email login, or Google login
    alt Register
        UI->>Auth: Submit registration details
        Auth->>DB: Create user account
        DB-->>Auth: User created
        Auth-->>UI: Show email verification notice
    else Email login
        UI->>Auth: Submit email and password
        Auth->>DB: Validate user credentials
        DB-->>Auth: User account status
    else Google login
        UI->>OAuth: Redirect to Google
        OAuth-->>Auth: Return verified Google profile
        Auth->>DB: Find or create user account
    end

    Auth->>Session: Check blocked status, verification, role, and 2FA
    alt Access allowed
        Session-->>UI: Create session and redirect
        UI-->>User: Show home or admin page
    else Access denied
        Session-->>UI: Return error or verification page
        UI-->>User: Show access message
    end
```

## 2. Create Post Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant UI as Create Post UI
    participant Post as Post Controller
    participant AI as AI Service
    participant Storage as File Storage
    participant DB as Database
    participant Reward as Points/Achievement Service

    User->>UI: Fill question, quiz, or material form
    opt Use AI assistance
        UI->>AI: Request generated quiz/options/content support
        AI-->>UI: Return generated draft
    end

    UI->>Post: Submit post data
    Post->>Post: Validate type, permission, content, files, and quiz/material data
    alt Validation or permission failed
        Post-->>UI: Return error
        UI-->>User: Show form error
    else Valid request
        Post->>Storage: Store uploaded files if any
        Storage-->>Post: Return file paths
        Post->>DB: Create post and related records
        DB-->>Post: Post saved
        Post->>Reward: Award points and update progress
        Reward-->>Post: Reward state updated
        Post-->>UI: Redirect to result page
        UI-->>User: Show created post
    end
```

## 3. Switch Language Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant UI as Language Selector
    participant Locale as Locale Controller
    participant Store as Session/Cookie/User Preference
    participant App as Middleware/Inertia

    User->>UI: Select preferred language
    UI->>Locale: Submit language setting
    Locale->>Locale: Validate supported locale
    Locale->>Store: Save locale preference
    Store-->>Locale: Preference saved
    Locale-->>UI: Redirect back
    UI->>App: Load page with updated locale
    App-->>UI: Return translated UI data
    UI-->>User: Display page in selected language
```

## 4. AI Learning Tools Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant UI as AI Feature UI
    participant AIController as AI Controller
    participant Provider as AI Provider
    participant Parser as Response Parser

    User->>UI: Trigger AI feature
    UI->>AIController: Send feature input and selected provider
    AIController->>AIController: Validate request and build prompt
    alt Request invalid
        AIController-->>UI: Return validation error
        UI-->>User: Show error
    else Request valid
        AIController->>Provider: Send AI prompt
        Provider-->>AIController: Return AI response
        AIController->>Parser: Parse and validate structured output
        alt AI output valid
            Parser-->>AIController: Normalized result
            AIController-->>UI: Return AI result
            UI-->>User: Show explanation, translation, feedback, or generated quiz
        else AI output invalid or provider failed
            AIController-->>UI: Return AI service error
            UI-->>User: Show fallback/error message
        end
    end
```

## 5. Follow and Unfollow Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant UI as Profile/Post UI
    participant Follow as Follow Controller
    participant DB as Database
    participant Feed as Following Feed

    User->>UI: Click follow or unfollow
    UI->>Follow: Submit follow toggle
    Follow->>Follow: Validate user and target account
    alt Invalid action
        Follow-->>UI: Return error
        UI-->>User: Show action message
    else Valid action
        Follow->>DB: Create or remove follow relationship
        DB-->>Follow: Relationship updated
        Follow-->>UI: Return follow status and counts
        UI-->>User: Update follow button
    end

    opt User opens following feed
        UI->>Feed: Request posts from followed users
        Feed->>DB: Load following posts
        DB-->>Feed: Post list
        Feed-->>UI: Return feed data
        UI-->>User: Show following feed
    end
```

## 6. Bookmark and Study Folder Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant UI as Post/Study Folder UI
    participant Bookmark as Bookmark Controller
    participant DB as Database
    participant Reward as Points/Achievement Service
    participant Review as Quiz Review Service

    User->>UI: Save post or manage study folder
    alt Save or unsave post
        UI->>Bookmark: Toggle bookmark
        Bookmark->>DB: Add or remove saved post
        DB-->>Bookmark: Bookmark state updated
        Bookmark->>Reward: Update bookmark points and achievements
        Bookmark-->>UI: Return saved state
    else Manage folder
        UI->>Bookmark: Create, rename, delete, or move folder item
        Bookmark->>DB: Update folder records
        DB-->>Bookmark: Folder state updated
        Bookmark-->>UI: Return updated folder data
    else Review saved quiz items
        UI->>Review: Request completed, correct, or wrong quiz items
        Review->>DB: Load quiz review data
        DB-->>Review: Review records
        Review-->>UI: Return review list
    end
    UI-->>User: Show updated study folder
```

## 7. Achievements Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Feature as Learning/Community Feature
    participant Progress as Progress Service
    participant Achievement as Achievement Service
    participant DB as Database
    participant Page as Achievements Page

    User->>Feature: Complete learning or community action
    Feature->>Progress: Update related progress metric
    Progress->>DB: Save progress state
    DB-->>Progress: Progress saved
    Progress->>Achievement: Evaluate achievement conditions
    Achievement->>DB: Save newly earned achievements
    DB-->>Achievement: Achievement state
    Achievement-->>Feature: Return new achievement result
    Feature-->>User: Show feedback if achievement earned

    opt User opens achievements page
        User->>Page: Request achievements page
        Page->>DB: Load metrics, badges, and earned achievements
        DB-->>Page: Achievement summary
        Page-->>User: Display achievement progress
    end
```

## 8. Leaderboard Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Page as Leaderboard Page
    participant Controller as Leaderboard Controller
    participant DB as Database
    participant Cache as Cache
    participant Settings as User Settings

    User->>Page: Open leaderboard
    Page->>Controller: Request ranking for selected period
    Controller->>Controller: Validate period
    Controller->>Cache: Check cached ranking
    alt Cache available
        Cache-->>Controller: Return cached ranking
    else Cache missing
        Controller->>DB: Calculate ranking and current user position
        DB-->>Controller: Ranking data
        Controller->>Cache: Store ranking
    end
    Controller-->>Page: Return leaderboard data
    Page-->>User: Display ranking, points, and history

    opt User changes visibility settings
        User->>Page: Toggle leaderboard visibility or badge
        Page->>Settings: Submit setting change
        Settings->>DB: Save user setting
        Settings->>Cache: Clear affected leaderboard cache
        Settings-->>Page: Return updated setting
    end
```

## 9. Teacher Certification Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    actor Admin
    participant Settings as Certification UI
    participant Cert as Certification Controller
    participant Storage as File Storage
    participant DB as Database
    participant AdminPage as Admin Review UI

    User->>Settings: Open teacher certification page
    Settings->>DB: Load current application status
    DB-->>Settings: Current status
    alt User can apply or resubmit
        User->>Settings: Submit application and documents
        Settings->>Cert: Send certification request
        Cert->>Storage: Store uploaded documents
        Storage-->>Cert: Document paths
        Cert->>DB: Save pending application
        Cert-->>Settings: Return pending status
    else Already approved or pending
        Settings-->>User: Show current status
    end

    Admin->>AdminPage: Open teacher applications
    AdminPage->>Cert: Request pending applications
    Cert->>DB: Load applications and documents
    DB-->>Cert: Application list
    Cert-->>AdminPage: Return review data
    Admin->>AdminPage: Approve or reject application
    AdminPage->>Cert: Submit admin decision
    Cert->>DB: Update application and user role
    Cert-->>AdminPage: Return updated application status
    AdminPage-->>Admin: Show review result
```

## 10. Comment Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Page as Post Detail Page
    participant Comment as Comment Controller
    participant Vote as Comment Vote Controller
    participant Feedback as Material Feedback Controller
    participant DB as Database

    User->>Page: Open post detail
    Page->>DB: Load post comments, replies, votes, and feedback summary
    DB-->>Page: Interaction data
    Page-->>User: Show discussion area

    alt Add, edit, reply, or delete comment
        User->>Page: Submit comment action
        Page->>Comment: Send comment request
        Comment->>Comment: Validate content and permission
        Comment->>DB: Save comment change
        DB-->>Comment: Updated comment tree
        Comment-->>Page: Return refreshed comments
    else Vote comment
        User->>Page: Submit vote
        Page->>Vote: Send vote request
        Vote->>DB: Save vote state
        DB-->>Vote: Updated vote count
        Vote-->>Page: Return vote result
    else Submit material feedback
        User->>Page: Submit rating or feedback
        Page->>Feedback: Send feedback request
        Feedback->>DB: Save material feedback
        DB-->>Feedback: Updated feedback summary
        Feedback-->>Page: Return feedback result
    end
    Page-->>User: Show updated interaction state
```

## 11. Admin Block User Sequence Diagram

```mermaid
sequenceDiagram
    actor Admin
    actor User as Target User
    participant AdminPage as Admin Users Page
    participant AdminController as Admin User Controller
    participant DB as Database
    participant Middleware as Access Middleware

    Admin->>AdminPage: Open user management page
    AdminPage->>AdminController: Request user list
    AdminController->>DB: Load users and account status
    DB-->>AdminController: User list
    AdminController-->>AdminPage: Return user data
    AdminPage-->>Admin: Show users

    Admin->>AdminPage: Block or unblock target user
    AdminPage->>AdminController: Submit block toggle
    AdminController->>AdminController: Validate admin permission and target account
    alt Target cannot be blocked
        AdminController-->>AdminPage: Return rejection
        AdminPage-->>Admin: Show error
    else Target updated
        AdminController->>DB: Update blocked status
        DB-->>AdminController: Status saved
        AdminController-->>AdminPage: Return updated user status
        AdminPage-->>Admin: Refresh user table
    end

    User->>Middleware: Make future authenticated request
    Middleware->>DB: Check blocked status
    DB-->>Middleware: Account status
    Middleware-->>User: Allow access or redirect with blocked message
```

## 12. Report and Admin Moderation Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    actor Admin
    participant Page as Post/Comment UI
    participant Report as Report Controller
    participant DB as Database
    participant AdminReports as Admin Reports Page
    participant Moderation as Moderation Controller

    User->>Page: Report post or comment
    Page->>Report: Submit report reason and target
    Report->>Report: Validate report availability and duplicate report
    alt Report invalid
        Report-->>Page: Return validation message
        Page-->>User: Show report error
    else Report valid
        Report->>DB: Create pending report
        DB-->>Report: Report saved
        Report-->>Page: Return confirmation
        Page-->>User: Show submitted message
    end

    Admin->>AdminReports: Open moderation page
    AdminReports->>Moderation: Request report list
    Moderation->>DB: Load pending reports and target content
    DB-->>Moderation: Report list
    Moderation-->>AdminReports: Return moderation data
    AdminReports-->>Admin: Show reports

    Admin->>AdminReports: Dismiss report or delete reported content
    AdminReports->>Moderation: Submit moderation decision
    Moderation->>DB: Apply decision and update related records
    DB-->>Moderation: Moderation saved
    Moderation-->>AdminReports: Return refreshed reports
    AdminReports-->>Admin: Show updated moderation list
```

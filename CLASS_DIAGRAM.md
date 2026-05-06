# Class Diagram Documentation

## Project Overview
This is a Laravel-based educational platform with features for sharing study materials, posting, commenting, achievements, leaderboards, and gamification.

## Core Classes & Architecture

### 1. **User Model** (Core Entity)
- **Namespace**: `App\Models\User`
- **Base Class**: `Authenticatable`
- **Key Attributes**:
  - `id`: Primary key
  - `name`: User name
  - `email`: Email address
  - `password`: Hashed password
  - `role`: User role (admin, teacher, student)
  - `points`: Current points
  - `total_points`: Lifetime points
  - `show_on_leaderboard`: Boolean flag
  - `show_leaderboard_badge`: Boolean flag
  - `locale`: Language preference
  - `is_blocked`: Account status
  - `is_verified`: Verification status

- **Key Relationships**:
  - `hasMany(Post)` - User creates multiple posts
  - `hasMany(Comment)` - User creates multiple comments
  - `hasOne(Profile)` - User has one profile
  - `belongsToMany(Badge)` - User can earn multiple badges
  - `hasMany(UserAchievement)` - User can have achievements
  - `hasMany(PostSave)` - User can save posts

---

### 2. **Post Model** (Content Entity)
- **Namespace**: `App\Models\Post`
- **Key Attributes**:
  - `id`: Primary key
  - `user_id`: Foreign key to User
  - `subject_id`: Foreign key to Subject
  - `language_id`: Foreign key to Language
  - `title`: Post title
  - `content`: Post content
  - `content_blocks`: JSON array of content blocks
  - `post_type`: Type (question, material, lesson, quiz)
  - `quiz_data`: JSON quiz questions
  - `is_anonymous`: Boolean flag
  - `image`: JSON array of images
  - `video_url`: Video URL
  - `material_improved_from_feedback`: Boolean flag
  - `parent_material_id`: Reference to parent study material

- **Key Methods**:
  - `casts()`: Define attribute casting
  - `user()`: Get post author
  - `comments()`: Get all comments
  - `likes()`: Get all likes
  - `subject()`: Get subject
  - `saves()`: Get users who saved this post

- **Key Relationships**:
  - `belongsTo(User)` - Post belongs to a user
  - `belongsTo(Subject)` - Post belongs to a subject
  - `belongsTo(Language)` - Post in specific language
  - `hasMany(Comment)` - Post has multiple comments
  - `hasMany(Like)` - Post can be liked
  - `hasMany(PostSave)` - Post can be saved by users
  - `hasMany(StudyMaterialFeedback)` - Post can receive feedback

---

### 3. **Comment Model** (Discussion Entity)
- **Namespace**: `App\Models\Comment`
- **Key Attributes**:
  - `id`: Primary key
  - `user_id`: Foreign key to User
  - `post_id`: Foreign key to Post
  - `parent_id`: Self-reference for replies
  - `content`: Comment text
  - `attachments`: JSON array of files
  - `mentions`: JSON array of mentioned users

- **Key Methods**:
  - `user()`: Get comment author
  - `post()`: Get parent post
  - `parent()`: Get parent comment (if reply)
  - `replies()`: Get all reply comments
  - `upvotes()`: Get upvotes (vote = 1)
  - `downvotes()`: Get downvotes (vote = -1)
  - `wrongvotes()`: Get wrong votes (vote = -2)

- **Key Relationships**:
  - `belongsTo(User)` - Comment by a user
  - `belongsTo(Post)` - Comment on a post
  - `belongsTo(Comment, parent_id)` - Reply to another comment
  - `hasMany(Comment, parent_id)` - Has reply comments
  - `hasMany(CommentLike)` - Comment can be voted

---

### 4. **Profile Model** (User Details)
- **Namespace**: `App\Models\Profile`
- **Key Attributes**:
  - `id`: Primary key
  - `user_id`: Foreign key to User
  - `avatar`: User avatar URL
  - `about`: User bio/description

- **Key Relationships**:
  - `belongsTo(User)` - Profile belongs to user (one-to-one)

---

### 5. **Subject Model** (Category)
- **Namespace**: `App\Models\Subject`
- **Key Attributes**:
  - `id`: Primary key
  - `name`: Subject name

- **Key Relationships**:
  - `hasMany(Post)` - Subject contains multiple posts
  - `hasMany(Lesson)` - Subject contains multiple lessons

---

### 6. **Badge Model** (Gamification)
- **Namespace**: `App\Models\Badge`
- **Key Attributes**:
  - `id`: Primary key
  - `key`: Unique identifier
  - `name`: Badge name
  - `description`: Badge description
  - `icon`: Badge icon URL
  - `points_required`: Points needed to earn

- **Key Relationships**:
  - `belongsToMany(User)` - Badge earned by multiple users
  - Pivot attributes: `awarded_at`, timestamps

---

### 7. **Achievement Model** (Milestone Tracking)
- **Namespace**: `App\Models\Achievement`
- **Key Attributes**:
  - `id`: Primary key
  - `key`: Unique identifier
  - `category`: Achievement category
  - `icon`: Achievement icon URL
  - `metric`: Metric being tracked
  - `threshold`: Required count/value

---

### 8. **Support Models** (Related Entities)

#### PostSave
- `user_id` - User who saved
- `post_id` - Saved post
- Tracks saved study materials/posts

#### CommentLike (Vote)
- `user_id` - User who voted
- `comment_id` - Voted comment
- `vote`: -2, -1, or 1 (wrong, down, up)

#### Like
- `user_id` - User who liked
- `post_id` - Liked post
- `likeable_type` & `likeable_id` - Polymorphic

#### StudyMaterialFeedback
- `user_id` - Feedback provider
- `post_id` - Material being reviewed
- Feedback on study materials

#### UserAchievement
- `user_id` - User
- Tracks user achievements progress

#### Language
- `code` - Language code
- `name` - Language name
- Used for multi-language support

---

## Service Classes

### AchievementService
- **Purpose**: Handle achievement and badge logic
- **Key Methods**:
  - `syncUser(User)`: Calculate points and sync badges
  - Calculate points from posts and likes
  - Award eligible badges based on points
  - Track user progress

- **Constants**:
  - `POINTS_PER_POST = 10`
  - `POINTS_PER_LIKE_RECEIVED = 2`

### Other Services
- `PointsService`: Handle point transactions
- `ProgressService`: Track learning progress
- `LeaderboardTitleService`: Manage leaderboard rankings
- `AchievementService`: Badge and achievement logic
- `PostSerializationService`: Format post data
- `MaterialVersionService`: Handle material versions
- `PostQueryBuilder`: Build complex post queries
- `LearningProgressService`: Track learning metrics

---

## Class Diagram (Mermaid)

```mermaid
graph TB
  %% ---- Core Domain Models (reflects code) ----
  classDef model fill:#f8f9fa,stroke:#333,stroke-width:1

  User["<b>User</b>\n- id: int\n- name: string\n- email: string\n- password: string\n- role: string\n- points: int\n- total_points: int\n- show_on_leaderboard: bool\n- show_leaderboard_badge: bool\n- locale: string\n- is_blocked: bool\n- is_verified: bool\n+ posts(), comments(), profile(), badges(), userAchievements(), postSaves(), commentLikes(), pointsTransactions(), canPublishStudyMaterials()"]

  Profile["<b>Profile</b>\n- id: int\n- user_id: int\n- avatar: string\n- about: text"]

  Post["<b>Post</b>\n- id: int\n- user_id: int\n- subject_id: int\n- language_id: int\n- title: string\n- content: text\n- content_blocks: json\n- post_type: enum\n- quiz_data: json\n- is_anonymous: bool\n- image: json\n- video_url: string\n- material_improved_from_feedback: bool\n- parent_material_id: int\n+ user(), comments(), likes(), saves(), materialFeedback(), parentMaterial(), linkedPosts(), materialVersions()"]

  Comment["<b>Comment</b>\n- id: int\n- user_id: int\n- post_id: int\n- parent_id: int\n- content: text\n- attachments: json\n- mentions: json\n+ user(), post(), parent(), replies(), likes(), votes(), upvotes(), downvotes(), wrongvotes()"]

  Subject["<b>Subject</b>\n- id: int\n- name: string"]

  Language["<b>Language</b>\n- id: int\n- code: string\n- name: string"]

  %% ---- Interaction Models ----
  Like["<b>Like</b>\n- id: int\n- user_id: int\n- post_id: int"]

  PostSave["<b>PostSave</b>\n- id: int\n- user_id: int\n- post_id: int\n- folder_id: int"]

  CommentLike["<b>CommentLike</b>\n- id: int\n- user_id: int\n- comment_id: int\n- vote: int"]

  StudyMaterialFeedback["<b>StudyMaterialFeedback</b>\n- id: int\n- user_id: int\n- post_id: int\n- vote: int\n- rating: int\n- feedback: text"]

  CommentReport["<b>CommentReport</b>\n- id: int\n- user_id: int\n- comment_id: int\n- reason: text"]

  %% ---- Gamification Models ----
  Badge["<b>Badge</b>\n- id: int\n- key: string\n- name: string\n- description: text\n- icon: string\n- points_required: int"]

  Achievement["<b>Achievement</b>\n- id: int\n- key: string\n- category: string\n- icon: string\n- metric: string\n- threshold: int"]

  UserAchievement["<b>UserAchievement</b>\n- id: int\n- user_id: int\n- achievement_key: string\n- achieved_at: datetime"]

  PointTransaction["<b>PointTransaction</b>\n- id: int\n- user_id: int\n- points: int\n- action: string\n- source_type: string\n- source_id: int"]

  %% ---- Learning & Quiz Models ----
  MaterialQuizAttempt["<b>MaterialQuizAttempt</b>\n- id: int\n- user_id: int\n- post_id: int\n- material_id: int\n- score: int\n- total_questions: int"]

  QuizCompletion["<b>QuizCompletion</b>\n- id: int\n- user_id: int\n- post_id: int\n- subject_id: int\n- completed_at: datetime"]

  QuizMistake["<b>QuizMistake</b>\n- id: int\n- user_id: int\n- post_id: int\n- question_index: int\n- selected_answer_index: int\n- is_correct: bool\n- attempted_at: datetime"]

  UserProgress["<b>UserProgress</b>\n- id: int\n- user_id: int\n- total_questions_answered: int\n- total_questions_posted: int\n- total_post_posted: int\n- quizzes_completed: int\n- correct_answers_count: int\n- total_likes_received: int\n- improvement_score: int\n+ accuracyRate()"]

  TeacherApplication["<b>TeacherApplication</b>\n- id: int\n- user_id: int\n- qualification: string\n- bio: text\n- document_path: string\n- status: enum\n- admin_note: text"]

  %% ---- Service Layer (existing services) ----
  AchievementService[[<<Service>> AchievementService]]
  PointsService[[<<Service>> PointsService]]
  LeaderboardTitleService[[<<Service>> LeaderboardTitleService]]
  PostSerializationService[[<<Service>> PostSerializationService]]
  MaterialVersionService[[<<Service>> MaterialVersionService]]
  LearningProgressService[[<<Service>> LearningProgressService]]
  PostQueryBuilder[[<<Service>> PostQueryBuilder]]
  ProgressService[[<<Service>> ProgressService]]

  %% ---- Relationships & Multiplicities (uses Laravel names) ----
  User "1" -- "0..1" Profile : hasOne
  User "1" -- "0..*" Post : posts() hasMany
  User "1" -- "0..*" Comment : comments() hasMany
  User "1" -- "0..*" Like : likes() hasMany
  User "1" -- "0..*" PostSave : postSaves() hasMany
  User "1" -- "0..*" CommentLike : commentLikes() hasMany
  User "*" -- "*" Badge : badges() belongsToMany
  User "1" -- "0..*" UserAchievement : userAchievements() hasMany
  User "1" -- "0..*" MaterialQuizAttempt : hasMany
  User "1" -- "0..1" UserProgress : progress() hasOne
  User "1" -- "0..*" PointTransaction : pointsTransactions() hasMany

  Post "1" -- "0..*" Comment : comments() hasMany
  Post "1" -- "0..*" Like : likes() hasMany
  Post "1" -- "0..*" PostSave : saves() hasMany
  Post "1" -- "0..*" StudyMaterialFeedback : materialFeedback() hasMany
  Post "1" -- "0..*" MaterialQuizAttempt : materialQuizAttempts() hasMany
  Post "*" -- "1" Subject : subject() belongsTo
  Post "*" -- "1" Language : language() belongsTo
  Post "0..1" -- "0..*" Post : parentMaterial() linkedPosts() improves

  Comment "*" -- "1" User : user() belongsTo
  Comment "*" -- "1" Post : post() belongsTo
  Comment "0..1" -- "0..*" Comment : parent() / replies() self-ref
  Comment "1" -- "0..*" CommentLike : hasMany

  Like "*" -- "1" User : belongsTo
  Like "*" -- "1" Post : belongsTo
  PostSave "*" -- "1" User : belongsTo
  PostSave "*" -- "1" Post : belongsTo
  CommentLike "*" -- "1" User : belongsTo
  CommentLike "*" -- "1" Comment : belongsTo
  StudyMaterialFeedback "*" -- "1" User : belongsTo
  StudyMaterialFeedback "*" -- "1" Post : belongsTo

  Achievement "1" -- "0..*" UserAchievement : hasMany
  UserAchievement "*" -- "1" User : belongsTo
  UserAchievement "*" -- "1" Achievement : references
  PointTransaction "*" -- "1" User : belongsTo

  MaterialQuizAttempt "*" -- "1" User : belongsTo
  MaterialQuizAttempt "*" -- "1" Post : belongsTo
  QuizCompletion "*" -- "1" User : belongsTo
  QuizCompletion "*" -- "1" Post : belongsTo
  QuizMistake "*" -- "1" User : belongsTo
  QuizMistake "*" -- "1" Post : belongsTo
  UserProgress "1" -- "1" User : belongsTo

  TeacherApplication "*" -- "1" User : belongsTo
  CommentReport "*" -- "1" User : belongsTo
  CommentReport "*" -- "1" Comment : belongsTo

  %% ---- Service dependencies (non-persistent) ----
  AchievementService ..> User : uses
  AchievementService ..> Badge : manages
  AchievementService ..> UserAchievement : manages
  PointsService ..> User : updates
  PointsService ..> PointTransaction : records
  LeaderboardTitleService ..> User : ranks
  PostSerializationService ..> Post : formats
  MaterialVersionService ..> Post : versions
  LearningProgressService ..> UserProgress : analyzes
  LearningProgressService ..> QuizMistake : analyzes
```

---

## Relationship Summary Table

| From Class | Relationship Type | To Class | Description |
|-----------|------------------|---------|-------------|
| User | hasOne | Profile | User profile (1:1) |
| User | hasMany | Post | User's posts (1:N) |
| User | hasMany | Comment | User's comments (1:N) |
| User | hasMany | PostSave | Saved posts (1:N) |
| User | hasMany | Like | Posts user liked (1:N) |
| User | hasMany | CommentLike | Comment votes (1:N) |
| User | belongsToMany | Badge | Earned badges (N:N) |
| Post | belongsTo | User | Post author |
| Post | belongsTo | Subject | Post's subject |
| Post | belongsTo | Language | Post's language |
| Post | hasMany | Comment | Post's comments (1:N) |
| Post | hasMany | Like | Post's likes (1:N) |
| Comment | belongsTo | User | Comment author |
| Comment | belongsTo | Post | Parent post |
| Comment | belongsTo | Comment | Parent comment (self) |
| Comment | hasMany | Comment | Reply comments |
| Comment | hasMany | CommentLike | Comment votes |

---

## Architecture Layers

### 1. **Models Layer** (`App\Models`)
- Entity classes representing database tables
- Define relationships using Eloquent ORM
- Handle data casting and validation

### 2. **Services Layer** (`App\Services`)
- Business logic encapsulation
- Stateless operations
- Examples:
  - `AchievementService`: Points & badge management
  - `PointsService`: Point transaction handling
  - `LeaderboardTitleService`: Ranking calculations
  - `PostSerializationService`: Data transformation

### 3. **Controller Layer** (`App\Http\Controllers`)
- Handle HTTP requests
- Call services and models
- Return responses

### 4. **Request Layer** (`App\Http\Requests`)
- Form request validation
- Authorization rules
- Data sanitization

---

## Key Design Patterns Used

1. **Active Record Pattern** - Models handle both data and behavior
2. **Repository-like Service Classes** - Services encapsulate business logic
3. **Eloquent Relationships** - Define associations between models
4. **Middleware Pattern** - HTTP middleware for authentication/authorization
5. **Factory Pattern** - Model factories for testing

---

## Recommended Additional Classes

### Consider adding these if not already present:

1. **Lesson Model**
   - Represents lessons within subjects
   - Relationships: `belongsTo(Subject)`, `hasMany(Post)`

2. **QuizAttempt Model**
   - Track quiz submissions and scores
   - Relationships: `belongsTo(User)`, `belongsTo(Post)`

3. **CourseProgress Model**
   - Track user progress in courses/subjects
   - Relationships: `belongsTo(User)`, `belongsTo(Subject)`

4. **UserNotification Model**
   - Handle user notifications
   - Relationships: `belongsTo(User)`

5. **ReportModel**
   - Track reported content
   - Relationships: `belongsTo(User)`, polymorphic to Post/Comment

---

## How to Read This Diagram

- **Boxes** represent classes with attributes
- **Arrows** show relationships:
  - `→` with label = relationship type (hasMany, belongsTo, etc.)
  - **1:1** = One-to-One relationships
  - **1:N** = One-to-Many relationships
  - **N:N** = Many-to-Many relationships
- **Attributes** listed in boxes with types
- **Methods** (not shown in full) are defined in each model class

---

## Next Steps

To create a more detailed class diagram:
1. Review `app/Actions/` for action classes
2. Check `app/Concerns/` for traits
3. Document DTOs (Data Transfer Objects) if used
4. Create separate diagrams for specific features (Auth, Gamification, etc.)


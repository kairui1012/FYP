# Database Table Documentation

Table 1: USERS

Name of Table: USERS  
Primary key constraint name: PK_USERS  
Comment: To store user account information, authentication data, and account status for JomStudy users.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing user identifier. |
| name | No | VARCHAR(255) | Yes | User's display name used throughout the platform. |
| email | No | VARCHAR(255) | Yes | Unique email address used for account login and communication. |
| role | No | VARCHAR(20) | Yes | Access role that distinguishes student, teacher, and admin accounts. |
| email_verified_at | No | TIMESTAMP | No | Timestamp when the user's email address was verified. |
| password | No | VARCHAR(255) | Yes | Hashed password used for authentication. |
| points | No | INT UNSIGNED | Yes | Current points balance assigned to the user. |
| locale | No | VARCHAR(5) | No | Preferred language or locale code for the user interface. |
| two_factor_secret | No | TEXT | No | Secret used to support two-factor authentication. |
| two_factor_recovery_codes | No | TEXT | No | Recovery codes used when two-factor authentication access is unavailable. |
| two_factor_confirmed_at | No | TIMESTAMP | No | Timestamp when two-factor authentication was confirmed. |
| remember_token | No | VARCHAR(100) | No | Token used to maintain persistent login sessions. |
| created_at | No | TIMESTAMP | No | Timestamp when the user record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the user record was last updated. |
| total_points | No | INT | Yes | Total accumulated points used for leaderboard ranking. |
| show_on_leaderboard | No | TINYINT(1) | Yes | Flag indicating whether the user should appear on the leaderboard. |
| show_leaderboard_badge | No | TINYINT(1) | Yes | Flag indicating whether the leaderboard badge should be displayed. |
| is_blocked | No | TINYINT(1) | Yes | Flag indicating whether the account is restricted from normal access. |
| is_verified | No | TINYINT(1) | Yes | Flag indicating whether the account has been verified by an administrator. |

Table 2: CACHE

Name of Table: CACHE  
Primary key constraint name: PK_CACHE_KEY  
Comment: To store cached application data for faster retrieval.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| key | Yes | VARCHAR(255) | Yes | Cache entry key used to uniquely identify stored data. |
| value | No | MEDIUMTEXT | Yes | Serialized cached value associated with the cache key. |
| expiration | No | INT | Yes | Unix timestamp indicating when the cache entry expires. |

Table 3: CACHE_LOCKS

Name of Table: CACHE_LOCKS  
Primary key constraint name: PK_CACHE_LOCKS_KEY  
Comment: To store distributed cache lock records used by Laravel cache locking.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| key | Yes | VARCHAR(255) | Yes | Lock key used to identify the distributed cache lock. |
| owner | No | VARCHAR(255) | Yes | Identifier of the process or worker that owns the lock. |
| expiration | No | INT | Yes | Unix timestamp indicating when the lock expires. |

Table 4: JOBS

Name of Table: JOBS  
Primary key constraint name: PK_JOBS  
Comment: To store queued background jobs waiting to be processed.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing job identifier. |
| queue | No | VARCHAR(255) | Yes | Queue name used to group jobs for processing. |
| payload | No | LONGTEXT | Yes | Serialized job payload that contains execution details. |
| attempts | No | TINYINT UNSIGNED | Yes | Number of times the job has been attempted. |
| reserved_at | No | INT UNSIGNED | No | Unix timestamp indicating when the job was reserved by a worker. |
| available_at | No | INT UNSIGNED | Yes | Unix timestamp indicating when the job becomes available for processing. |
| created_at | No | INT UNSIGNED | Yes | Unix timestamp indicating when the job was created. |

Table 5: JOB_BATCHES

Name of Table: JOB_BATCHES  
Primary key constraint name: PK_JOB_BATCHES  
Comment: To store grouped batch execution metadata for queued jobs.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | VARCHAR(255) | Yes | Batch identifier used to track a collection of jobs. |
| name | No | VARCHAR(255) | Yes | Human-readable batch name. |
| total_jobs | No | INT | Yes | Total number of jobs included in the batch. |
| pending_jobs | No | INT | Yes | Number of jobs still waiting to complete. |
| failed_jobs | No | INT | Yes | Number of jobs that failed within the batch. |
| failed_job_ids | No | LONGTEXT | Yes | Serialized list of failed job identifiers. |
| options | No | MEDIUMTEXT | No | Optional batch configuration and metadata. |
| cancelled_at | No | INT | No | Unix timestamp indicating when the batch was cancelled. |
| created_at | No | INT | Yes | Unix timestamp indicating when the batch was created. |
| finished_at | No | INT | No | Unix timestamp indicating when the batch finished processing. |

Table 6: FAILED_JOBS

Name of Table: FAILED_JOBS  
Primary key constraint name: PK_FAILED_JOBS  
Comment: To store failed queued jobs for troubleshooting and retry analysis.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing failed job identifier. |
| uuid | No | VARCHAR(255) | Yes | Unique UUID assigned to the failed job record. |
| connection | No | TEXT | Yes | Queue connection name used when the job failed. |
| queue | No | TEXT | Yes | Queue name associated with the failed job. |
| payload | No | LONGTEXT | Yes | Serialized payload captured at the time of failure. |
| exception | No | LONGTEXT | Yes | Exception message and stack trace describing the failure. |
| failed_at | No | TIMESTAMP | Yes | Timestamp when the job failure was recorded. |

Table 7: SESSIONS

Name of Table: SESSIONS  
Primary key constraint name: PK_SESSIONS  
Comment: To store session state for authenticated and guest users.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | VARCHAR(255) | Yes | Session identifier used to retrieve the session record. |
| user_id | No | BIGINT UNSIGNED | No | Optional user identifier associated with the active session. |
| ip_address | No | VARCHAR(45) | No | IP address recorded for the session, supporting IPv4 and IPv6. |
| user_agent | No | TEXT | No | Browser or client user-agent string stored with the session. |
| payload | No | LONGTEXT | Yes | Serialized session payload containing session data. |
| last_activity | No | INT | Yes | Unix timestamp of the most recent session activity. |

Table 8: PASSWORD_RESET_TOKENS

Name of Table: PASSWORD_RESET_TOKENS  
Primary key constraint name: PK_PASSWORD_RESET_TOKENS_EMAIL  
Comment: To store password reset tokens issued for account recovery.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| email | Yes | VARCHAR(255) | Yes | Email address used to request the password reset token. |
| token | No | VARCHAR(255) | Yes | Reset token generated for password recovery verification. |
| created_at | No | TIMESTAMP | No | Timestamp when the reset token was created. |

Table 9: MIGRATIONS

Name of Table: MIGRATIONS  
Primary key constraint name: PK_MIGRATIONS  
Comment: To record applied database migrations and their batch numbers.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | INT UNSIGNED | Yes | Primary key, auto-incrementing migration record identifier. |
| migration | No | VARCHAR(255) | Yes | Name of the migration file that has been executed. |
| batch | No | INT | Yes | Batch number used by Laravel to group migration runs. |

Table 10: PROFILES

Name of Table: PROFILES  
Primary key constraint name: PK_PROFILES  
Comment: To store optional profile details linked to a user account.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing profile identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Unique foreign key referencing users.id for the related profile owner. |
| avatar | No | VARCHAR(255) | No | Path or URL to the user's profile picture. |
| about | No | TEXT | No | Optional biography or introduction text shown on the profile. |
| created_at | No | TIMESTAMP | No | Timestamp when the profile record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the profile record was last updated. |

Table 11: SOCIAL_ACCOUNTS

Name of Table: SOCIAL_ACCOUNTS  
Primary key constraint name: PK_SOCIAL_ACCOUNTS  
Comment: To store external social login identities linked to a user account.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing social account identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the owning account. |
| provider | No | VARCHAR(255) | Yes | Name of the social login provider such as Google or Facebook. |
| provider_id | No | VARCHAR(255) | Yes | Provider-specific identifier used to match the external account. |
| avatar | No | VARCHAR(255) | No | Optional avatar URL or file path retrieved from the social provider. |
| created_at | No | TIMESTAMP | No | Timestamp when the social account link was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the social account link was last updated. |

Table 12: FOLLOWS

Name of Table: FOLLOWS  
Primary key constraint name: PK_FOLLOWS  
Comment: To store follower and following relationships between users.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing follow relationship identifier. |
| follower_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the user who follows another user. |
| following_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the user being followed. |
| created_at | No | TIMESTAMP | No | Timestamp when the follow relationship was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the follow relationship was last updated. |

Table 13: LANGUAGES

Name of Table: LANGUAGES  
Primary key constraint name: PK_LANGUAGES  
Comment: To store language codes and display names used across the platform.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing language identifier. |
| code | No | VARCHAR(255) | Yes | Unique language code used to identify the language. |
| name | No | VARCHAR(255) | Yes | Human-readable language name displayed in the application. |
| created_at | No | TIMESTAMP | No | Timestamp when the language record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the language record was last updated. |

Table 14: SUBJECTS

Name of Table: SUBJECTS  
Primary key constraint name: PK_SUBJECTS  
Comment: To store the academic or topical categories assigned to learning content.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing subject identifier. |
| name | No | VARCHAR(255) | Yes | Unique subject name used for content classification. |
| created_at | No | TIMESTAMP | No | Timestamp when the subject record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the subject record was last updated. |

Table 15: LESSONS

Name of Table: LESSONS  
Primary key constraint name: PK_LESSONS  
Comment: To store lesson records linked to subjects and optionally derived from source posts.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing lesson identifier. |
| subject_id | No | BIGINT UNSIGNED | No | Foreign key referencing subjects.id for the associated subject. |
| source_post_id | No | BIGINT UNSIGNED | No | Unique foreign key referencing posts.id for the source material post. |
| title | No | VARCHAR(255) | Yes | Lesson title shown to learners. |
| sequence | No | INT UNSIGNED | Yes | Ordering number used to sort lessons within a subject. |
| is_published | No | TINYINT(1) | Yes | Publication flag indicating whether the lesson is visible to users. |
| created_at | No | TIMESTAMP | No | Timestamp when the lesson record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the lesson record was last updated. |

Table 16: POSTS

Name of Table: POSTS  
Primary key constraint name: PK_POSTS  
Comment: To store learning materials and discussion posts published by users.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing post identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the post author. |
| is_anonymous | No | TINYINT(1) | Yes | Flag indicating whether the author's identity should be hidden. |
| title | No | VARCHAR(255) | Yes | Post title displayed in feeds and detail views. |
| content | No | TEXT | Yes | Main body text of the post or learning material. |
| content_blocks | No | JSON | No | Structured content blocks used to render rich post content. |
| post_type | No | VARCHAR(20) | Yes | Content type used to distinguish material, question, or related post formats. |
| is_discussion | No | TINYINT(1) | Yes | Flag indicating whether the post is treated as a discussion-style question. |
| difficulty_level | No | VARCHAR(255) | No | Optional difficulty label such as easy, medium, or hard. |
| learning_objectives | No | JSON | No | Optional structured list of learning objectives attached to the post. |
| quiz_data | No | JSON | No | Optional quiz payload embedded with the post. |
| subject_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing subjects.id for the topic category. |
| parent_material_id | No | BIGINT UNSIGNED | No | Self-referencing foreign key to the parent post for derived material. |
| lesson_id | No | BIGINT UNSIGNED | No | Optional foreign key referencing lessons.id for lesson-linked content. |
| language_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing languages.id for the content language. |
| image | No | JSON | No | Optional image metadata or attachment information. |
| video_url | No | VARCHAR(255) | No | Optional video link associated with the post. |
| material_improved_from_feedback | No | TINYINT(1) | Yes | Flag indicating that the material was revised after receiving feedback. |
| created_at | No | TIMESTAMP | No | Timestamp when the post was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the post was last updated. |

Table 17: LIKES

Name of Table: LIKES  
Primary key constraint name: PK_LIKES  
Comment: To store post-level like relationships between users and posts.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing like identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the user who liked the post. |
| post_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing posts.id for the liked post. |
| created_at | No | TIMESTAMP | No | Timestamp when the like was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the like was last updated. |

Table 18: COMMENTS

Name of Table: COMMENTS  
Primary key constraint name: PK_COMMENTS  
Comment: To store user comments, nested replies, and question-answer interactions on posts.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing comment identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the comment author. |
| post_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing posts.id for the commented post. |
| parent_id | No | BIGINT UNSIGNED | No | Self-referencing foreign key used to build nested reply threads. |
| content | No | TEXT | Yes | Comment body text entered by the user. |
| is_answer | No | TINYINT(1) | Yes | Flag indicating that the comment is an answer to a question. |
| is_accepted | No | TINYINT(1) | Yes | Flag indicating that the answer has been accepted. |
| attachments | No | JSON | No | Optional attachment metadata linked to the comment. |
| mentions | No | JSON | No | Optional list of mentioned users or entities in the comment. |
| created_at | No | TIMESTAMP | No | Timestamp when the comment was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the comment was last updated. |

Table 19: COMMENT_LIKES

Name of Table: COMMENT_LIKES  
Primary key constraint name: PK_COMMENT_LIKES  
Comment: To store user votes on individual comments.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing comment vote identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the voting user. |
| comment_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing comments.id for the voted comment. |
| vote | No | TINYINT | Yes | Vote value used to represent upvotes or downvotes. |
| created_at | No | TIMESTAMP | No | Timestamp when the vote was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the vote was last updated. |

Table 20: COMMENT_REPORTS

Name of Table: COMMENT_REPORTS  
Primary key constraint name: PK_COMMENT_REPORTS  
Comment: To store moderation reports submitted against comments.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing report identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the reporting user. |
| comment_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing comments.id for the reported comment. |
| reason | No | VARCHAR(255) | Yes | Report reason code or category, defaulting to inappropriate. |
| created_at | No | TIMESTAMP | No | Timestamp when the report was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the report was last updated. |

Table 21: POST_SAVES

Name of Table: POST_SAVES  
Primary key constraint name: PK_POST_SAVES  
Comment: To store posts saved by users for later reference.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing save record identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the user who saved the post. |
| post_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing posts.id for the saved post. |
| created_at | No | TIMESTAMP | No | Timestamp when the save record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the save record was last updated. |

Table 22: BOOKMARK_FOLDERS

Name of Table: BOOKMARK_FOLDERS  
Primary key constraint name: PK_BOOKMARK_FOLDERS  
Comment: To store named bookmark folders created by users for organising saved posts.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing bookmark folder identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the folder owner. |
| name | No | VARCHAR(255) | Yes | Folder name chosen by the user. |
| is_default | No | TINYINT(1) | Yes | Flag indicating whether this is the user's default bookmark folder. |
| created_at | No | TIMESTAMP | No | Timestamp when the folder was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the folder was last updated. |

Table 23: BOOKMARK_ITEMS

Name of Table: BOOKMARK_ITEMS  
Primary key constraint name: PK_BOOKMARK_ITEMS  
Comment: To store individual bookmarked posts inside a specific bookmark folder.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing bookmark item identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the user who owns the bookmark. |
| bookmark_folder_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing bookmark_folders.id for the target folder. |
| post_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing posts.id for the bookmarked post. |
| created_at | No | TIMESTAMP | No | Timestamp when the bookmark item was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the bookmark item was last updated. |

Table 24: QUIZ_COMPLETIONS

Name of Table: QUIZ_COMPLETIONS  
Primary key constraint name: PK_QUIZ_COMPLETIONS  
Comment: To record completed quiz activities linked to posts and subjects.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing quiz completion identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the learner who completed the quiz. |
| post_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing posts.id for the quiz content. |
| subject_id | No | BIGINT UNSIGNED | No | Optional foreign key referencing subjects.id for subject-based reporting. |
| completed_at | No | TIMESTAMP | No | Timestamp when the quiz was completed. |
| created_at | No | TIMESTAMP | No | Timestamp when the completion record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the completion record was last updated. |

Table 25: QUIZ_MISTAKES

Name of Table: QUIZ_MISTAKES  
Primary key constraint name: PK_QUIZ_MISTAKES  
Comment: To store question-level quiz attempts for analysing learner performance and errors.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing quiz mistake identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the learner who answered the question. |
| post_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing posts.id for the quiz content. |
| question_index | No | INT UNSIGNED | Yes | Zero-based index identifying the question within the quiz. |
| selected_answer_index | No | INT UNSIGNED | Yes | Index of the answer selected by the learner. |
| is_correct | No | TINYINT(1) | Yes | Flag indicating whether the selected answer was correct. |
| attempted_at | No | TIMESTAMP | Yes | Timestamp when the question was attempted. |
| created_at | No | TIMESTAMP | No | Timestamp when the mistake record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the mistake record was last updated. |

Table 26: BADGES

Name of Table: BADGES  
Primary key constraint name: PK_BADGES  
Comment: To store badge definitions that can be awarded to users.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing badge identifier. |
| key | No | VARCHAR(255) | Yes | Unique badge code used as a stable internal identifier. |
| name | No | VARCHAR(255) | Yes | Display name shown for the badge. |
| description | No | VARCHAR(255) | Yes | Short explanation of the badge criteria or meaning. |
| icon | No | VARCHAR(255) | No | Optional icon path or asset reference for the badge. |
| points_required | No | INT UNSIGNED | Yes | Minimum points required before the badge can be earned. |
| created_at | No | TIMESTAMP | No | Timestamp when the badge record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the badge record was last updated. |

Table 27: BADGE_USER

Name of Table: BADGE_USER  
Primary key constraint name: PK_BADGE_USER  
Comment: To store badge awards granted to users.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing badge award identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the awarded user. |
| badge_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing badges.id for the awarded badge. |
| awarded_at | No | TIMESTAMP | Yes | Timestamp when the badge was awarded to the user. |
| created_at | No | TIMESTAMP | No | Timestamp when the award record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the award record was last updated. |

Table 28: USER_FEATURED_BADGES

Name of Table: USER_FEATURED_BADGES  
Primary key constraint name: PK_USER_FEATURED_BADGES  
Comment: To store badges that a user has chosen to feature on their profile.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing featured badge identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the profile owner. |
| badge_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing badges.id for the featured badge. |
| created_at | No | TIMESTAMP | No | Timestamp when the featured badge record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the featured badge record was last updated. |

Table 29: ACHIEVEMENTS

Name of Table: ACHIEVEMENTS  
Primary key constraint name: PK_ACHIEVEMENTS  
Comment: To store achievement definitions used by the gamification system.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing achievement identifier. |
| key | No | VARCHAR(255) | Yes | Unique achievement code used as a stable internal identifier. |
| category | No | VARCHAR(255) | Yes | Classification group for the achievement rule. |
| icon | No | VARCHAR(255) | Yes | Icon asset used to visually represent the achievement. |
| metric | No | VARCHAR(255) | Yes | Metric name used to evaluate whether the achievement is met. |
| threshold | No | INT UNSIGNED | Yes | Target value required before the achievement is unlocked. |
| created_at | No | TIMESTAMP | No | Timestamp when the achievement record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the achievement record was last updated. |

Table 30: USER_ACHIEVEMENTS

Name of Table: USER_ACHIEVEMENTS  
Primary key constraint name: PK_USER_ACHIEVEMENTS  
Comment: To store achievements earned by individual users.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing user achievement identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the user who earned the achievement. |
| achievement_key | No | VARCHAR(255) | Yes | Achievement code recorded for the user; used as the logical link to the achievement definition. |
| achieved_at | No | TIMESTAMP | Yes | Timestamp when the achievement was unlocked. |
| created_at | No | TIMESTAMP | No | Timestamp when the user achievement record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the user achievement record was last updated. |

Table 31: USER_PROGRESS

Name of Table: USER_PROGRESS  
Primary key constraint name: PK_USER_PROGRESS  
Comment: To store aggregated learning, engagement, and gamification progress metrics for each user.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing progress record identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Unique foreign key referencing users.id for the tracked user. |
| total_questions_answered | No | INT UNSIGNED | Yes | Total number of questions answered by the user. |
| total_questions_posted | No | INT UNSIGNED | Yes | Total number of questions contributed by the user. |
| quizzes_completed | No | INT UNSIGNED | Yes | Total number of quizzes completed by the user. |
| correct_answers_count | No | INT UNSIGNED | Yes | Total number of correct answers recorded for the user. |
| total_likes_received | No | INT UNSIGNED | Yes | Total number of likes received on the user's content. |
| quiz_scores | No | JSON | No | Optional JSON history of quiz scores for longitudinal tracking. |
| improvement_score | No | INT | Yes | Computed score representing learning improvement over time. |
| total_post_posted | No | INT UNSIGNED | Yes | Total number of posts created by the user. |
| discussion_posts_created | No | INT | Yes | Total number of discussion-style posts created by the user. |
| questions_answered | No | INT | Yes | Total number of questions answered by the user in discussion threads. |
| accepted_answers_count | No | INT | Yes | Total number of answers from the user that were accepted. |
| created_at | No | TIMESTAMP | No | Timestamp when the progress record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the progress record was last updated. |

Table 32: POINTS_TRANSACTIONS

Name of Table: POINTS_TRANSACTIONS  
Primary key constraint name: PK_POINTS_TRANSACTIONS  
Comment: To store an audit trail of points awarded or deducted for user activities.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing points transaction identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the affected user. |
| points | No | INT | Yes | Number of points credited or debited in the transaction. |
| action | No | VARCHAR(255) | Yes | Action name describing why the points were changed. |
| source_type | No | VARCHAR(255) | Yes | Polymorphic source type that identifies the related event or model. |
| source_id | No | BIGINT UNSIGNED | Yes | Identifier of the source record paired with source_type. |
| created_at | No | TIMESTAMP | No | Timestamp when the points transaction was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the points transaction was last updated. |

Table 33: STUDY_MATERIAL_FEEDBACK

Name of Table: STUDY_MATERIAL_FEEDBACK  
Primary key constraint name: PK_STUDY_MATERIAL_FEEDBACK  
Comment: To store learner feedback and ratings for study materials.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing feedback identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the feedback author. |
| post_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing posts.id for the study material being reviewed. |
| vote | No | TINYINT | No | Optional recommendation vote indicating whether the material was useful. |
| rating | No | TINYINT UNSIGNED | No | Optional numeric rating assigned to the material. |
| feedback | No | TEXT | No | Optional free-text feedback comment written by the user. |
| created_at | No | TIMESTAMP | No | Timestamp when the feedback was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the feedback was last updated. |

Table 34: STUDY_MATERIAL_VIEWS

Name of Table: STUDY_MATERIAL_VIEWS  
Primary key constraint name: PK_STUDY_MATERIAL_VIEWS  
Comment: To store per-user view counts and latest view time for study materials.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing view tracking identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the viewer. |
| post_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing posts.id for the viewed study material. |
| view_count | No | INT UNSIGNED | Yes | Number of times the user has viewed the material. |
| last_viewed_at | No | TIMESTAMP | No | Timestamp of the user's most recent view. |
| created_at | No | TIMESTAMP | No | Timestamp when the view record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the view record was last updated. |

Table 35: MATERIAL_QUIZ_ATTEMPTS

Name of Table: MATERIAL_QUIZ_ATTEMPTS  
Primary key constraint name: PK_MATERIAL_QUIZ_ATTEMPTS  
Comment: To store quiz attempt summaries associated with study materials.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing quiz attempt identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the learner who attempted the quiz. |
| post_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing posts.id for the quiz post. |
| material_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing posts.id for the parent study material. |
| score | No | SMALLINT UNSIGNED | Yes | Raw score achieved on the quiz attempt. |
| total_questions | No | SMALLINT UNSIGNED | Yes | Total number of questions included in the quiz attempt. |
| created_at | No | TIMESTAMP | No | Timestamp when the attempt record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the attempt record was last updated. |

Table 36: STUDY_MATERIAL_VERSIONS

Name of Table: STUDY_MATERIAL_VERSIONS  
Primary key constraint name: PK_STUDY_MATERIAL_VERSIONS  
Comment: To store version history and aggregated review metrics for study materials.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing version record identifier. |
| post_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing posts.id for the material being versioned. |
| version_number | No | INT UNSIGNED | Yes | Sequential version number assigned to the material revision. |
| title | No | VARCHAR(150) | Yes | Title captured for the material version. |
| average_rating | No | DECIMAL(4,2) | Yes | Average rating calculated from user feedback. |
| rating_count | No | INT UNSIGNED | Yes | Number of ratings included in the version summary. |
| recommended_count | No | INT UNSIGNED | Yes | Number of positive recommendation votes recorded. |
| total_votes | No | INT UNSIGNED | Yes | Total number of recommendation votes recorded. |
| recommendation_rate | No | TINYINT UNSIGNED | Yes | Percentage of positive recommendations for the version. |
| created_at | No | TIMESTAMP | No | Timestamp when the version record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the version record was last updated. |

Table 37: TEACHER_APPLICATIONS

Name of Table: TEACHER_APPLICATIONS  
Primary key constraint name: PK_TEACHER_APPLICATIONS  
Comment: To store user applications for teacher status and their supporting information.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing teacher application identifier. |
| user_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing users.id for the applicant. |
| qualification | No | VARCHAR(255) | No | Optional qualification summary provided by the applicant. |
| bio | No | TEXT | No | Optional biography or motivation statement submitted with the application. |
| status | No | VARCHAR(255) | Yes | Application status such as pending, approved, or rejected. |
| admin_note | No | TEXT | No | Optional internal note written by an administrator during review. |
| document_path | No | VARCHAR(255) | No | Optional storage path to the uploaded supporting document. |
| document_original_name | No | VARCHAR(255) | No | Optional original filename of the uploaded supporting document. |
| created_at | No | TIMESTAMP | No | Timestamp when the application was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the application was last updated. |

Table 38: TEACHER_VERIFICATION_DOCUMENTS

Name of Table: TEACHER_VERIFICATION_DOCUMENTS  
Primary key constraint name: PK_TEACHER_VERIFICATION_DOCUMENTS  
Comment: To store verification documents submitted for teacher application review.

Table options:

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | BIGINT UNSIGNED | Yes | Primary key, auto-incrementing verification document identifier. |
| teacher_application_id | No | BIGINT UNSIGNED | Yes | Foreign key referencing teacher_applications.id for the related application. |
| path | No | VARCHAR(255) | Yes | Storage path where the verification document file is saved. |
| original_name | No | VARCHAR(255) | Yes | Original filename of the uploaded verification document. |
| created_at | No | TIMESTAMP | No | Timestamp when the verification document record was created. |
| updated_at | No | TIMESTAMP | No | Timestamp when the verification document record was last updated. |

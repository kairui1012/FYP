Table 1: ACHIEVEMENTS  
Name of Table: ACHIEVEMENTS  
Primary key constraint name: PK_ACHIEVEMENTS  
Comment: To store achievement definitions used for gamification and learner progress tracking  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| category | No | varchar(255) | Yes | Achievement category classification |
| created_at | No | timestamp | No | Record creation timestamp |
| icon | No | varchar(255) | Yes | Icon path or icon identifier |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing achievement identifier |
| key | No | varchar(255) | Yes | Unique logical key for achievement rule lookup |
| metric | No | varchar(255) | Yes | Metric tracked for achievement eligibility |
| threshold | No | int unsigned | Yes | Required metric threshold to unlock achievement |
| updated_at | No | timestamp | No | Record last update timestamp |

Table 2: BADGE_USER  
Name of Table: BADGE_USER  
Primary key constraint name: PK_BADGE_USER  
Comment: To store awarded badge records for users  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| awarded_at | No | timestamp | No | Time when badge was awarded |
| badge_id | No | bigint unsigned | Yes | Referenced badge identifier |
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing award record identifier |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | Referenced user identifier |

Table 3: BADGES  
Name of Table: BADGES  
Primary key constraint name: PK_BADGES  
Comment: To store badge definitions and eligibility point thresholds  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| created_at | No | timestamp | No | Record creation timestamp |
| description | No | varchar(255) | Yes | Badge description text |
| icon | No | varchar(255) | Yes | Badge icon path or identifier |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing badge identifier |
| key | No | varchar(255) | Yes | Unique logical key for the badge |
| name | No | varchar(255) | Yes | Badge display name |
| points_required | No | int unsigned | Yes | Required points to obtain badge |
| updated_at | No | timestamp | No | Record last update timestamp |

Table 4: BOOKMARK_FOLDERS  
Name of Table: BOOKMARK_FOLDERS  
Primary key constraint name: PK_BOOKMARK_FOLDERS  
Comment: To store user-defined bookmark folders for organizing saved posts  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing folder identifier |
| is_default | No | tinyint(1) | Yes | Indicates whether this is the default folder |
| name | No | varchar(255) | Yes | Bookmark folder name |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | Owner user identifier |

Table 5: BOOKMARK_ITEMS  
Name of Table: BOOKMARK_ITEMS  
Primary key constraint name: PK_BOOKMARK_ITEMS  
Comment: To store post bookmark entries linked to user folders  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| bookmark_folder_id | No | bigint unsigned | Yes | Referenced bookmark folder identifier |
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing bookmark item identifier |
| post_id | No | bigint unsigned | Yes | Referenced bookmarked post identifier |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | Owner user identifier |

Table 6: CACHE  
Name of Table: CACHE  
Primary key constraint name: PK_CACHE  
Comment: To store key-value cache entries with expiration metadata  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| expiration | No | int | Yes | Cache expiration epoch or interval marker |
| key | Yes | varchar(255) | Yes | Primary cache key |
| value | No | mediumtext | Yes | Serialized cached value |

Table 7: CACHE_LOCKS  
Name of Table: CACHE_LOCKS  
Primary key constraint name: PK_CACHE_LOCKS  
Comment: To store distributed lock records used by cache-backed synchronization  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| expiration | No | int | Yes | Lock expiration epoch or timeout value |
| key | Yes | varchar(255) | Yes | Primary lock key |
| owner | No | varchar(255) | Yes | Lock owner token or process identifier |

Table 8: COMMENT_LIKES  
Name of Table: COMMENT_LIKES  
Primary key constraint name: PK_COMMENT_LIKES  
Comment: To store user reactions and vote values on comments  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| comment_id | No | bigint unsigned | Yes | Referenced comment identifier |
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing reaction identifier |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | User who reacted to the comment |
| vote | No | smallint | Yes | Vote value representing reaction polarity/intensity |

Table 9: COMMENT_REPORTS  
Name of Table: COMMENT_REPORTS  
Primary key constraint name: PK_COMMENT_REPORTS  
Comment: To store moderation reports submitted for comments  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| comment_id | No | bigint unsigned | Yes | Reported comment identifier |
| created_at | No | timestamp | No | Report creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing report identifier |
| moderation_queued_at | No | timestamp | No | Time report entered moderation queue |
| reason | No | varchar(255) | Yes | Report reason provided by reporter |
| status | No | varchar(32) | Yes | Moderation lifecycle status |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | Reporter user identifier |

Table 10: COMMENTS  
Name of Table: COMMENTS  
Primary key constraint name: PK_COMMENTS  
Comment: To store comments, threaded replies, and answer metadata on posts  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| attachments | No | json | No | Attached files metadata in JSON format |
| content | No | text | Yes | Main comment body text |
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing comment identifier |
| is_accepted | No | tinyint(1) | Yes | Indicates accepted solution status |
| is_answer | No | tinyint(1) | Yes | Indicates whether entry is marked as an answer |
| mentions | No | json | No | Mentioned users metadata in JSON format |
| parent_id | No | bigint unsigned | No | Parent comment identifier for thread nesting |
| post_id | No | bigint unsigned | Yes | Referenced post identifier |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | Author user identifier |

Table 11: FAILED_JOBS  
Name of Table: FAILED_JOBS  
Primary key constraint name: PK_FAILED_JOBS  
Comment: To store failed asynchronous job executions and their exception payloads  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| connection | No | text | Yes | Queue connection name used by the job |
| exception | No | longtext | Yes | Full exception traceback and message |
| failed_at | No | timestamp | Yes | Time when job failure occurred |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing failed job identifier |
| payload | No | longtext | Yes | Serialized job payload |
| queue | No | text | Yes | Queue name from which job was processed |
| uuid | No | varchar(255) | Yes | Unique job UUID |

Table 12: FOLLOWS  
Name of Table: FOLLOWS  
Primary key constraint name: PK_FOLLOWS  
Comment: To store follower-following relationships between users  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| created_at | No | timestamp | No | Record creation timestamp |
| follower_id | No | bigint unsigned | Yes | User initiating the follow relationship |
| following_id | No | bigint unsigned | Yes | User being followed |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing follow record identifier |
| updated_at | No | timestamp | No | Record last update timestamp |

Table 13: JOB_BATCHES  
Name of Table: JOB_BATCHES  
Primary key constraint name: PK_JOB_BATCHES  
Comment: To store batched queue job execution metadata  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| cancelled_at | No | int | No | Cancellation time as integer timestamp |
| created_at | No | int | Yes | Creation time as integer timestamp |
| failed_job_ids | No | longtext | Yes | Serialized list of failed job identifiers |
| failed_jobs | No | int | Yes | Number of failed jobs in the batch |
| finished_at | No | int | No | Completion time as integer timestamp |
| id | Yes | varchar(255) | Yes | Primary key batch identifier |
| name | No | varchar(255) | Yes | Human-readable batch name |
| options | No | mediumtext | No | Serialized batch execution options |
| pending_jobs | No | int | Yes | Number of pending jobs |
| total_jobs | No | int | Yes | Total number of jobs in the batch |

Table 14: JOBS  
Name of Table: JOBS  
Primary key constraint name: PK_JOBS  
Comment: To store queued job payloads pending asynchronous execution  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| attempts | No | tinyint unsigned | Yes | Number of processing attempts |
| available_at | No | int unsigned | Yes | Earliest execution time as Unix timestamp |
| created_at | No | int unsigned | Yes | Enqueue time as Unix timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing queued job identifier |
| payload | No | longtext | Yes | Serialized job payload |
| queue | No | varchar(255) | Yes | Queue channel name |
| reserved_at | No | int unsigned | No | Reservation time as Unix timestamp |

Table 15: LANGUAGES  
Name of Table: LANGUAGES  
Primary key constraint name: PK_LANGUAGES  
Comment: To store supported language metadata for content localization and tagging  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| code | No | varchar(255) | Yes | Language code (e.g., en, ms) |
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing language identifier |
| name | No | varchar(255) | Yes | Language display name |
| updated_at | No | timestamp | No | Record last update timestamp |

Table 16: LESSONS  
Name of Table: LESSONS  
Primary key constraint name: PK_LESSONS  
Comment: To store lesson entities linked to subjects and source learning material posts  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing lesson identifier |
| is_published | No | tinyint(1) | Yes | Publication status flag |
| sequence | No | int unsigned | Yes | Ordered sequence within subject progression |
| source_post_id | No | bigint unsigned | No | Referenced source post identifier |
| subject_id | No | bigint unsigned | Yes | Referenced subject identifier |
| title | No | varchar(255) | Yes | Lesson title |
| updated_at | No | timestamp | No | Record last update timestamp |

Table 17: LIKES  
Name of Table: LIKES  
Primary key constraint name: PK_LIKES  
Comment: To store user likes associated with posts  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing like identifier |
| post_id | No | bigint unsigned | Yes | Liked post identifier |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | User who liked the post |

Table 18: MATERIAL_QUIZ_ATTEMPTS  
Name of Table: MATERIAL_QUIZ_ATTEMPTS  
Primary key constraint name: PK_MATERIAL_QUIZ_ATTEMPTS  
Comment: To store user quiz attempt data for study materials and assessment outcomes  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| answers | No | json | No | Submitted answers in JSON format |
| created_at | No | timestamp | No | Attempt creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing quiz attempt identifier |
| material_id | No | bigint unsigned | No | Referenced material identifier |
| passed | No | tinyint(1) | Yes | Pass/fail flag for the attempt |
| post_id | No | bigint unsigned | Yes | Referenced quiz post identifier |
| score | No | decimal(5,2) | Yes | Numeric score achieved |
| time_taken | No | int | Yes | Completion time in seconds |
| total_questions | No | int unsigned | Yes | Total number of questions in the attempt |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | Attempting user identifier |

Table 19: MIGRATIONS  
Name of Table: MIGRATIONS  
Primary key constraint name: PK_MIGRATIONS  
Comment: To track executed database migration files and their batch order  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| batch | No | int | Yes | Migration batch execution number |
| id | Yes | int unsigned | Yes | Primary key, auto-incrementing migration record identifier |
| migration | No | varchar(255) | Yes | Migration class/file name |

Table 20: PASSWORD_RESET_TOKENS  
Name of Table: PASSWORD_RESET_TOKENS  
Primary key constraint name: PK_PASSWORD_RESET_TOKENS  
Comment: To store password reset tokens associated with user email addresses  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| created_at | No | timestamp | No | Token issuance timestamp |
| email | Yes | varchar(255) | Yes | Primary email identifier for reset lookup |
| token | No | varchar(255) | Yes | Password reset token value |

Table 21: POINTS_TRANSACTIONS  
Name of Table: POINTS_TRANSACTIONS  
Primary key constraint name: PK_POINTS_TRANSACTIONS  
Comment: To store auditable point changes and source actions per user  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| action | No | varchar(255) | Yes | Action type causing point transaction |
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing transaction identifier |
| points | No | int | Yes | Points delta (positive or negative) |
| source_id | No | bigint unsigned | No | Polymorphic source record identifier |
| source_type | No | varchar(255) | No | Polymorphic source model/type |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | User affected by points transaction |

Table 22: POST_REPORTS  
Name of Table: POST_REPORTS  
Primary key constraint name: PK_POST_REPORTS  
Comment: To store moderation reports submitted for posts  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| created_at | No | timestamp | No | Report creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing report identifier |
| moderation_queued_at | No | timestamp | No | Time report entered moderation queue |
| post_id | No | bigint unsigned | Yes | Reported post identifier |
| reason | No | varchar(255) | Yes | Report reason provided by reporter |
| status | No | varchar(32) | Yes | Moderation status |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | Reporter user identifier |

Table 23: POSTS  
Name of Table: POSTS  
Primary key constraint name: PK_POSTS  
Comment: To store discussion posts, questions, and study material content with rich metadata  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| attachments | No | json | No | Attached resources metadata in JSON format |
| content | No | text | No | Main post body content |
| content_blocks | No | json | No | Structured content blocks in JSON format |
| created_at | No | timestamp | No | Record creation timestamp |
| difficulty_level | No | varchar(255) | No | Difficulty level classification |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing post identifier |
| image | No | json | No | Image metadata in JSON format |
| is_anonymous | No | tinyint(1) | Yes | Indicates whether author identity is hidden |
| is_discussion | No | tinyint(1) | Yes | Indicates whether post is discussion-type |
| language_id | No | bigint unsigned | No | Referenced language identifier |
| learning_objectives | No | json | No | Learning objective definitions in JSON format |
| lesson_id | No | bigint unsigned | No | Referenced lesson identifier |
| material_improved_from_feedback | No | tinyint(1) | Yes | Indicates whether material was revised from feedback |
| parent_material_id | No | bigint unsigned | No | Parent material post identifier |
| post_type | No | varchar(20) | Yes | Post classification type |
| quiz_data | No | json | No | Embedded quiz configuration in JSON format |
| subject_id | No | bigint unsigned | No | Referenced subject identifier |
| title | No | varchar(255) | Yes | Post title |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | Author user identifier |
| video_url | No | varchar(255) | No | External video URL |

Table 24: PROFILES  
Name of Table: PROFILES  
Primary key constraint name: PK_PROFILES  
Comment: To store extended user profile information and avatar metadata  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| about | No | text | No | User biography/about section |
| avatar | No | varchar(255) | No | Avatar image path or URL |
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing profile identifier |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | Referenced user identifier |

Table 25: QUIZ_COMPLETIONS  
Name of Table: QUIZ_COMPLETIONS  
Primary key constraint name: PK_QUIZ_COMPLETIONS  
Comment: To store completed quiz events by user and subject context  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| completed_at | No | timestamp | No | Time quiz completion was recorded |
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing completion identifier |
| post_id | No | bigint unsigned | Yes | Completed quiz post identifier |
| subject_id | No | bigint unsigned | No | Associated subject identifier |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | User who completed the quiz |

Table 26: QUIZ_MISTAKES  
Name of Table: QUIZ_MISTAKES  
Primary key constraint name: PK_QUIZ_MISTAKES  
Comment: To store per-question mistake analytics from user quiz attempts  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| attempted_at | No | timestamp | No | Time question attempt occurred |
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing mistake record identifier |
| is_correct | No | tinyint(1) | Yes | Whether the selected answer was correct |
| post_id | No | bigint unsigned | Yes | Referenced quiz post identifier |
| question_index | No | int unsigned | Yes | Zero-based or one-based question index |
| selected_answer_index | No | int unsigned | Yes | Selected answer option index |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | User who attempted the question |

Table 27: SESSIONS  
Name of Table: SESSIONS  
Primary key constraint name: PK_SESSIONS  
Comment: To store authenticated and guest session state data  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| id | Yes | varchar(255) | Yes | Primary session identifier |
| ip_address | No | varchar(45) | No | Client IP address |
| last_activity | No | int | Yes | Last activity Unix timestamp |
| payload | No | longtext | Yes | Serialized session payload |
| user_agent | No | text | No | Client user agent string |
| user_id | No | bigint unsigned | No | Authenticated user identifier linked to session |

Table 28: SOCIAL_ACCOUNTS  
Name of Table: SOCIAL_ACCOUNTS  
Primary key constraint name: PK_SOCIAL_ACCOUNTS  
Comment: To store external social login account mappings for users  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| avatar | No | varchar(255) | No | Social provider avatar URL |
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing social account identifier |
| provider | No | varchar(255) | Yes | Social authentication provider name |
| provider_id | No | varchar(255) | Yes | Provider-specific user identifier |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | Local user identifier |

Table 29: STUDY_MATERIAL_FEEDBACK  
Name of Table: STUDY_MATERIAL_FEEDBACK  
Primary key constraint name: PK_STUDY_MATERIAL_FEEDBACK  
Comment: To store user ratings and textual feedback for study materials  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| created_at | No | timestamp | No | Feedback creation timestamp |
| feedback | No | text | No | Free-text feedback comments |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing feedback identifier |
| post_id | No | bigint unsigned | Yes | Referenced study material post identifier |
| rating | No | tinyint unsigned | Yes | Numeric rating value |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | User providing feedback |
| vote | No | tinyint | Yes | Vote flag/value associated with feedback |

Table 30: STUDY_MATERIAL_VERSIONS  
Name of Table: STUDY_MATERIAL_VERSIONS  
Primary key constraint name: PK_STUDY_MATERIAL_VERSIONS  
Comment: To store version history snapshots for study material content  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| change_summary | No | text | No | Summary of changes introduced in this version |
| content | No | text | No | Versioned material content body |
| content_blocks | No | json | No | Structured content blocks snapshot |
| created_at | No | timestamp | No | Version creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing version identifier |
| post_id | No | bigint unsigned | Yes | Referenced study material post identifier |
| title | No | varchar(255) | Yes | Versioned material title |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | User who created the version |
| version_number | No | int | Yes | Sequential version number |

Table 31: STUDY_MATERIAL_VIEWS  
Name of Table: STUDY_MATERIAL_VIEWS  
Primary key constraint name: PK_STUDY_MATERIAL_VIEWS  
Comment: To store user view tracking statistics for study materials  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing view record identifier |
| last_viewed_at | No | timestamp | No | Most recent view timestamp |
| post_id | No | bigint unsigned | Yes | Referenced study material post identifier |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | Viewer user identifier |
| view_count | No | int | Yes | Accumulated view count |

Table 32: SUBJECTS  
Name of Table: SUBJECTS  
Primary key constraint name: PK_SUBJECTS  
Comment: To store subject taxonomy used to classify lessons and materials  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing subject identifier |
| name | No | varchar(255) | Yes | Subject name |
| updated_at | No | timestamp | No | Record last update timestamp |

Table 33: TEACHER_APPLICATIONS  
Name of Table: TEACHER_APPLICATIONS  
Primary key constraint name: PK_TEACHER_APPLICATIONS  
Comment: To store teacher role application submissions and document metadata  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| created_at | No | timestamp | No | Application creation timestamp |
| document_original_name | No | varchar(255) | Yes | Original uploaded document filename |
| document_path | No | varchar(255) | Yes | Stored file path for application document |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing application identifier |
| reason | No | text | Yes | Applicant statement or justification |
| status | No | varchar(255) | Yes | Application review status |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | Applicant user identifier |

Table 34: TEACHER_VERIFICATION_DOCUMENTS  
Name of Table: TEACHER_VERIFICATION_DOCUMENTS  
Primary key constraint name: PK_TEACHER_VERIFICATION_DOCUMENTS  
Comment: To store teacher verification document submissions and review outcomes  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| created_at | No | timestamp | No | Record creation timestamp |
| document_type | No | varchar(255) | Yes | Type/category of verification document |
| file_path | No | varchar(255) | Yes | Stored path to uploaded document |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing verification document identifier |
| status | No | varchar(255) | Yes | Verification workflow status |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | User associated with the document |
| verification_notes | No | text | No | Reviewer notes about verification outcome |
| verified_at | No | timestamp | No | Timestamp when verification was finalized |

Table 35: USER_ACHIEVEMENTS  
Name of Table: USER_ACHIEVEMENTS  
Primary key constraint name: PK_USER_ACHIEVEMENTS  
Comment: To store achieved achievement records for individual users  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| achieved_at | No | timestamp | No | Time achievement was unlocked |
| achievement_key | No | varchar(255) | Yes | Logical key of unlocked achievement |
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing user achievement identifier |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | User who unlocked the achievement |

Table 36: USER_FEATURED_BADGES  
Name of Table: USER_FEATURED_BADGES  
Primary key constraint name: PK_USER_FEATURED_BADGES  
Comment: To store user-selected badges highlighted on public profiles or leaderboard views  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| badge_id | No | bigint unsigned | Yes | Featured badge identifier |
| created_at | No | timestamp | No | Record creation timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing featured badge record identifier |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | User owning the featured badge entry |

Table 37: USER_PROGRESS  
Name of Table: USER_PROGRESS  
Primary key constraint name: PK_USER_PROGRESS  
Comment: To store aggregate learning and contribution progress metrics per user  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| accepted_answers_count | No | int | Yes | Total accepted answers count |
| correct_answers_count | No | int unsigned | Yes | Total correct answers count |
| created_at | No | timestamp | No | Record creation timestamp |
| discussion_posts_created | No | int | Yes | Number of discussion posts created |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing progress record identifier |
| improvement_score | No | int | Yes | Composite improvement score metric |
| questions_answered | No | int | Yes | Number of questions answered |
| quiz_scores | No | json | No | Aggregated quiz score details in JSON format |
| quizzes_completed | No | int unsigned | Yes | Number of quizzes completed |
| total_likes_received | No | int unsigned | Yes | Total likes received across content |
| total_post_posted | No | int unsigned | Yes | Total posts published by user |
| total_questions_answered | No | int unsigned | Yes | Total question responses submitted |
| total_questions_posted | No | int unsigned | Yes | Total questions created |
| updated_at | No | timestamp | No | Record last update timestamp |
| user_id | No | bigint unsigned | Yes | Referenced user identifier |

Table 38: USERS  
Name of Table: USERS  
Primary key constraint name: PK_USERS  
Comment: To store user account information, role authorization data, and profile-level security settings  

Table options: Assumed Laravel default table options (InnoDB, utf8mb4), unless otherwise configured.

| Column Name | Primary Key | Data Type | NOT NULL | Description |
|---|---|---|---|---|
| created_at | No | timestamp | No | Record creation timestamp |
| email | No | varchar(255) | Yes | User login email address |
| email_verified_at | No | timestamp | No | Email verification completion timestamp |
| id | Yes | bigint unsigned | Yes | Primary key, auto-incrementing user identifier |
| is_blocked | No | tinyint(1) | Yes | Account block status flag |
| is_verified | No | tinyint(1) | Yes | Manual/admin verification status flag |
| locale | No | varchar(5) | Yes | Preferred locale code |
| name | No | varchar(255) | Yes | User display/full name |
| password | No | varchar(255) | Yes | Hashed password value |
| points | No | int unsigned | Yes | Current points balance |
| remember_token | No | varchar(100) | No | Persistent login remember token |
| role | No | varchar(20) | Yes | Authorization role code |
| show_leaderboard_badge | No | tinyint(1) | Yes | Visibility flag for leaderboard badge |
| show_on_leaderboard | No | tinyint(1) | Yes | Visibility flag for leaderboard listing |
| total_points | No | int unsigned | Yes | Lifetime accumulated points |
| two_factor_confirmed_at | No | timestamp | No | Timestamp for confirmed two-factor setup |
| two_factor_recovery_codes | No | text | No | Stored two-factor recovery codes |
| two_factor_secret | No | text | No | Encrypted two-factor secret |
| updated_at | No | timestamp | No | Record last update timestamp |

---

## Laravel Built-in / System Tables Check

This section separates Laravel framework/system tables from project business tables before drawing the ERD or deleting unused tables.

### Can Usually Be Removed From The Business ERD

These tables are Laravel framework infrastructure tables. They are not part of the learning/community business domain, so they can usually be excluded from the ERD diagram.

| Table | Source | Purpose | Delete From Database? |
|---|---|---|---|
| cache | Laravel default cache table | Stores application cache key-value records | Delete only if the app does not use database cache driver |
| cache_locks | Laravel default cache table | Stores atomic lock records for cache-based locking | Delete only if database cache/locks are not used |
| jobs | Laravel default queue table | Stores pending queued jobs | Delete only if the app does not use database queue driver |
| job_batches | Laravel default queue batching table | Stores batch job metadata | Delete only if queued job batches are not used |
| failed_jobs | Laravel default queue table | Stores failed queue job payloads | Delete only if queues are not used or failed job logging is unnecessary |
| sessions | Laravel default session table | Stores logged-in browser session payloads when using database sessions | Delete only if SESSION_DRIVER is not database |
| password_reset_tokens | Laravel default auth table | Stores password reset tokens | Delete only if password reset feature is removed |
| migrations | Laravel internal table, created automatically by Laravel | Tracks which migration files have run | Do not include in ERD; do not delete while using migrations |

### Laravel Default But Extended By This Project

| Table | Why It Looks Laravel Default | Why It Should Be Kept |
|---|---|---|
| users | Laravel creates a users table by default | This project adds business fields such as points, total_points, locale, role, leaderboard flags, blocked/verified status, and 2FA fields. Keep this table as a core ERD entity. |

Default-like columns inside `users`: `id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`.

Project-specific columns inside `users`: `points`, `locale`, `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_confirmed_at`, `total_points`, `show_on_leaderboard`, `show_leaderboard_badge`, `is_blocked`, `is_verified`, `role`.

### Project Business Tables To Keep In ERD

These tables represent the application domain and should be kept in the ERD unless the related feature is being removed.

| Feature Area | Tables |
|---|---|
| User identity and social profile | users, profiles, social_accounts, follows |
| Content structure | languages, subjects, lessons, posts |
| Community interaction | comments, likes, comment_likes, comment_reports, post_reports |
| Bookmarks | bookmark_folders, bookmark_items |
| Quiz and learning progress | quiz_completions, quiz_mistakes, material_quiz_attempts, study_material_views, study_material_feedback, study_material_versions, user_progress |
| Gamification | badges, badge_user, user_featured_badges, achievements, user_achievements, points_transactions |
| Teacher verification | teacher_applications, teacher_verification_documents |

## ERD Relationships

Use the relationships below when drawing the ERD. The left side is the parent table and the right side is the child table containing the foreign key.

### User And Profile

| Relationship | Cardinality | Foreign Key | Delete Rule |
|---|---|---|---|
| users -> profiles | 1 to 0..1 | profiles.user_id -> users.id | Cascade delete |
| users -> social_accounts | 1 to many | social_accounts.user_id -> users.id | Cascade delete |
| users -> follows as follower | 1 to many | follows.follower_id -> users.id | Cascade delete |
| users -> follows as following | 1 to many | follows.following_id -> users.id | Cascade delete |

### Content Structure

| Relationship | Cardinality | Foreign Key | Delete Rule |
|---|---|---|---|
| subjects -> lessons | 1 to many | lessons.subject_id -> subjects.id | Cascade delete |
| users -> posts | 1 to many | posts.user_id -> users.id | Cascade delete |
| subjects -> posts | 1 to many | posts.subject_id -> subjects.id | Cascade delete |
| lessons -> posts | 1 to many | posts.lesson_id -> lessons.id | Cascade delete |
| languages -> posts | 1 to many | posts.language_id -> languages.id | Cascade delete |
| posts -> posts as parent material | 1 to many | posts.parent_material_id -> posts.id | Cascade/null delete, depending on migration path |
| posts -> lessons as source post | 1 to 0..1 | lessons.source_post_id -> posts.id | Null on delete |

### Comments And Reactions

| Relationship | Cardinality | Foreign Key | Delete Rule |
|---|---|---|---|
| users -> comments | 1 to many | comments.user_id -> users.id | Cascade delete |
| posts -> comments | 1 to many | comments.post_id -> posts.id | Cascade delete |
| comments -> comments as parent comment | 1 to many | comments.parent_id -> comments.id | Cascade delete |
| users -> likes | 1 to many | likes.user_id -> users.id | Cascade delete |
| posts -> likes | 1 to many | likes.post_id -> posts.id | Cascade delete |
| users -> comment_likes | 1 to many | comment_likes.user_id -> users.id | Cascade delete |
| comments -> comment_likes | 1 to many | comment_likes.comment_id -> comments.id | Cascade delete |
| users -> comment_reports | 1 to many | comment_reports.user_id -> users.id | Cascade delete |
| comments -> comment_reports | 1 to many | comment_reports.comment_id -> comments.id | Cascade delete |
| users -> post_reports | 1 to many | post_reports.user_id -> users.id | Cascade delete |
| posts -> post_reports | 1 to many | post_reports.post_id -> posts.id | Cascade delete |

### Bookmarks

| Relationship | Cardinality | Foreign Key | Delete Rule |
|---|---|---|---|
| users -> bookmark_folders | 1 to many | bookmark_folders.user_id -> users.id | Cascade delete |
| users -> bookmark_items | 1 to many | bookmark_items.user_id -> users.id | Cascade delete |
| bookmark_folders -> bookmark_items | 1 to many | bookmark_items.bookmark_folder_id -> bookmark_folders.id | Cascade delete |
| posts -> bookmark_items | 1 to many | bookmark_items.post_id -> posts.id | Cascade delete |

### Quiz And Learning Progress

| Relationship | Cardinality | Foreign Key | Delete Rule |
|---|---|---|---|
| users -> quiz_completions | 1 to many | quiz_completions.user_id -> users.id | Cascade delete |
| posts -> quiz_completions | 1 to many | quiz_completions.post_id -> posts.id | Cascade delete |
| subjects -> quiz_completions | 1 to many | quiz_completions.subject_id -> subjects.id | Null on delete |
| users -> quiz_mistakes | 1 to many | quiz_mistakes.user_id -> users.id | Cascade delete |
| posts -> quiz_mistakes | 1 to many | quiz_mistakes.post_id -> posts.id | Cascade delete |
| users -> study_material_feedback | 1 to many | study_material_feedback.user_id -> users.id | Cascade delete |
| posts -> study_material_feedback | 1 to many | study_material_feedback.post_id -> posts.id | Cascade delete |
| users -> study_material_views | 1 to many | study_material_views.user_id -> users.id | Cascade delete |
| posts -> study_material_views | 1 to many | study_material_views.post_id -> posts.id | Cascade delete |
| users -> material_quiz_attempts | 1 to many | material_quiz_attempts.user_id -> users.id | Cascade delete |
| posts -> material_quiz_attempts as quiz post | 1 to many | material_quiz_attempts.post_id -> posts.id | Cascade delete |
| posts -> material_quiz_attempts as material | 1 to many | material_quiz_attempts.material_id -> posts.id | Cascade delete |
| posts -> study_material_versions | 1 to many | study_material_versions.post_id -> posts.id | Cascade delete |
| users -> study_material_versions | 1 to many | study_material_versions.user_id -> users.id | Cascade delete |
| users -> user_progress | 1 to 0..1 | user_progress.user_id -> users.id | Cascade delete |

### Gamification

| Relationship | Cardinality | Foreign Key | Delete Rule |
|---|---|---|---|
| users -> badge_user | many to many bridge | badge_user.user_id -> users.id | Cascade delete |
| badges -> badge_user | many to many bridge | badge_user.badge_id -> badges.id | Cascade delete |
| users -> user_featured_badges | 1 to many | user_featured_badges.user_id -> users.id | Cascade delete |
| badges -> user_featured_badges | 1 to many | user_featured_badges.badge_id -> badges.id | Cascade delete |
| users -> user_achievements | 1 to many | user_achievements.user_id -> users.id | Cascade delete |
| users -> points_transactions | 1 to many | points_transactions.user_id -> users.id | Cascade delete |

Note: `user_achievements.achievement_key` stores the achievement key as text. The migration does not define a physical foreign key to `achievements.key`, but for ERD readability you may draw it as a logical relationship: `achievements.key -> user_achievements.achievement_key`.

### Teacher Verification

| Relationship | Cardinality | Foreign Key | Delete Rule |
|---|---|---|---|
| users -> teacher_applications | 1 to many | teacher_applications.user_id -> users.id | Cascade delete |
| users -> teacher_verification_documents | 1 to many | teacher_verification_documents.user_id -> users.id | Cascade delete |

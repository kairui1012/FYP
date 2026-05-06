# Database Migrations Summary

This directory contains Laravel migrations that recreate the complete database schema from `mysql-schema.sql`.

## Migration Files Overview

### 1. **2026_01_01_000000_create_users_and_framework_tables.php**
Creates foundational Laravel tables:
- `users` - User accounts with authentication and leaderboard data
- `cache` - Cache storage
- `cache_locks` - Cache locking mechanism
- `jobs` - Queue jobs
- `job_batches` - Job batch tracking
- `failed_jobs` - Failed job logging
- `sessions` - Session management
- `password_reset_tokens` - Password reset tokens
- `migrations` - Migration history

### 2. **2026_01_02_000000_create_profiles_social_accounts_and_follows_tables.php**
User profiles and social features:
- `profiles` - User profile information (avatar, about)
- `social_accounts` - OAuth/Social login accounts
- `follows` - User following relationships

### 3. **2026_01_03_000000_create_languages_subjects_and_lessons_tables.php**
Learning content structure:
- `languages` - Supported languages (en, my, zh)
- `subjects` - Course subjects
- `lessons` - Lessons within subjects with sequences

### 4. **2026_01_04_000000_create_posts_table_with_lesson_and_language_links.php**
Main content table:
- `posts` - Study materials, quizzes, and discussion posts
  - Supports multiple post types: material, quiz, discussion
  - Stores quiz data, content blocks, videos
  - Links to subjects, lessons, and languages

### 5. **2026_01_04_100000_add_source_post_fk_to_lessons_table.php**
Adds foreign key constraint from lessons to posts (deferred due to dependency order)

### 6. **2026_01_05_000000_create_likes_comments_reports_and_saves_tables.php**
User interactions with content:
- `likes` - Post likes
- `comments` - Post comments with threading
- `comment_likes` - Comment voting
- `comment_reports` - Comment moderation reports
- `post_saves` - Bookmarked posts (drafts)

### 7. **2026_01_06_000000_create_bookmark_folders_and_items_tables.php**
Bookmark management:
- `bookmark_folders` - User-created bookmark collections
- `bookmark_items` - Individual bookmarked posts within folders

### 8. **2026_01_07_000000_create_quiz_completions_and_mistakes_tables.php**
Quiz functionality:
- `quiz_completions` - Quiz completion tracking with timestamps
- `quiz_mistakes` - Individual quiz answer tracking for mistakes/learning

### 9. **2026_01_08_000000_create_badges_achievements_progress_and_points_tables.php**
Points and achievement system:
- `badges` - Achievement badges with point requirements
- `badge_user` - User badge awards with timestamps
- `user_featured_badges` - Featured badges on user profile
- `achievements` - Achievement definitions (metric-based)
- `user_achievements` - User achievement progress
- `user_progress` - Aggregated user statistics
- `points_transactions` - Point transaction audit log

### 10. **2026_01_09_000000_create_study_material_feedback_views_attempts_and_versions_tables.php**
Learning support features:
- `study_material_feedback` - User ratings and feedback
- `study_material_views` - View tracking and statistics
- `material_quiz_attempts` - Quiz attempt details with scores
- `study_material_versions` - Version history for content updates

### 11. **2026_01_10_000000_create_teacher_applications_and_documents_tables.php**
Teacher certification and verification:
- `teacher_applications` - Teacher role applications
- `teacher_verification_documents` - Document uploads for verification

### 12. **2026_01_11_000000_add_objective_three_fields_to_posts_comments_and_progress.php**
Additional fields for learning support (Objective 3):
- Q&A features on posts and comments
- Difficulty levels and learning objectives
- Discussion tracking in user progress

## Key Features

### User Management
- Support for multiple authentication methods (email + OAuth)
- User profiles with avatars and bios
- Blocking and verification status
- Leaderboard integration with privacy controls

### Content Management
- Multiple content types (study materials, quizzes, discussions)
- Multi-language support
- Course/subject organization
- Lessons and sequencing
- Content versioning

### Social Features
- Following system
- Comments with threading and voting
- Post likes and saves
- Comment reporting for moderation

### Learning & Gamification
- Quiz system with mistake tracking
- Badge and achievement system
- Points tracking and transactions
- User progress metrics
- Study material feedback and ratings

### Teacher Features
- Teacher application workflow
- Document verification system
- Teacher verification status

## Running the Migrations

```bash
# Run all pending migrations
php artisan migrate

# Run specific migration
php artisan migrate --path=database/migrations/2026_01_01_000000_create_users_and_framework_tables.php

# Rollback all migrations
php artisan migrate:rollback

# Reset database (rollback all, then re-run)
php artisan migrate:reset
php artisan migrate
```

## Notes

- Migrations are ordered by dependency (users must be created before profiles, posts must exist before quiz_completions, etc.)
- The `2026_04_29_*` and later migrations already marked as `Ran` should keep their current filenames to avoid duplicate execution risk.
- All timestamps use UTC by default
- Soft deletes are not used; cascading deletes are used instead
- Foreign keys enforce referential integrity
- Indexes are created for commonly queried columns
- Multiple unique constraints prevent duplicate data

## Mapping from mysql-schema.sql

All tables from the mysql-schema.sql export have been converted to Laravel migrations with:
- Proper column types and constraints
- Laravel conventions (timestamps, relationships)
- Index optimization
- Foreign key relationships
- Unique constraints preserved

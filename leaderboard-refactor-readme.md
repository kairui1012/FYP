# Leaderboard Refactor README

This document defines the confirmed scope, boundaries, and execution steps for refactoring the Leaderboard feature in this Laravel + React + Inertia.js + TypeScript project.

The refactor must follow a safe **Dual-Track points system**, keeping the existing achievement and badge points system untouched.

---

## 1. Core Decision: Dual-Track Points System

The existing points system must remain intact.

Do **not** modify:

- `app/Services/AchievementService.php`
- `LikeController.php` calls to `AchievementService`
- The existing `users.points` column
- The existing `users.points` formula

The existing `users.points` field continues to be used by badges and achievements.

A new separate leaderboard system will be added:

- `users.total_points`
- `users.show_on_leaderboard`
- `points_transactions` table
- New `PointsService`

The new `PointsService` writes only to:

- `users.total_points`
- `points_transactions`

The old achievement system and the new leaderboard system must run in parallel and never touch each other.

---

## 2. i18n Decision

Use the existing `@erag/lang-sync-inertia` setup.

Rules:

- Use `trans()`
- Do **not** introduce `react-i18next`
- Do **not** change the existing i18n setup

Translation files to update:

- `lang/en/leaderboard.php`
- `lang/zh/leaderboard.php`
- `lang/my/leaderboard.php`

New keys may be added, but existing keys must not be deleted.

If an old key looks unused, do not delete it. Mark it as a possible removal candidate in the final summary instead.

---

## 3. Hard Boundaries

Do not create, modify, rename, or delete anything outside the leaderboard scope.

### Off-Limits Files

Do **not** touch:

- `app/Services/AchievementService.php`
- `app/Http/Controllers/AchievementsController.php`
- `app/Http/Controllers/LikeController.php`
- `app/Http/Controllers/CommentLikeController.php`
- `app/Http/Controllers/CommentController.php`
- `app/Http/Controllers/PostController.php`
- `app/Http/Controllers/FollowerController.php`
- `app/Http/Controllers/Settings/ProfileController.php`
- Any file under `app/Models/` except `User.php`
- Any existing migration
- Any route in `routes/web.php` except the `/leaderboard` route

### Off-Limits Database Operations

Do **not**:

- Alter the existing `users.points` column
- Alter or drop any existing table
- Add foreign keys to existing tables except the new `points_transactions` table
- Touch `badges`, `user_progress`, `achievements`, or `user_achievements` tables
- Run `php artisan migrate`

If the work requires touching any off-limits file, stop and ask before proceeding.

---

## 4. Authorized Changes

### 4.1 Database

Create a migration to add these columns to the `users` table:

```php
$table->integer('total_points')->default(0)->index();
$table->boolean('show_on_leaderboard')->default(true);
```

Create a migration for a new `points_transactions` table:

```php
$table->id();
$table->foreignId('user_id')->constrained()->cascadeOnDelete();
$table->integer('points');
$table->string('action');
$table->morphs('source');
$table->timestamps();
$table->index(['user_id', 'created_at']);
```

Do not run migrations during implementation.

---

### 4.2 Backend Files

Create:

```txt
app/Services/PointsService.php
```

Update only:

```txt
app/Models/User.php
```

Allowed `User.php` changes only:

- Add `total_points` to `$fillable`
- Add `show_on_leaderboard` to `$fillable`
- Add `pointsTransactions()` relationship

Rewrite allowed:

```txt
app/Http/Controllers/LeaderboardController.php
```

---

### 4.3 Frontend Files

Rewrite allowed:

```txt
resources/js/Pages/Leaderboard.tsx
```

Create:

```txt
resources/js/Components/LeaderboardRow.tsx
resources/js/Components/PodiumCard.tsx
```

Use Tailwind utility classes only.

---

## 5. Points Rules

The points rules belong only inside `PointsService`.

Do not wire `PointsService` into existing controllers yet.

| Action | Points |
|---|---:|
| `question_asked` | +2 |
| `answer_posted` | +5 |
| `question_upvoted` | +5 |
| `answer_upvoted` | +10 |
| `best_answer_marked` | +15 |
| `resource_uploaded` | +3 |
| `resource_bookmarked` | +2 |
| `follower_gained` | +5 |
| `content_downvoted` | -2 |

### PointsService Requirements

`PointsService` must provide:

- `award()`
- `revoke()`

Rules:

- Prevent self-award or self-upvote when the actor is the same as the receiving user
- Calling `revoke()` with the same action and source reverses the transaction
- All operations must be wrapped in database transactions
- Update only `users.total_points`
- Write only to `points_transactions`
- Do not touch `AchievementService`
- Do not touch `users.points`
- Anonymous posts still credit the original `user_id`; the caller handles anonymity

---

## 6. Leaderboard Requirements

The leaderboard must have three tabs:

| Tab | Source |
|---|---|
| All Time | `users.total_points` |
| This Week | Sum of `points_transactions.points` where `created_at >= now()->subDays(7)` |
| This Month | Sum of `points_transactions.points` where `created_at >= now()->subDays(30)` |

Default tab:

```txt
This Week
```

Query rules:

- Filter with `show_on_leaderboard = true`
- Cache leaderboard query for 5 minutes using `Cache::remember`
- Top 3 users displayed as podium
- Ranks 4–50 displayed in a list with pagination
- Sticky banner: `You are ranked #X with Y points`
- Highlight current user's row
- Mobile responsive
- All user-facing strings use `trans()`

---

## 7. UI Requirements

`Leaderboard.tsx` must include:

- Three tabs at the top
- Top 3 podium layout
- First place centered and largest
- Rank 4–50 list
- Pagination
- Sticky current-user rank banner
- Highlight current user
- Tailwind utility classes only
- `trans()` from the existing `@erag/lang-sync-inertia` setup

Components to create:

```txt
resources/js/Components/LeaderboardRow.tsx
resources/js/Components/PodiumCard.tsx
```

---

## 8. Translation Keys

Update only:

```txt
lang/en/leaderboard.php
lang/zh/leaderboard.php
lang/my/leaderboard.php
```

Add keys such as:

```php
'title'
'tab_all_time'
'tab_weekly'
'tab_monthly'
'rank'
'user'
'points'
'your_rank'
'points_to_next'
'privacy_hidden'
'no_users'
```

Rules:

- Do not delete old keys
- Show the diff for each file before saving
- Wait for confirmation before saving translation changes

---

## 9. Tests

Create a unit test for `PointsService` covering:

- Awarding points
- Revoking points
- Self-vote blocking
- Double-award idempotency check

Do not run migrations.

---

## 10. Required Execution Order

Each step must stop after completion. Continue only after the user says `continue`.

### Step 1

Show the SQL that the two new migrations will produce.

Do not create files.  
Do not run migrations.

Then stop.

---

### Step 2

After approval, create the migration files.

Do not run:

```bash
php artisan migrate
```

Then stop.

---

### Step 3

Create:

```txt
app/Services/PointsService.php
```

Include:

- `award()`
- `revoke()`
- Anti-self-vote check
- Idempotency protection
- Database transaction wrapping

Show the file.

Then stop.

---

### Step 4

Write a unit test for `PointsService` covering:

- Awarding
- Revoking
- Self-vote blocking
- Double-award idempotency

Then stop.

---

### Step 5

Rewrite:

```txt
app/Http/Controllers/LeaderboardController.php
```

Include:

- Three-tab logic
- Privacy filter
- Current user's rank
- 5-minute cache
- Pagination

Then stop.

---

### Step 6

Rewrite:

```txt
resources/js/Pages/Leaderboard.tsx
```

Include:

- Three tabs
- Podium
- Rank list
- Sticky user-rank banner
- Current-user highlight
- `trans()` keys

Then stop.

---

### Step 7

Create:

```txt
resources/js/Components/LeaderboardRow.tsx
resources/js/Components/PodiumCard.tsx
```

Then stop.

---

### Step 8

Update:

```txt
lang/en/leaderboard.php
lang/zh/leaderboard.php
lang/my/leaderboard.php
```

Show the diff before saving.

Do not delete old keys.

Then stop.

---

### Step 9

Run all tests and report results.

Do not run migrations.

Then stop.

---

### Step 10

Provide a final summary containing:

- Files changed
- Files created
- What to do next
- When to run migrations
- Where `PointsService` should later be wired
- Old translation keys that might be removable later

Do not remove old translation keys.

---

## 11. Final Reminders

- Do not run `php artisan migrate`
- Do not touch off-limits files
- Do not modify `AchievementService`
- Do not modify `LikeController`
- Do not modify `users.points`
- Do not delete old translation keys
- Keep `PointsService` dormant for now
- Ask before guessing when anything is ambiguous
- Mention improvements outside scope only in Step 10
- Begin with Step 1 only

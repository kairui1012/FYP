## 5.1.1.12 Leaderboard Unit Testing

### Leaderboard Page Loading

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| LP-01 | Open leaderboard page. | User is logged in and email is verified. | Leaderboard page is displayed. | `/leaderboard` route is inside `auth` + `verified` middleware group and renders `Leaderboard` page through `LeaderboardController@index`. | Pass |
| LP-02 | Open leaderboard page. | User is not logged in. | Access is blocked and user is redirected to login page. | Route is protected by `auth` middleware, so guest user cannot access leaderboard directly. | Pass |
| LP-03 | Open leaderboard page. | User is logged in but email is not verified. | Authenticated user can view leaderboard. | Route also requires `verified` middleware, so unverified authenticated user cannot access `/leaderboard`. | Failed |
| LP-04 | Open leaderboard page with invalid period query. | `period=yearly` | Invalid period is rejected. | `LeaderboardController@index` validates `period` with `Rule::in(['all_time','weekly','monthly'])`, so invalid value fails validation. | Pass |

Leaderboard Page Loading Testing Table

### Weekly Ranking

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| WR-01 | Open leaderboard with weekly period. | `period=weekly` | Ranking uses weekly points data. | Weekly ranking uses `points_transactions` sum where `created_at >= now()->subDays(7)`. | Pass |
| WR-02 | Check order for equal points. | Two users have same weekly points. | Stable tie-breaking is applied. | Query orders by `points DESC`, then `id ASC`; lower user ID appears higher for ties. | Pass |
| WR-03 | Check user with no weekly transactions. | User has no points transaction in last 7 days. | User still appears with 0 points in ranking dataset. | Left join + `COALESCE(SUM(...),0)` includes user with `0` points. | Pass |

Weekly Ranking Testing Table

### Monthly Ranking

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| MR-01 | Open leaderboard with monthly period. | `period=monthly` | Ranking uses monthly points data. | Monthly ranking uses `points_transactions` where `created_at >= now()->subDays(30)`. | Pass |
| MR-02 | Verify ranking list size. | Large user base. | Top users are limited for leaderboard display. | Backend caches and returns top 50 users (`MAX_RANK = 50`), with top 3 as podium and remaining rows paginated. | Pass |

Monthly Ranking Testing Table

### All-Time Ranking

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| AT-01 | Open leaderboard with all-time period. | `period=all_time` | Ranking uses cumulative total points per user. | All-time query uses `users.total_points as points`. | Pass |
| AT-02 | Verify rank and next-rank gap in current user panel. | Authenticated leaderboard user. | Current rank, points, and points-to-next are shown consistently with selected period. | `currentUser` payload computes `rank`, period-based `points`, and `pointsToNext` from same rankable query logic. | Pass |

All-Time Ranking Testing Table

### Leaderboard Visibility Toggle

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| VT-01 | Toggle leaderboard visibility. | Logged-in user clicks hide/show rank button. | `show_on_leaderboard` setting is updated. | `toggleVisibility` flips `show_on_leaderboard` boolean and saves user. | Pass |
| VT-02 | Check effect after hiding rank. | User toggles to hide. | User rank entry is fully removed from leaderboard list. | User still remains in ranking; identity is anonymized (`id=0`, blank name, null avatar, `is_anonymous=true`) instead of being removed. | Failed |
| VT-03 | Check cache invalidation after visibility change. | Toggle visibility once. | Leaderboard caches are refreshed. | Controller clears weekly/monthly/all-time top-50 caches and title cache keys after toggle. | Pass |

Leaderboard Visibility Toggle Testing Table

### Title Badge Toggle

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| BT-01 | Toggle title badge setting. | Logged-in user clicks title badge switch. | `show_leaderboard_badge` setting is updated. | `toggleTitleBadge` flips `show_leaderboard_badge` and saves. | Pass |
| BT-02 | Verify badge display when toggle is OFF. | Public leaderboard user with toggle OFF. | Title badge is not displayed beside username. | `leaderboard_title` is only attached when `show_on_leaderboard` and `show_leaderboard_badge` are both true; UI badge component returns null otherwise. | Pass |
| BT-03 | Verify title assignment source. | Top users in non-all-time tabs. | Period-specific titles are assigned from selected period ranking. | Title service uses all-time top 3 (`users.total_points`) only, independent of active period tab. | Failed |

Title Badge Toggle Testing Table

### Points History Display

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| PH-01 | Open leaderboard as logged-in user. | Authenticated user. | Personal points history panel is visible. | `Leaderboard.tsx` renders `LeaderboardPointsHistory` when `currentUserId` exists. | Pass |
| PH-02 | Check points history ordering and size. | User has many point transactions. | Most recent history is shown first with a cap. | Query orders by `created_at DESC` and limits to 30 records. | Pass |
| PH-03 | Check empty points history state. | User has no point transactions. | Empty-state message is displayed. | Component shows `leaderboard.no_points_history` message when list is empty. | Pass |

Points History Display Testing Table

### Ranking Privacy and Empty State Handling

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| RP-01 | View an anonymous leaderboard row. | User has `show_on_leaderboard = false`. | Identity is hidden and row is not profile-clickable. | Row displays anonymous label and `?` avatar; click handler returns immediately for anonymous rows. | Pass |
| RP-02 | Open leaderboard when there are no rows to show on current page. | Paginated rows list is empty. | Ranking empty-state message appears. | Ranking section renders `leaderboard.no_users` message when `rows.data.length === 0`. | Pass |
| RP-03 | Review pagination controls behavior. | User is on first/last page. | Previous/Next controls disable correctly. | Buttons disable using `prev_page_url` and `next_page_url` null checks from paginator data. | Pass |

Ranking Privacy and Empty State Handling Testing Table

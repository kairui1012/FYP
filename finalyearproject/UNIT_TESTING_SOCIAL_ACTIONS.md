## 5.1.1.7 Social Actions Unit Testing

System area:
Social actions

Responsibility:
Provides engagement and social graph behavior.

### Post Like and Unlike

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| PLU-01 | Like a post. | User is not logged in. | User is redirected to login page. | The like route is inside the `auth` and `verified` middleware group, so guest users are redirected before `LikeController@toggle` runs. | Pass |
| PLU-02 | Like a post. | Logged-in user has not liked the post before. | A like record is created and the like count increases. | `LikeController@toggle` creates a `Like` record with the current `user_id` and `post_id`, returns `liked = true` for JSON requests, and recalculates `likes_count` from `$post->likes()->count()`. | Pass |
| PLU-03 | Unlike a post. | Logged-in user has already liked the post. | Existing like is removed and the like count decreases. | `LikeController@toggle` finds the existing like by `user_id` and `post_id`, deletes it, returns `liked = false`, and recalculates the like count. | Pass |
| PLU-04 | Like the same post repeatedly. | Same user sends repeated like requests for the same post. | Duplicate likes should not be stored. | The controller toggles the existing like instead of creating another record, and the `likes` table also has a unique key on `user_id` and `post_id`. | Pass |
| PLU-05 | Like own post. | Post author likes their own post. | Like may be recorded, but self-awarded points should not be granted. | The like record is allowed, but `PointsService::award()` prevents self-awards when the actor and receiver are the same user. | Pass |

Post Like and Unlike Testing Table

### Post Save and Unsave

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| PSU-01 | Save a post. | User is not logged in. | User is redirected to login page. | The save route is inside the authenticated route group, so guest users cannot call `PostSaveController@toggle`. | Pass |
| PSU-02 | Save a post. | Logged-in user has not saved the post before. | Post is bookmarked and save count increases. | `PostSaveController@toggle` creates or retrieves the user's default `BookmarkFolder`, creates a `BookmarkItem`, returns `saved = true`, and returns the updated `saves_count`. | Pass |
| PSU-03 | Remove a saved post. | Logged-in user has already saved the post. | Bookmark is removed and save count decreases. | The controller finds the existing `BookmarkItem`, deletes it, returns `saved = false`, and recalculates save count through `$post->bookmarkItems()->count()`. | Pass |
| PSU-04 | Save the same post repeatedly. | Same user sends repeated save requests for the same post. | Duplicate saved records should not be stored. | The controller toggles the existing bookmark item, and the `bookmark_items` table has a unique key on `user_id` and `post_id`. | Pass |
| PSU-05 | Open bookmarks page. | User has saved posts in bookmark folders. | Saved posts are listed with saved state and folder data. | `PostBookmarkController@index` loads posts through bookmark folders, serializes `is_saved`, `saves_count`, `saved_at`, and `bookmark_folder_id`, and renders `StudyFolderPage`. | Pass |
| PSU-06 | Save a post and expect saved-post achievements to progress. | Current save route is used. | Saved-post achievement counters should reflect bookmarked posts. | `PostSaveController` writes to `bookmark_items`, but `AchievementService::evaluateAchievements()` counts `PostSave` records from the legacy `post_saves` table, so collector-style saved-post achievements do not reflect current bookmarks. | Failed |

Post Save and Unsave Testing Table

### User Follow and Unfollow

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| UFU-01 | Follow a user. | User is not logged in. | User is redirected to login page. | The follow route is inside the authenticated route group, so guest users cannot call `FollowerController@toggle`. | Pass |
| UFU-02 | Follow another user. | Logged-in user is not already following the target user. | Follow relationship is created. | `FollowerController@toggle` attaches the target user ID through the authenticated user's `following()` relationship and returns `status = followed` with `is_following = true`. | Pass |
| UFU-03 | Unfollow another user. | Logged-in user already follows the target user. | Follow relationship is removed. | The controller detects the existing relationship, detaches it, and returns `status = unfollowed` with `is_following = false`. | Pass |
| UFU-04 | Follow the same user repeatedly. | Same follower and target user are used. | Duplicate follow relationships should not be stored. | The controller toggles an existing relationship, and the `follows` table has a unique key on `follower_id` and `following_id`. | Pass |
| UFU-05 | Follow own account. | Authenticated user ID matches target user ID. | Request is rejected. | `FollowerController@toggle` returns a 422 JSON response with `status = invalid` and `is_following = false`; frontend follow buttons are also hidden for own profile and own posts. | Pass |
| UFU-06 | Follow user from profile or post UI. | Target user is not the current user. | Follow button updates follow state. | `ProfileHeader`, `HomeFeedSection`, and `PostBackAuthorHeader` render `BtnFollow` only for other users and update local follow state after the JSON response. | Pass |

User Follow and Unfollow Testing Table

### Social Count Updates

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SCU-01 | View post like count. | Post has likes. | Like count is shown on feed and detail pages. | Feed/detail queries use `withCount(['likes', ...])`, serialization exposes `likes_count`, and React like buttons render the count. | Pass |
| SCU-02 | Like or unlike from the post detail page. | User clicks the like button. | UI count changes and backend count remains correct. | `usePostContentController` applies an optimistic count update, posts to the like route, and then refreshes state from the returned Inertia `post` payload. | Pass |
| SCU-03 | Like or unlike from feed pages. | User clicks the like button in the feed. | Feed count updates without duplicate requests. | `usePostInteractions` tracks loading post IDs, prevents repeated clicks while a request is pending, and refreshes like state from returned posts. | Pass |
| SCU-04 | View post save count. | Post has bookmark items. | Save count is shown on feed, detail, and bookmark pages. | Queries count `bookmarkItems as saves_count`, serialization exposes `saves_count`, and `BtnSave` displays the count. | Pass |
| SCU-05 | View profile social counts. | User has followers and following records. | Profile displays follower and following totals. | `ProfilePageController@show` returns `followers_count` and `following_count` using relationship counts, and `ProfileStats` displays the follower count. | Pass |
| SCU-06 | Open following feed. | Current user follows other users. | Posts from followed users are displayed. | `FollowerController@index` collects followed user IDs, queries posts from those users, excludes blocked authors, and renders the feed with like/save/follow states. | Pass |

Social Count Updates Testing Table

### Profile Badge Display

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| PBD-01 | Open profile page. | User has earned point badges. | Earned badges are displayed on the profile. | `ProfilePageController@show` calls `AchievementService::syncUser()`, maps earned `Badge` records, and `ProfileBadgesTab` displays them. | Pass |
| PBD-02 | Open profile page with no earned badges. | User has no badge records. | Empty badge state is displayed. | `ProfileBadgesTab` renders the no-badges message when `earnedBadges.length === 0`. | Pass |
| PBD-03 | View featured badges. | User has records in `user_featured_badges`. | Featured badges are displayed near the profile header. | Controller returns `featured_badge_ids`; React filters earned badges by those IDs and renders `FeaturedBadgeChip` in `ProfileHeader`. | Pass |
| PBD-04 | Feature badges from own profile. | Profile owner has earned badges and selects badges in the editor. | Selected badges are saved as featured badges. | `UserFeaturedBadgeController@update` allows only the profile owner, deletes previous featured records, and recreates featured badge records from submitted IDs. | Pass |
| PBD-05 | Feature badges for another user. | Authenticated user is not the profile owner. | Request is forbidden. | `UserFeaturedBadgeController@update` returns 403 when the viewer ID does not match the profile user ID. | Pass |
| PBD-06 | Submit unearned badge IDs. | Owner submits badge IDs that are not earned. | Unearned badges should not be featured. | The controller intersects submitted IDs with `$user->badges()` before saving, so unearned badges are ignored. | Pass |
| PBD-07 | Enforce featured badge limit consistently. | Direct request submits five earned badge IDs. | Limit should match the profile editor limit of three featured badges. | The React editor limits selection to 3, but the backend allows up to 5 through `MAX_FEATURED = 5`, so direct API requests can save more badges than the UI limit. | Failed |

Profile Badge Display Testing Table

### Authentication and Duplicate Action Control

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| ADC-01 | Access like, save, follow, or featured-badge routes. | Guest user sends request directly. | Request is blocked by authentication. | All four routes are inside the `auth` and `verified` middleware group. | Pass |
| ADC-02 | Send like while a like request is pending. | User clicks like repeatedly in the UI. | Repeated click is ignored until request finishes. | Feed and detail controllers track loading state and disable or ignore repeated like requests while pending. | Pass |
| ADC-03 | Send save while a save request is pending. | User clicks save repeatedly in the UI. | Repeated click is ignored until request finishes. | `savingPostIds` and `saving` state prevent duplicate frontend save requests while the previous request is pending. | Pass |
| ADC-04 | Send follow while a follow request is pending. | User clicks follow repeatedly in the UI. | Repeated click is ignored until request finishes. | Follow UI tracks `followingUserIds`, `followLoading`, or `followingAuthorLoading` and disables repeat actions while pending. | Pass |
| ADC-05 | Database-level duplicate control. | Duplicate like, bookmark, follow, or featured-badge records are attempted. | Duplicate rows should not be stored. | The schema has unique keys for `likes(user_id, post_id)`, `bookmark_items(user_id, post_id)`, `follows(follower_id, following_id)`, and `user_featured_badges(user_id, badge_id)`. | Pass |

Authentication and Duplicate Action Control Testing Table

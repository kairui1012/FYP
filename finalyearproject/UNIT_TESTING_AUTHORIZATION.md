## 5.1.1.2 Authorization Unit Testing

System area:
Authorization

Responsibility:
Prevents unauthorized access to protected routes, admin-only routes, blocked accounts, and teacher/admin-only behavior.

### Authenticated Route Protection

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| ARP-01 | Open `/homePage`. | User is not logged in. | User is redirected to login page. | Route is inside `auth` middleware group, so guest user is redirected to login page. | Pass |
| ARP-02 | Open `/createPostPage`. | User is not logged in. | User is redirected to login page. | Route is inside `auth` and `verified` middleware group, so guest user is redirected to login page. | Pass |
| ARP-03 | Open `/posts/{post}`. | User is not logged in. | User is redirected to login page. | Route is inside `auth` and `verified` middleware group, so guest user is redirected to login page. | Pass |
| ARP-04 | Open `/settings/profile`. | User is not logged in. | User is redirected to login page. | Route is inside `auth` middleware group, so guest user is redirected to login page. | Pass |
| ARP-05 | Open `/settings/profile`. | User is logged in. | Profile settings page is displayed. | Route only requires `auth`, so authenticated user can access the page. | Pass |

Authenticated Route Protection Testing Table

### Verified Route Protection

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| VRP-01 | Open `/homePage`. | Authenticated user has not verified email. | User should be redirected to email verification page. | Route uses `verified` middleware, but `User` model does not implement `MustVerifyEmail`, so the user can access `/homePage`. | Failed |
| VRP-02 | Open `/settings/password`. | Authenticated user has not verified email. | User should be redirected to email verification page. | Route uses `verified` middleware, but `User` model does not implement `MustVerifyEmail`, so the user can access `/settings/password`. | Failed |
| VRP-03 | Open `/settings/teacher-certification`. | Authenticated user has not verified email. | User should be redirected to email verification page. | Route uses `verified` middleware, but email verification is not enforced because `MustVerifyEmail` is not implemented. | Failed |
| VRP-04 | Submit teacher application. | Authenticated user has not verified email. | Submission should be blocked until email is verified. | Route uses `verified`, but the middleware does not block the user due to missing `MustVerifyEmail` implementation. | Failed |
| VRP-05 | Open `/settings/profile`. | Authenticated user has not verified email. | Page can be accessed if only authentication is required. | Route only uses `auth`, so profile settings page is accessible. | Pass |

Verified Route Protection Testing Table

### Admin Middleware Access Control

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| AMA-01 | Open `/admin/users`. | User is not logged in. | User is redirected to login page. | Admin routes use `auth` before `admin`, so guest user is redirected to login page. | Pass |
| AMA-02 | Open `/admin/users`. | Logged-in student user. | Access is denied. | `AdminMiddleware` checks `role !== 'admin'` and returns 403. | Pass |
| AMA-03 | Open `/admin/users`. | Logged-in teacher user. | Access is denied. | `AdminMiddleware` checks `role !== 'admin'` and returns 403. | Pass |
| AMA-04 | Open `/admin/users`. | Logged-in admin user. | Admin users page is displayed. | User role is `admin`, so the request continues to `AdminController@users`. | Pass |
| AMA-05 | Open `/admin/reports`. | Logged-in non-admin user. | Access is denied. | `AdminMiddleware` returns 403 for non-admin users. | Pass |
| AMA-06 | Open `/admin/teacher-applications`. | Logged-in admin user. | Teacher applications page is displayed. | Admin user passes `auth` and `admin` middleware. | Pass |

Admin Middleware Access Control Testing Table

### Admin Route Group Protection

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| ARG-01 | Update a user role. | Logged-in student submits `/admin/users/{user}/role`. | Access is denied. | Route is protected by `auth` and `admin`; non-admin receives 403. | Pass |
| ARG-02 | Update a user role. | Logged-in admin submits valid role: `student`, `teacher`, or `admin`. | User role is updated. | `AdminController@updateUserRole` validates role and updates the user. | Pass |
| ARG-03 | Block a user account. | Logged-in admin blocks a student or teacher. | Target account is blocked. | `toggleBlock` updates `is_blocked` for non-admin users. | Pass |
| ARG-04 | Block an admin account. | Logged-in admin tries to block another admin. | Admin account should not be blocked. | `toggleBlock` returns error message `Cannot block an admin account.` and does not update the admin user. | Pass |
| ARG-05 | Approve teacher application. | Logged-in admin approves application. | Application is approved and user becomes teacher. | `approveApplication` sets status to `approved` and updates user role to `teacher`. | Pass |
| ARG-06 | Reject teacher application. | Logged-in admin rejects application with note. | Application is rejected and note is saved. | `rejectApplication` sets status to `rejected` and stores `admin_note`. | Pass |
| ARG-07 | Toggle teacher verification. | Application user is approved teacher. | Teacher verification status is toggled. | `toggleVerification` updates the teacher user's `is_verified` value. | Pass |
| ARG-08 | Toggle teacher verification. | Application user is not teacher. | Verification should not be toggled. | Controller returns error message `User must be an approved teacher to toggle verification.` | Pass |
| ARG-09 | Download verification document. | Logged-in admin requests existing document. | Document is displayed or downloaded. | Admin route checks storage file and returns file response. | Pass |

Admin Route Group Protection Testing Table

### Blocked User Middleware

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| BUM-01 | Log in using email and password. | User account has `is_blocked = true`. | Login is rejected. | Fortify custom authentication returns `null` when `is_blocked` is true, so authentication fails. | Pass |
| BUM-02 | Log in using Google. | Existing Google-linked user has `is_blocked = true`. | Login is rejected with blocked account error. | Google controller redirects to login with `auth.blocked` error before calling `Auth::login`. | Pass |
| BUM-03 | Log in using Google. | Google email matches existing blocked account. | Login is rejected with blocked account error. | Google controller checks the matched user and redirects to login with `auth.blocked` error. | Pass |
| BUM-04 | Visit protected page after account is blocked. | User was already logged in before being blocked. | User is logged out and redirected to login page. | `EnsureUserNotBlocked` logs out the web guard, invalidates the session, regenerates CSRF token, and redirects to login with email error. | Pass |
| BUM-05 | Visit admin route after admin account becomes blocked. | Blocked admin is still authenticated in browser. | User is logged out before admin page loads. | Global web middleware runs before controller access and logs out blocked authenticated user. | Pass |
| BUM-06 | Visit protected page. | Authenticated user has `is_blocked = false`. | Request continues normally. | Middleware does not log out the user and passes request to the next middleware/controller. | Pass |

Blocked User Middleware Testing Table

### Teacher Material Publishing Gate

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| TMP-01 | Open create post page. | Logged-in student user. | Page loads but study material publishing should not be allowed. | Controller sends `canPublishStudyMaterial = false` based on `canPublishStudyMaterials()`. | Pass |
| TMP-02 | Open create post page. | Logged-in teacher user. | Study material publishing should be allowed. | Controller sends `canPublishStudyMaterial = true`. | Pass |
| TMP-03 | Open create post page. | Logged-in admin user. | Study material publishing should be allowed. | Controller sends `canPublishStudyMaterial = true`. | Pass |
| TMP-04 | Submit material post. | Student user submits `post_type = material`. | Request is rejected. | `PostCreateController@store` throws validation error: `Only admins and teachers can publish Study Materials.` | Pass |
| TMP-05 | Submit material post. | Teacher user submits valid material data. | Material post is created. | Teacher passes `canPublishStudyMaterials()` and material is created. | Pass |
| TMP-06 | Submit material post. | Admin user submits valid material data. | Material post is created. | Admin passes `canPublishStudyMaterials()` and material is created. | Pass |
| TMP-07 | Edit material post. | Teacher edits own material. | Update is allowed. | Controller allows update because user can publish materials and is the owner. | Pass |
| TMP-08 | Edit material post. | Teacher edits another user's material. | Access is denied. | Controller aborts with 403 because teacher is not owner and not admin. | Pass |
| TMP-09 | Edit material post. | Admin edits another user's material. | Update is allowed. | Controller allows admin to update material even when not owner. | Pass |
| TMP-10 | Delete material post. | Admin deletes another user's material. | Admin should be allowed only if delete authorization supports admin. | Actual delete logic only allows post owner; admin who is not owner receives 403. | Failed |
| TMP-11 | Open teacher material insights. | Student user. | Access is denied. | `teacherMaterialInsights` checks `canPublishStudyMaterials()` and aborts with 403. | Pass |
| TMP-12 | Open teacher material insights. | Teacher or admin user. | Insights page is displayed. | Teacher and admin pass `canPublishStudyMaterials()`. | Pass |

Teacher Material Publishing Gate Testing Table

### Teacher Application and Certification Authorization

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| TAC-01 | Submit teacher application. | Unauthenticated user. | User is redirected to login page. | Route uses `auth` middleware, so unauthenticated users cannot submit. | Pass |
| TAC-02 | Submit teacher application. | Authenticated student user. | Application is created. | Route allows any authenticated user and creates `TeacherApplication`. | Pass |
| TAC-03 | Open teacher certification settings. | Unauthenticated user. | User is redirected to login page. | Route uses `auth` and `verified`; unauthenticated users are redirected by `auth`. | Pass |
| TAC-04 | Open teacher certification settings. | Authenticated user. | Page is displayed. | Controller loads the user's latest teacher application and documents. | Pass |
| TAC-05 | View teacher certification document. | Authenticated owner of the document. | Document is displayed. | Controller confirms document belongs to the authenticated user's application before returning file. | Pass |
| TAC-06 | View teacher certification document. | Authenticated user who does not own the document. | Access is denied. | Controller searches by current user ID and document application ID; non-owner gets 404. | Pass |
| TAC-07 | View teacher certification document. | Admin viewing through admin download route. | Admin can access document. | Admin route is protected by `auth` and `admin`, then returns file if it exists. | Pass |

Teacher Application and Certification Authorization Testing Table

This section verifies that teacher application submission and teacher certification document access are protected correctly. TAC-01 confirms that the teacher application submission route requires authentication before a request can be processed. TAC-02 confirms that a logged-in student can submit a teacher application because the route accepts authenticated users and creates a `TeacherApplication` record using the current user's ID.

TAC-03 confirms that the teacher certification settings page is protected by the `auth` and `verified` middleware. TAC-04 confirms that an authenticated user can access the certification settings page because the controller loads the user's latest teacher application and related documents before rendering the page.

TAC-05 and TAC-06 verify document ownership control. The controller checks whether the requested document belongs to the current user's teacher application. If the document belongs to the current user, the file is displayed. If the document belongs to another user, the matching application cannot be found and the request returns 404. TAC-07 verifies admin document access through the admin download route, which is protected by both `auth` and `admin` middleware and returns the file only when it exists.
